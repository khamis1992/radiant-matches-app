# iOS CI/CD Setup Guide

Complete guide for setting up automatic iOS builds using GitHub Actions + macOS Runners

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ **Apple Developer Account** ($99/year)
   - Active membership
   - Access to [Apple Developer Portal](https://developer.apple.com)

2. ✅ **GitHub Repository**
   - Admin access to the repository
   - GitHub Actions enabled

3. ✅ **Local macOS Machine** (for initial setup)
   - Xcode installed
   - Fastlane installed (`gem install fastlane`)

---

## 🔐 Step 1: Create Certificates & Profiles

### 1.1 Create iOS Distribution Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
2. Click **+** to add new certificate
3. Select **iOS Distribution (App Store and Ad Hoc)**
4. Follow instructions to create Certificate Signing Request (CSR) on your Mac
5. Upload CSR and download certificate
6. Double-click to install in Keychain Access

### 1.2 Export Certificate as .p12

1. Open **Keychain Access** on your Mac
2. Find your certificate under "My Certificates"
3. Right-click → Export
4. Choose format: **Personal Information Exchange (.p12)**
5. Set a strong password
6. Save as `certificate.p12`

### 1.3 Create App ID

1. Go to [Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** → **App IDs**
3. Select **App**
4. Description: `Glam App`
5. Bundle ID: `com.glam.app` (explicit)
6. Enable capabilities as needed (Push Notifications, etc.)
7. Click **Continue** → **Register**

### 1.4 Create Provisioning Profile

**For Ad Hoc (Testing):**
1. Go to [Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click **+** → **Ad Hoc**
3. Select App ID: `com.glam.app`
4. Select your Distribution Certificate
5. Select devices (register your test devices first)
6. Name: `Glam Ad Hoc Distribution`
7. Download: `Glam.mobileprovision`

**For App Store (Production):**
1. Click **+** → **App Store**
2. Select App ID: `com.glam.app`
3. Select your Distribution Certificate
4. Name: `Glam App Store Distribution`
5. Download: `Glam_AppStore.mobileprovision`

---

## 🔑 Step 2: Setup GitHub Secrets

Convert your files to base64 and add to GitHub Secrets:

### 2.1 Encode Certificate

```bash
# On your Mac terminal
cd /path/to/your/certificate
base64 -i certificate.p12 -o certificate_base64.txt
cat certificate_base64.txt
```

### 2.2 Encode Provisioning Profile

```bash
base64 -i Glam.mobileprovision -o provision_base64.txt
cat provision_base64.txt
```

### 2.3 Add Secrets to GitHub

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `APPLE_CERTIFICATE_P12` | Base64 encoded certificate | Output from step 2.1 |
| `APPLE_CERTIFICATE_PASSWORD` | Your certificate password | Set when exporting .p12 |
| `APPLE_PROVISIONING_PROFILE` | Base64 encoded profile | Output from step 2.2 |
| `APPLE_KEYCHAIN_PASSWORD` | Random secure password | Generate random string |
| `APPLE_TEAM_ID` | Your Apple Team ID | From Apple Developer Portal |
| `APPLE_ID` | Your Apple ID email | For App Store Connect |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | Generated from Apple ID settings |

---

## ⚙️ Step 3: Configure Files

### 3.1 Update exportOptions.plist

Open `exportOptions.plist` and update:

```xml
<key>teamID</key>
<string>YOUR_TEAM_ID</string>
<key>provisioningProfiles</key>
<dict>
    <key>com.glam.app</key>
    <string>YOUR_PROFILE_NAME</string>
</dict>
```

### 3.2 Update fastlane/Appfile

```ruby
app_identifier("com.glam.app")
apple_id("your-email@example.com")
team_id("YOUR_TEAM_ID")
```

### 3.3 Update capacitor.config.ts (if needed)

Ensure your bundle ID matches:
```typescript
const config: CapacitorConfig = {
  appId: 'com.glam.app',
  // ... rest of config
};
```

---

## 🚀 Step 4: Test Local Build

Before running in CI, test locally:

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync iOS
npx cap sync ios

# Install pods
cd ios/App && pod install

# Build with Fastlane
cd ../..
fastlane ios build_adhoc
```

If successful, you'll have an IPA in `./build/` directory.

---

## 🔄 Step 5: Run GitHub Actions

### 5.1 Push to GitHub

```bash
git add .
git commit -m "Setup iOS CI/CD"
git push origin main
```

### 5.2 Trigger Workflow

**Automatic:**
- Push to `main` or `develop` branch
- Create Pull Request to `main`

**Manual:**
1. Go to **Actions** tab in GitHub
2. Select **iOS Build**
3. Click **Run workflow**
4. Select build type: `development`, `adhoc`, or `appstore`
5. Click **Run workflow**

### 5.3 Download IPA

1. Go to workflow run
2. Wait for completion (~15-20 minutes)
3. Click **Artifacts**
4. Download `Glam-iOS-[run-number]`
5. Unzip to get your IPA file

---

## 📱 Step 6: Install IPA on Device

### Option A: Apple Configurator (Mac)
1. Connect iPhone to Mac
2. Open Apple Configurator 2
3. Drag IPA to device

### Option B: Diawi (Online)
1. Go to [diawi.com](https://www.diawi.com)
2. Upload IPA
3. Share link with testers

### Option C: TestFlight (Production)
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Upload IPA manually or wait for CI
3. Add testers
4. Download from TestFlight app

---

## 🔧 Troubleshooting

### Issue: "Certificate not found"
**Solution:**
- Verify certificate is base64 encoded correctly
- Check certificate password is correct
- Ensure certificate is iOS Distribution (not Development)

### Issue: "Provisioning profile not found"
**Solution:**
- Check bundle ID matches exactly
- Verify profile is base64 encoded correctly
- Ensure profile includes the certificate

### Issue: "Team ID mismatch"
**Solution:**
- Update team ID in all files
- Check Apple Developer Portal for correct Team ID

### Issue: "Build takes too long"
**Solution:**
- GitHub Actions macOS runners are slower
- Use self-hosted runner for faster builds
- Cache dependencies properly

### Issue: "CocoaPods error"
**Solution:**
```bash
cd ios/App
pod deintegrate
pod install
```

---

## 📊 Build Types

| Type | Usage | Distribution |
|------|-------|--------------|
| **Development** | Testing on registered devices | Manual install |
| **Ad Hoc** | Beta testing | Diawi / Manual |
| **App Store** | Production | TestFlight / App Store |

---

## 🎯 Workflow Features

### Automated Triggers:
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Pull requests to `main`
- ✅ Manual workflow dispatch

### Build Steps:
1. Checkout code
2. Setup Node.js & dependencies
3. Build web assets (`npm run build`)
4. Sync Capacitor iOS
5. Setup Xcode
6. Install CocoaPods
7. Setup Keychain & certificates
8. Build IPA
9. Upload artifact
10. Optional: Upload to TestFlight

---

## 💰 GitHub Actions Costs

**macOS runners are NOT free:**

| Plan | macOS Minutes | Cost per Minute |
|------|--------------|-----------------|
| Free | 200 minutes/month | $0.08 after limit |
| Pro | 1,000 minutes/month | $0.08 after limit |
| Team | 2,000 minutes/month | $0.08 after limit |

**Estimates:**
- Each iOS build: ~15-20 minutes
- Free tier: ~10 builds/month
- After limit: $1.60 per build

**Tips to reduce costs:**
- Only build on important pushes
- Use `paths` filter to skip unnecessary builds
- Cache CocoaPods and npm dependencies

---

## 🔐 Security Best Practices

1. ✅ Never commit certificates or profiles
2. ✅ Use GitHub Secrets for all sensitive data
3. ✅ Rotate certificates annually
4. ✅ Use app-specific passwords, not main Apple ID password
5. ✅ Enable 2FA on Apple Developer account
6. ✅ Limit workflow permissions

---

## 📚 Additional Resources

- [Fastlane iOS Setup](https://docs.fastlane.tools/getting-started/ios/setup/)
- [GitHub Actions macOS](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners/about-github-hosted-runners)
- [Apple Developer Documentation](https://developer.apple.com/documentation/xcode/distributing-your-app)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)

---

## ✅ Checklist

Before your first build:

- [ ] Apple Developer Account active
- [ ] iOS Distribution Certificate created
- [ ] Provisioning Profile created
- [ ] Certificate exported as .p12
- [ ] All GitHub Secrets added
- [ ] exportOptions.plist updated
- [ ] fastlane/Appfile updated
- [ ] Local build successful
- [ ] Code pushed to GitHub
- [ ] Workflow triggered successfully

---

**Need Help?**
- Check workflow logs in GitHub Actions
- Verify all secrets are set correctly
- Test local build first
- Review Apple Developer Portal for issues

Good luck with your iOS builds! 🚀
