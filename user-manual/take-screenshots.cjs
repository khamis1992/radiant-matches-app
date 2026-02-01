const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Credentials
const credentials = {
  email: 'noura.demo@glambook.app',
  password: 'Demo@123'
};

// Screenshot configuration
const screenshotsDir = path.join(__dirname, 'images', 'system');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Start dev server
console.log('🚀 Starting development server...');
const devServer = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe',
  shell: true
});

let serverUrl = null;

devServer.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Extract URL from output
  const urlMatch = output.match(/http:\/\/localhost:\d+/);
  if (urlMatch && !serverUrl) {
    serverUrl = urlMatch[0];
    console.log(`✅ Server started at: ${serverUrl}`);
    setTimeout(takeScreenshots, 5000); // Wait 5 seconds for server to fully start
  }
});

devServer.stderr.on('data', (data) => {
  console.error(data.toString());
});

async function takeScreenshots() {
  console.log('📸 Starting screenshot automation...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  
  try {
    // 1. Navigate to login page
    console.log('🔑 Taking login page screenshot...');
    await page.goto(`${serverUrl}/auth`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-login.png'),
      fullPage: false 
    });
    
    // 2. Login
    console.log('🔓 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', credentials.email);
    await page.fill('input[type="password"], input[name="password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // 3. Dashboard screenshot
    console.log('📊 Taking dashboard screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-dashboard.png'),
      fullPage: true 
    });
    
    // 4. Services page
    console.log('💄 Taking services page screenshot...');
    await page.goto(`${serverUrl}/artist-services`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-services.png'),
      fullPage: true 
    });
    
    // 5. Bookings page
    console.log('📅 Taking bookings page screenshot...');
    await page.goto(`${serverUrl}/artist-bookings`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-bookings.png'),
      fullPage: true 
    });
    
    // 6. Portfolio/Gallery page
    console.log('🖼️ Taking portfolio page screenshot...');
    await page.goto(`${serverUrl}/artist-gallery`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-portfolio.png'),
      fullPage: true 
    });
    
    // 7. Products page
    console.log('🛍️ Taking products page screenshot...');
    await page.goto(`${serverUrl}/artist-products`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-products.png'),
      fullPage: true 
    });
    
    // 8. Wallet page
    console.log('💰 Taking wallet page screenshot...');
    await page.goto(`${serverUrl}/wallet`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-wallet.png'),
      fullPage: true 
    });
    
    // 9. Analytics/Reports page
    console.log('📈 Taking analytics page screenshot...');
    await page.goto(`${serverUrl}/analytics-dashboard`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '08-analytics.png'),
      fullPage: true 
    });
    
    // 10. Settings/Profile page
    console.log('⚙️ Taking settings page screenshot...');
    await page.goto(`${serverUrl}/artist-profile`);
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '09-settings.png'),
      fullPage: true 
    });
    
    console.log('✅ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
  } finally {
    await browser.close();
    devServer.kill();
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  devServer.kill();
  process.exit(0);
});