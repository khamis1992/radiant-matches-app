# Glam App Banners

## 3 Professional Banners Ready for Upload

### 📁 Files Included
- `banners-preview.html` - Interactive preview of all 3 banners
- `banner-1-philosophy.md` - Design philosophy document

### 🎨 Banner Designs

#### Banner 1: Discount Banner (20% OFF)
- **Colors**: Rose/Pink gradient
- **Style**: Bold, energetic, promotional
- **Best for**: First-time user offers
- **Dimensions**: 800x300px

#### Banner 2: Bridal Services
- **Colors**: Amber/Gold with soft pastels
- **Style**: Elegant, premium, feminine
- **Best for**: Bridal makeup services
- **Dimensions**: 800x300px

#### Banner 3: Quick Book
- **Colors**: Dark mode with neon accents
- **Style**: Modern, tech-focused, dynamic
- **Best for**: Express booking service
- **Dimensions**: 800x300px

### 📸 How to Export

1. **Open the preview file**:
   ```bash
   open public/banners/banners-preview.html
   # or
   start public/banners/banners-preview.html
   ```

2. **Screenshot each banner**:
   - Windows: Use Snipping Tool or Snip & Sketch
   - Mac: Press Cmd+Shift+4
   - Or use browser dev tools (F12 → Elements → Right-click → Capture node screenshot)

3. **Save as PNG** with names:
   - `banner-1-discount.png`
   - `banner-2-bridal.png`
   - `banner-3-quickbook.png`

### 🚀 Upload to Admin Panel

1. Go to **Admin Dashboard** → **Settings** → **Banners**
2. Click **"Add Banner"**
3. Upload each image and configure:

| Banner | Title | Subtitle | Button Text | Link URL |
|--------|-------|----------|-------------|----------|
| 1 | 20% OFF | On your first booking | Book Now | /offers |
| 2 | Bridal Makeup | Look perfect on your special day | Explore | /bridal |
| 3 | Quick Book | Same-day appointments available | Book Now | /quick-book |

4. Set **Valid From** and **Valid Until** dates
5. Enable the banners
6. Save changes

### 📝 Admin Panel Settings

```json
{
  "banner1": {
    "title": "20% OFF",
    "subtitle": "On your first booking",
    "button_text": "Book Now",
    "link_url": "/offers",
    "is_active": true
  },
  "banner2": {
    "title": "Bridal Makeup",
    "subtitle": "Look perfect on your special day",
    "button_text": "Explore",
    "link_url": "/bridal",
    "is_active": true
  },
  "banner3": {
    "title": "Quick Book",
    "subtitle": "Same-day appointments available",
    "button_text": "Book Now",
    "link_url": "/quick-book",
    "is_active": true
  }
}
```

### ✨ Design Features

All banners include:
- **Responsive design** - Works on mobile and desktop
- **App colors** - Uses primary (rose), gold, and dark theme
- **Professional typography** - Bold, readable fonts
- **Visual hierarchy** - Clear CTAs and messaging
- **Modern effects** - Gradients, glows, and animations
- **High contrast** - Accessible and eye-catching

### 🎯 Recommended Usage

- **Banner 1**: Show to new users (first visit)
- **Banner 2**: Show during wedding season
- **Banner 3**: Always show for quick conversions

### 📱 Mobile Optimization

The banners are designed at 800x300px but work perfectly when scaled down to:
- Mobile: 375x140px
- Tablet: 768x280px
- Desktop: Full width

### 🎨 Color Palette Used

```css
/* Primary Colors */
--primary: hsl(350 60% 65%);      /* Rose */
--gold: hsl(42 65% 55%);          /* Amber/Gold */
--background: hsl(30 25% 97%);    /* Cream */

/* Banner 1 Specifics */
--banner1-gradient: linear-gradient(135deg, #e11d48, #ec4899, #be185d);

/* Banner 2 Specifics */
--banner2-gradient: linear-gradient(135deg, #fef3c7, #ffedd5, #fce7f3);

/* Banner 3 Specifics */
--banner3-gradient: linear-gradient(135deg, #111827, #1f2937, #111827);
```

---

**Note**: These banners were designed specifically for the Glam beauty app using the app's official color palette.
