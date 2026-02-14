

## Phone Screenshots for Google Play

Google Play requires **2-8 phone screenshots** at recommended resolution **1080x1920** (9:16 ratio). I'll create a set of polished promotional screenshots with text overlays and device frames, designed as a static HTML page you can open and capture.

### Screenshots to Create (6 screens)

1. **Welcome/Hero** - App logo + tagline "Book Beauty Experts at Your Door"
2. **Browse Categories** - Showing makeup, bridal, henna, nails categories grid
3. **Artist Profile** - Artist card with rating, reviews, portfolio preview
4. **Easy Booking** - Calendar/booking flow with date & time selection
5. **Artist Dashboard** - Earnings, bookings overview, products store
6. **Secure Payments** - SADAD payment integration, wallet balance

### Implementation

I'll create a single static HTML file `public/play-store-screenshots.html` that:

- Renders 6 promotional screenshot cards at **1080x1920px** each
- Uses the app's pink/rose color scheme and branding
- Includes Arabic + English text overlays with feature highlights
- Embeds actual app screenshots from `public/images/system/` folder
- Each card has a gradient background, promotional text at top, and a phone mockup showing the app screen

### How to Use

1. After publishing, visit `https://glamore.app/play-store-screenshots.html`
2. Right-click each screenshot and "Save Image As" or use browser DevTools to capture at exact dimensions
3. Upload the saved images to Google Play Console under "Phone screenshots"

### Technical Details

- Pure HTML/CSS with inline styles (no dependencies)
- Uses CSS `aspect-ratio: 9/16` and fixed `1080px` width for each card
- References existing system screenshots from `/images/system/` directory
- Bilingual promotional text (Arabic primary, English secondary)
- Gradient overlays matching app theme (`#E8A0BF` pink to rose gold palette)

