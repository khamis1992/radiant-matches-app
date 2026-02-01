const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Credentials
const credentials = {
  email: 'noura.demo@glambook.app',
  password: 'Demo@123'
};

const serverUrl = 'http://localhost:8080';

// Screenshot configuration
const screenshotsDir = path.join(__dirname, 'images', 'system');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function takeScreenshots() {
  console.log('📸 Starting screenshot automation with mobile viewport...');
  console.log(`🌐 Connecting to: ${serverUrl}`);
  console.log('📱 Using iPhone dimensions with dock at bottom\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  try {
    // 1. Navigate to login page
    console.log('🔑 Taking login page screenshot...');
    await page.goto(`${serverUrl}/auth`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login.png'),
      fullPage: false 
    });
    console.log('✅ Login page captured\n');
    
    // 2. Login
    console.log('🔓 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // 3. Dashboard screenshot - scroll to top first to show dock
    console.log('📊 Taking dashboard screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-dashboard.png'),
      fullPage: false 
    });
    console.log('✅ Dashboard captured\n');
    
    // 4. Services page
    console.log('💄 Taking services page screenshot...');
    await page.goto(`${serverUrl}/artist-services`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-services.png'),
      fullPage: false 
    });
    console.log('✅ Services page captured\n');
    
    // 5. Bookings page
    console.log('📅 Taking bookings page screenshot...');
    await page.goto(`${serverUrl}/artist-bookings`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-bookings.png'),
      fullPage: false 
    });
    console.log('✅ Bookings page captured\n');
    
    // 6. Portfolio/Gallery page
    console.log('🖼️ Taking portfolio page screenshot...');
    await page.goto(`${serverUrl}/artist-gallery`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-portfolio.png'),
      fullPage: false 
    });
    console.log('✅ Portfolio page captured\n');
    
    // 7. Products page
    console.log('🛍️ Taking products page screenshot...');
    await page.goto(`${serverUrl}/artist-products`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-products.png'),
      fullPage: false 
    });
    console.log('✅ Products page captured\n');
    
    // 8. Wallet page
    console.log('💰 Taking wallet page screenshot...');
    await page.goto(`${serverUrl}/wallet`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-wallet.png'),
      fullPage: false 
    });
    console.log('✅ Wallet page captured\n');
    
    // 9. Analytics/Reports page
    console.log('📈 Taking analytics page screenshot...');
    await page.goto(`${serverUrl}/analytics-dashboard`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '08-analytics.png'),
      fullPage: false 
    });
    console.log('✅ Analytics page captured\n');
    
    // 10. Settings/Profile page
    console.log('⚙️ Taking settings page screenshot...');
    await page.goto(`${serverUrl}/artist-profile`, { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '09-settings.png'),
      fullPage: false 
    });
    console.log('✅ Settings page captured\n');
    
    console.log('🎉 All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    console.log('📱 All screenshots show mobile viewport with dock at bottom');
    
  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

// Run immediately
takeScreenshots().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});