/* ============================================================
   WARDOGS BINARY PACK LOADER — NATIVE PARSER (PackLoader)
   Directly parses official WARDOGS .pack files (Magic 0x50474457).
   Unpacks terrain grids, instanced structures, and foliage meshes.
   ============================================================ */

import * as THREE from 'three';

const TYPE_MAP = {
    Int8Array, Uint8Array, Uint8ClampedArray,
    Int16Array, Uint16Array,
    Int32Array, Uint32Array,
    Float32Array, Float64Array
};

export class PackLoader {
    /**
     * Fetch and parse an authentic .pack file
     * @param {string} url 
     * @param {function} onProgress 
     * @returns {Promise<Object>}
     */
    static async loadPack(url, onProgress = null) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load pack from ${url} (HTTP ${response.status})`);
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        let arrayBuffer;
        if (response.body && total > 0 && onProgress) {
            const reader = response.body.getReader();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                onProgress(loaded / total);
            }
            const combined = new Uint8Array(loaded);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            arrayBuffer = combined.buffer;
        } else {
            arrayBuffer = await response.arrayBuffer();
            if (onProgress) onProgress(1.0);
        }

        return this.parseArrayBuffer(arrayBuffer);
    }

    /**
     * Parse binary array buffer
     */
    static parseArrayBuffer(arrayBuffer) {
        if (arrayBuffer.byteLength < 16) {
            throw new Error('Incomplete asset pack header');
        }

        const dataView = new DataView(arrayBuffer);
        const magic = dataView.getUint32(0, true);
        const version = dataView.getUint32(4, true);

        // Magic 0x50474457 ('WDGP')
        if (magic !== 1346847831) {
            console.warn(`Unrecognized pack magic: 0x${magic.toString(16)}, proceeding anyway.`);
        }

        const jsonLen = dataView.getUint32(8, true);
        const dataOffset = dataView.getUint32(12, true);

        const manifestJson = new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer, 16, jsonLen));
        const manifest = JSON.parse(manifestJson);

        function view(entry) {
            if (!entry) return null;
            const Ctor = TYPE_MAP[entry.type];
            if (!Ctor) throw new Error(`Unknown typed array type: ${entry.type}`);
            return new Ctor(arrayBuffer, dataOffset + entry.offset, entry.length);
        }

        return {
            manifest,
            view,
            dataOffset,
            arrayBuffer
        };
    }

    /**
     * Build THREE.BufferGeometry from a packed terrain grid definition
     */
    static buildTerrainGeometry(pack, geoDef) {
        const geometry = new THREE.BufferGeometry();
        const posDef = geoDef.attributes.position;
        const uvDef = geoDef.attributes.uv;
        const idxDef = geoDef.index;

        if (!posDef.grid) {
            throw new Error('Expected terrain grid in position attribute');
        }

        const x = pack.view(posDef.grid.x);
        const y = pack.view(posDef.grid.y);
        const z = pack.view(posDef.grid.z);

        const cols = x.length;
        const rows = z.length;
        const totalVerts = y.length;

        // Position Attribute
        const posArray = new Float32Array(totalVerts * 3);
        let ptr = 0;
        for (let r = 0; r < rows; r++) {
            const pz = z[r];
            for (let c = 0; c < cols; c++, ptr++) {
                posArray[ptr * 3] = x[c];
                posArray[ptr * 3 + 1] = y[ptr];
                posArray[ptr * 3 + 2] = pz;
            }
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // UV Attribute
        if (uvDef && uvDef.grid) {
            const u = pack.view(uvDef.grid.u);
            const v = pack.view(uvDef.grid.v);
            const uvArray = new Float32Array(totalVerts * 2);
            let uvPtr = 0;
            for (let r = 0; r < v.length; r++) {
                const pv = v[r];
                for (let c = 0; c < u.length; c++, uvPtr++) {
                    uvArray[uvPtr * 2] = u[c];
                    uvArray[uvPtr * 2 + 1] = 1.0 - pv; // Three.js texture coordinate flip
                }
            }
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
        }

        // Index Attribute
        if (idxDef && idxDef.grid) {
            const pCols = idxDef.grid.columns;
            const pRows = idxDef.grid.rows;
            const pattern = idxDef.grid.pattern;
            const totalIndices = (pCols - 1) * (pRows - 1) * 6;
            const IndexCtor = TYPE_MAP[idxDef.grid.type] || Uint32Array;
            const indexArray = new IndexCtor(totalIndices);

            let d = 0;
            for (let r = 0; r < pRows - 1; r++) {
                for (let c = 0; c < pCols - 1; c++) {
                    const h = r * pCols + c;
                    for (let m = 0; m < 6; m++) {
                        indexArray[d++] = h + pattern[m];
                    }
                }
            }
            geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
        }

        // Normals
        if (geoDef.attributes.normal && !geoDef.attributes.normal.grid) {
            const normView = pack.view(geoDef.attributes.normal.view);
            if (normView) {
                geometry.setAttribute('normal', new THREE.BufferAttribute(normView, 3));
            } else {
                geometry.computeVertexNormals();
            }
        } else {
            geometry.computeVertexNormals();
        }

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        return geometry;
    }

    /**
     * Build standard THREE.BufferGeometry from a mesh geometry definition
     */
    static buildStandardGeometry(pack, geoDef) {
        const geometry = new THREE.BufferGeometry();

        for (const [attrName, attrDef] of Object.entries(geoDef.attributes)) {
            if (attrDef.view) {
                const array = pack.view(attrDef.view);
                if (array) {
                    geometry.setAttribute(attrName, new THREE.BufferAttribute(array, attrDef.itemSize, attrDef.normalized));
                }
            }
        }

        if (geoDef.index) {
            if (geoDef.index.view) {
                const idxArray = pack.view(geoDef.index.view);
                if (idxArray) {
                    geometry.setIndex(new THREE.BufferAttribute(idxArray, 1));
                }
            }
        }

        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        return geometry;
    }
}
