# Fix Add Service Page Modal - Not Showing Fully

## Problem
The Add Service modal is not displaying fully on screen. The content gets cut off and users can't see all the form fields and the save button.

## Root Cause
1. Modal container has `max-h-[90vh]` (90% viewport height)
2. Content area calculation `calc(90vh - 140px)` doesn't account for all header/footer elements properly
3. No safe area padding for mobile devices with home indicators/notches

## Tasks
- [x] Update modal container max-height from `max-h-[90vh]` to `max-h-[calc(100vh-2rem)]`
- [x] Fix content area to use flexbox with `flex-1` instead of fixed height calculation
- [x] Add safe area padding for mobile devices (`pb-safe`)
- [x] Ensure footer is always visible and accessible
- [x] Fix z-index issue causing BottomNavigation to overlap modal (changed to z-[60])
- [x] Correct safe area padding implementation (moved from overlay to footer)

## Review

### Changes Made
1. **Modal Container Height**: Changed from `max-h-[90vh]` to `max-h-[calc(100vh-2rem)]` to use more available screen space
2. **Added Flexbox Layout**: Added `flex flex-col` to the modal container to properly manage height distribution
3. **Content Area**: Replaced fixed height calculation `maxHeight: "calc(90vh - 140px)"` with `flex-1` class for dynamic height
4. **Z-Index Fix**: Increased modal overlay z-index from `z-50` to `z-[60]` to ensure it sits on top of the bottom navigation bar (which is `z-50`)
5. **Safe Area Padding**: 
   - Removed `safe-area-bottom` from the overlay container so the modal sits flush at the bottom
   - Added `safe-area-bottom` class to the modal footer to ensure buttons are not obstructed by home indicators
   - Removed incorrect `pb-safe` class

### Benefits
- Modal now completely covers the bottom navigation bar
- Modal extends to the bottom of the screen with proper padding for mobile home indicators
- Content area adjusts dynamically to fill available space
- Footer buttons are always visible and clickable
- Consistent behavior across devices

### Files Modified
- `src/pages/artist/ArtistServices.tsx` - Updated modal structure, z-index, and padding
