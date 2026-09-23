const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capture() {
  console.log('🚀 Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. Home Desktop
  console.log('📸 01_home_desktop.png');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_desktop.png') });

  // 2. Mobile View
  console.log('📸 02_home_mobile.png');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_home_mobile.png') });

  // Reset to desktop viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  // 3. CTA Section
  console.log('📸 03_cta_section.png');
  const ctaSection = await page.$('.cta-section');
  if (ctaSection) {
    await ctaSection.scrollIntoView();
    await sleep(600);
    await ctaSection.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_cta_section.png') });
  }

  // 4. Shop Catalog
  console.log('📸 04_shop_catalog.png');
  await page.goto('http://localhost:3000/shop.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_shop_catalog.png') });

  // 5. Product Detail Modal
  console.log('📸 05_product_detail.png');
  const firstCard = await page.$('.product-card');
  if (firstCard) {
    await firstCard.click();
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_product_detail.png') });
  }

  // 6. Checkout GCash / Cart Modal
  console.log('📸 06_checkout_gcash.png');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await page.evaluate(() => {
    if (window.DB) {
      window.DB.addToCart('prod_001', 1);
      if (typeof window.openCartModal === 'function') window.openCartModal();
    }
  });
  await sleep(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_checkout_gcash.png') });

  // 13. Maker Profile Section
  console.log('📸 13_maker_profile.png');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const makerCard = await page.$('.hero-portfolio-card-wrap');
  if (makerCard) {
    await makerCard.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_maker_profile.png') });
  }

  // 15. After Sales Chat Widget
  console.log('📸 15_after_sales_chat.png');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await sleep(800);
  await page.evaluate(() => {
    const btn = document.getElementById('mbm-support-toggle');
    if (btn) btn.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_after_sales_chat.png') });

  // 11. Customer Receipt
  console.log('📸 11_customer_receipt.png');
  await page.goto('http://localhost:3000/receipt.html', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_customer_receipt.png') });

  // 12. Admin Login
  console.log('📸 12_admin_login.png');
  await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_admin_login.png') });

  // Setup Admin Session for Admin Pages
  await page.evaluate(() => {
    const sess = {
      token: 'admin_live_token_' + Date.now(),
      username: 'admin_madebymitzi',
      email: 'madebymitzi26@gmail.com',
      loginAt: new Date().toISOString(),
      expiresAt: Date.now() + 864000000
    };
    sessionStorage.setItem('mbm_admin_session', JSON.stringify(sess));
    localStorage.setItem('mbm_admin_persistent_session', JSON.stringify(sess));
  });

  // 7. Admin Dashboard
  console.log('📸 07_admin_dashboard.png');
  await page.goto('http://localhost:3000/admin/dashboard.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_admin_dashboard.png') });

  // 8. Admin Orders
  console.log('📸 08_admin_orders.png');
  await page.goto('http://localhost:3000/admin/orders.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_orders.png') });

  // 9. Admin Products
  console.log('📸 09_admin_products.png');
  await page.goto('http://localhost:3000/admin/products.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_products.png') });

  // 14. PDF Direct Uploader Modal
  console.log('📸 14_pdf_direct_upload.png');
  await page.evaluate(() => {
    if (typeof window.openProductModal === 'function') {
      window.openProductModal();
      const pdfEl = document.getElementById('prod-pdf') || document.querySelector('.pdf-dropzone') || document.getElementById('pdf-file-card');
      if (pdfEl) pdfEl.scrollIntoView({ block: 'center' });
    }
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_pdf_direct_upload.png') });

  // 10. Admin Settings
  console.log('📸 10_admin_settings.png');
  await page.goto('http://localhost:3000/admin/settings.html', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_admin_settings.png') });

  await browser.close();
  console.log('✨ All 15 screenshots captured successfully with the new UI!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
