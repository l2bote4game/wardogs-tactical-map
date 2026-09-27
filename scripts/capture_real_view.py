import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        print("Navigating to wardogs.n4lab.dev...")
        await page.goto("https://wardogs.n4lab.dev/?lang=ru&map=ozeti&mode=view", timeout=60000)
        
        # Wait for loading dialog to disappear
        print("Waiting for map to load...")
        try:
            await page.wait_for_selector("text=100%", timeout=45000)
            print("Reached 100%!")
        except Exception:
            pass
        
        # Wait until progress modal is hidden
        await page.wait_for_timeout(10000)
        
        out_path = "C:/Users/z/Desktop/wardogs-tactical-map/archive/qa/ref_n4lab_real_view.png"
        await page.screenshot(path=out_path)
        print(f"Captured {out_path}")
        await browser.close()

asyncio.run(run())
