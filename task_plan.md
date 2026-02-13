# Task Plan: Guest Mode Dock Navigation

## Goal
Enable unauthenticated (guest) users to see and use the dock navigation in the app, with friendly login prompts when accessing protected features (Favorites, Bookings).

## Phases
- [x] Phase 1: Create LoginPromptModal component
- [x] Phase 2: Modify BottomNavigation.tsx for guest visibility
- [x] Phase 3: Add auth guards to Favorites.tsx
- [x] Phase 4: Add auth guards to Bookings.tsx
- [x] Phase 5: Comprehensive testing
- [x] Phase 6: Final verification and cleanup

## Key Questions
1. Should the modal use existing Sheet component or Dialog? **Answer:** Sheet (bottom sheet) for better mobile UX
2. What should the modal message say? **Answer:** Explain the benefit (save favorites, manage bookings) and require login
3. Should search work for guests? **Answer:** Yes, fully accessible

## Decisions Made
- **Use Dialog component:** Center modal is better for attention-grabbing login prompt (changed from Sheet decision)
- **One-line fix in BottomNavigation:** Simplest solution, minimal risk
- **Page-level auth guards:** Better UX than route-level redirects
- **Same navigation items:** Guests see identical dock to customers for consistency

## Errors Encountered
*(To be filled during implementation)*

## Status
**✅ COMPLETED** - All phases finished. Ready for manual testing.
