# Glam App Banners with Images

## 3 Professional Banners with Real Photos

### 📸 Banner Designs with Images

All banners now include **real photos** from Unsplash showing:
- Professional makeup artists at work
- Beautiful bridal makeup
- Beauty and elegance

### 🎨 Banner 1: First Order Discount
- **Image**: Professional makeup artist applying makeup
- **Colors**: Rose/Pink gradient
- **Text**: "20% OFF - Your First Booking"
- **Style**: Welcoming, promotional

### 🎨 Banner 2: Bridal Collection  
- **Image**: Beautiful bride with makeup
- **Colors**: Amber/Gold gradient
- **Text**: "Bridal Collection"
- **Style**: Elegant, premium, feminine

### 🎨 Banner 3: Express Booking
- **Image**: Professional makeup tools/artist
- **Colors**: Dark theme with pink accents
- **Text**: "Quick Booking"
- **Style**: Modern, professional, trustworthy

---

## 📱 How to Export Banners

### Step 1: Open the HTML File
```bash
# Navigate to the banners folder
cd public/banners

# Open in browser
open banners-with-images.html
# or on Windows:
start banners-with-images.html
```

### Step 2: Wait for Images to Load
The images are loaded from Unsplash (high-quality stock photos). Make sure you have internet connection and wait for images to fully load.

### Step 3: Screenshot Each Banner

#### Option A: Browser DevTools (Recommended)
1. Press `F12` to open Developer Tools
2. Click the element picker (top-left icon)
3. Click on the banner you want to capture
4. Right-click on the HTML element in the Elements panel
5. Select "Capture node screenshot"
6. Save as PNG

#### Option B: Snipping Tool
**Windows:**
- Press `Win + Shift + S`
- Drag to select the banner area
- Save the screenshot

**Mac:**
- Press `Cmd + Shift + 4`
- Drag to select the banner area
- Screenshot saves to desktop

### Step 4: Save with Proper Names
Save each banner as:
- `banner-1-first-order.png`
- `banner-2-bridal.png`  
- `banner-3-express.png`

---

## 🚀 Upload to Admin Panel

1. **Login to Admin Dashboard**
   - Go to `/admin`
   - Login with admin credentials

2. **Navigate to Banners**
   - Admin → Settings → Banners

3. **Add Each Banner**
   Click "Add Banner" for each:

   **Banner 1 (Discount):**
   - Title: `20% OFF`
   - Subtitle: `Your First Booking`
   - Button Text: `Book Now`
   - Link URL: `/offers` or `/makeup-artists`
   - Upload: `banner-1-first-order.png`
   - Valid From: Today
   - Valid Until: 3 months from now
   
   **Banner 2 (Bridal):**
   - Title: `Bridal Collection`
   - Subtitle: `Look stunning on your special day`
   - Button Text: `Explore`
   - Link URL: `/makeup-artists?category=Bridal`
   - Upload: `banner-2-bridal.png`
   - Valid From: Today
   - Valid Until: 1 year from now
   
   **Banner 3 (Express):**
   - Title: `Quick Booking`
   - Subtitle: `Same-day appointments available`
   - Button Text: `Book Now`
   - Link URL: `/makeup-artists`
   - Upload: `banner-3-express.png`
   - Valid From: Today
   - Valid Until: No expiry

4. **Enable and Save**
   - Toggle "Active" to ON for each banner
   - Click "Save" or "Update"

---

## 🖼️ Banner Specifications

| Spec | Value |
|------|-------|
| **Dimensions** | 800x320px |
| **Format** | PNG (recommended) |
| **Style** | Modern, clean, with real photos |
| **Colors** | Match app theme (Rose, Gold, Dark) |
| **Text** | Bold, readable, minimal |

---

## 🎨 Design Features

Each banner includes:
- ✅ **Real professional photos** - High-quality Unsplash images
- ✅ **Gradient overlays** - Smooth color transitions
- ✅ **Clear typography** - Bold, readable text
- ✅ **Call-to-action buttons** - Prominent CTAs
- ✅ **App color scheme** - Matches Glam brand colors
- ✅ **Mobile-optimized** - Works on all screen sizes

---

## 📝 Admin Panel Configuration

```json
{
  "banners": [
    {
      "id": "banner-1",
      "title": "20% OFF",
      "subtitle": "Your First Booking",
      "button_text": "Book Now",
      "link_url": "/offers",
      "image": "banner-1-first-order.png",
      "is_active": true,
      "display_order": 1
    },
    {
      "id": "banner-2", 
      "title": "Bridal Collection",
      "subtitle": "Look stunning on your special day",
      "button_text": "Explore",
      "link_url": "/bridal",
      "image": "banner-2-bridal.png",
      "is_active": true,
      "display_order": 2
    },
    {
      "id": "banner-3",
      "title": "Quick Booking", 
      "subtitle": "Same-day appointments available",
      "button_text": "Book Now",
      "link_url": "/quick-book",
      "image": "banner-3-express.png",
      "is_active": true,
      "display_order": 3
    }
  ]
}
```

---

## 🔄 Replacing Images

To use your own images:

1. **Find new images** on Unsplash, Pexels, or your own photos
2. **Edit the HTML file**:
   ```css
   .banner-1 .image-section {
       background: url('YOUR_IMAGE_URL') center/cover;
   }
   ```
3. **Reload the page** and take new screenshots
4. **Upload to admin panel**

**Recommended image types:**
- Makeup artists working
- Before/after makeup shots
- Bridal makeup close-ups
- Beauty products
- Happy customers

---

## ✨ Notes

- Images are loaded from Unsplash CDN (free, high-quality)
- Banners are designed at 800x320px for optimal quality
- You can adjust colors in the CSS to match your brand
- All text is customizable in the Admin panel
- The HTML file is just for preview/export - not for production use

---

**Created for:** Glam Beauty App  
**Format:** HTML Preview with Image Export  
**Last Updated:** 2024
