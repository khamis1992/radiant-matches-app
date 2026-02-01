# Glam Premium Banners

## Professional Editorial-Style Banner Designs

### 🎨 Premium Design Features

These banners feature **luxury editorial design** inspired by high-end beauty brands like:
- **Vogue**
- **Chanel Beauty**
- **Dior**
- **Sephora**
- **Glossier**

### 📸 3 Professional Banner Designs

#### Banner 1: "First Experience" - Rose Gold Elegance
- **Style**: Editorial luxury with floating badge
- **Typography**: Playfair Display (serif) + Inter (sans-serif)
- **Colors**: Rose gold gradient (#fce7f3 → #fbcfe8)
- **Image**: Professional makeup application
- **Features**:
  - Brand mark with letter-spacing
  - Large typography (72px headline)
  - Floating discount badge
  - Premium CTA button
  - Gradient overlays

#### Banner 2: "Bridal Perfection" - Amber Editorial
- **Style**: Magazine cover aesthetic
- **Typography**: Elegant serif headlines
- **Colors**: Warm amber (#fffbeb) with gold accents
- **Image**: Bridal beauty portrait
- **Features**:
  - Editorial subtitle styling
  - Icon features with circular backgrounds
  - Right-aligned layout
  - Gradient image overlay
  - Premium outlined CTA

#### Banner 3: "Beauty On Demand" - Dark Luxury
- **Style**: Modern luxury with neon accents
- **Typography**: Bold serif with accent eyebrow
- **Colors**: Deep black (#0f0f0f) with pink accents
- **Image**: Professional beauty tools/artist
- **Features**:
  - Eyebrow accent line
  - Stats with dividers
  - Gradient bottom accent
  - High contrast typography
  - Premium gold/pink gradient line

### 🖼️ Image Sources

All images are from **Unsplash** (high-resolution, professional):
- Banner 1: Luxury makeup application
- Banner 2: Bridal portrait  
- Banner 3: Beauty professional workspace

### 📐 Specifications

| Spec | Value |
|------|-------|
| **Dimensions** | 1200x400px (HD quality) |
| **Format** | PNG (export as PNG) |
| **Typography** | Playfair Display + Inter |
| **Style** | Editorial/Luxury |
| **Colors** | Brand colors + Premium palette |

### 📱 How to Export

#### Method 1: Browser DevTools (Recommended - Best Quality)

1. **Open the file**:
   ```bash
   open public/banners/premium-banners.html
   # or on Windows:
   start public/banners/premium-banners.html
   ```

2. **Wait for images** - Let all Unsplash images load completely

3. **Open DevTools**:
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Click Elements tab

4. **Select banner**:
   - Click element picker (top-left icon)
   - Click on banner div

5. **Capture screenshot**:
   - Right-click on the banner element in Elements panel
   - Select **"Capture node screenshot"**
   - Save as PNG

6. **Repeat for all 3 banners**

#### Method 2: Screenshot Tool

**Mac:**
```bash
# Full banner capture
Cmd + Shift + 4
# Then drag to select banner area
```

**Windows:**
```bash
# Use Snipping Tool
Win + Shift + S
# Select banner area
```

### 🚀 Upload to Admin Panel

1. **Login to Admin**
   - Navigate to `/admin`
   - Enter admin credentials

2. **Go to Banners**
   - Admin Dashboard → Settings → Banners

3. **Add Banner 1** (First Experience):
   ```
   Title: 20%
   Subtitle: Off Your First Experience
   Button Text: Book Appointment
   Link URL: /offers
   Image: Upload banner-1-first-experience.png
   Display Order: 1
   Active: ON
   ```

4. **Add Banner 2** (Bridal):
   ```
   Title: Bridal Perfection
   Subtitle: Your special day deserves extraordinary beauty
   Button Text: Discover Collection
   Link URL: /makeup-artists?category=Bridal
   Image: Upload banner-2-bridal.png
   Display Order: 2
   Active: ON
   ```

5. **Add Banner 3** (Express):
   ```
   Title: Beauty On Demand
   Subtitle: Same-day appointments with Qatar's top-rated professionals
   Button Text: Book Now
   Link URL: /quick-book
   Image: Upload banner-3-express.png
   Display Order: 3
   Active: ON
   ```

6. **Save and Preview**
   - Click "Save" on each banner
   - Go to home page to preview

### ✨ Design Highlights

#### Typography
- **Playfair Display**: Elegant serif for headlines (premium feel)
- **Inter**: Clean sans-serif for body text (modern readability)
- **Letter Spacing**: Wide tracking for luxury aesthetic
- **Font Sizes**: Large, bold headlines (64-72px)

#### Color Palette
- **Banner 1**: Rose pink gradient
  - Primary: #be185d
  - Background: #fce7f3 → #fbcfe8
  
- **Banner 2**: Amber gold
  - Primary: #d97706
  - Background: #fffbeb
  
- **Banner 3**: Dark luxury
  - Primary: #ec4899
  - Background: #0f0f0f
  - Accent: Gold/pink gradient line

#### Layout Techniques
- **Split layouts**: Content + Image sections
- **Floating elements**: Badge overlays for discounts
- **Gradient overlays**: Smooth image transitions
- **Editorial spacing**: Generous padding and margins
- **Premium CTAs**: Uppercase, letter-spaced buttons

### 🔄 Customization

#### Change Images
Edit the HTML file and replace image URLs:
```html
<img src="YOUR_NEW_IMAGE_URL" alt="Description">
```

**Recommended image sources:**
- Unsplash.com (free, high-quality)
- Pexels.com
- Your own professional photos

#### Change Colors
Modify CSS variables:
```css
.banner-1 {
    background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

#### Change Text
Edit HTML content directly:
```html
<h2>Your New Headline</h2>
<p>Your new description</p>
```

### 🎯 Best Practices

- **Image Quality**: Use high-resolution images (min 1200px width)
- **Load Time**: Wait for images to fully load before capturing
- **File Size**: Keep PNG files under 500KB for web optimization
- **Testing**: Preview banners on mobile and desktop
- **Accessibility**: Ensure text contrast meets WCAG standards

### 📞 Support

If you need help:
1. Check that images loaded (no broken image icons)
2. Use Chrome DevTools for best screenshot quality
3. Ensure browser zoom is at 100%
4. Try refreshing if images don't load

---

**Design Standard**: Premium Editorial  
**Created For**: Glam Beauty App  
**Version**: 2.0 - Professional
