const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Go to root
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  // Wait to load, then click the central 'Performance Boost' card or 'Treino' tab
  // Emulate clicking center of the screen first to bypass selection if any.
  await page.mouse.click(500, 800);
  await page.waitForTimeout(1000);
  
  // Or look for Treino tab
  await page.evaluate(() => {
    // Try to find Tab "Treino"
    const els = Array.from(document.querySelectorAll('div, span, text'));
    const treino = els.find(e => e.innerText === 'TREINO' || e.innerText === 'Treino' || e.textContent?.includes('Treino'));
    if (treino) treino.click();
  });
  await page.waitForTimeout(2000);

  // 1. 360px x 800px
  await page.setViewport({ width: 360, height: 800 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '../../../.gemini/antigravity/brain/41c38ed0-33e6-4eea-bd49-3ae60d1112a3/treino_360_real.png' });
  console.log('Saved 360px');

  // 2. 390px x 844px
  await page.setViewport({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '../../../.gemini/antigravity/brain/41c38ed0-33e6-4eea-bd49-3ae60d1112a3/treino_390_real.png' });
  console.log('Saved 390px');

  // 3. 430px x 932px
  await page.setViewport({ width: 430, height: 932 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '../../../.gemini/antigravity/brain/41c38ed0-33e6-4eea-bd49-3ae60d1112a3/treino_430_real.png' });
  console.log('Saved 430px');

  await browser.close();
})();
