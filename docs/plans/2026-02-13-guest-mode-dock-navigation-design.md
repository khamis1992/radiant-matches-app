# Guest Mode Dock Navigation Design

**Date:** 2026-02-13
**Status:** Approved
**Author:** AI Design Assistant

## Overview

Enable dock navigation for guest (unauthenticated) users in the Radiant Matches app. Currently, the dock is hidden for guests due to a null role check. This design allows guests to browse the app with full navigation access, prompting login only when they access protected features.

## Problem Statement

**Current Behavior:**
- Dock is hidden for guest users because `BottomNavigation.tsx:63` returns `null` when `role === null`
- Guests cannot navigate easily through the app
- Search is accessible but navigation requires manual URL entry

**Desired Behavior:**
- Guests see full dock navigation (Home, Artists, Favorites, Bookings)
- Search works fully for guests
- Protected features (Favorites, Bookings) show friendly login prompt when accessed

## Solution Architecture

### Core Change: BottomNavigation.tsx

**Line 63 - Single Line Fix:**
```typescript
// Before:
if (loading || role === null) return null;

// After:
if (loading) return null;
```

**Impact:**
- Dock renders when `role === null` (guest mode) after loading completes
- Authenticated users see no change
- Maintains protection against UI flash during initial load

### New Component: LoginPromptModal

**Location:** `src/components/auth/LoginPromptModal.tsx`

**Features:**
- Modal dialog explaining login requirement
- Localized title and message via `useLanguage()` hook
- Two action buttons:
  - "Login" → Navigates to `/auth` page
  - "Maybe Later" → Closes modal, stays on current page
- Uses existing Sheet UI component

**Props:**
```typescript
interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
}
```

### Page-Level Authentication Guards

**Favorites.tsx and Bookings.tsx**

Add authentication check at component level:

```typescript
const { user } = useAuth();
const [showLoginPrompt, setShowLoginPrompt] = useState(false);

useEffect(() => {
  if (!user) setShowLoginPrompt(true);
}, [user]);

// Render LoginPromptModal when no user
<LoginPromptModal open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
```

**No Route Changes Needed:**
- `RoleGate.tsx` line 44 already allows guests: `if (!user) return <>{children}</>;`
- Routes in `App.tsx` remain unchanged
- Guards at page level provide better UX than route redirects

### Navigation Items

**Guest and Customer Dock (Same Items):**
- **Left Side:** Home, Makeup Artists
- **Center:** Search button (floating)
- **Right Side:** Favorites, Bookings

**Behavior:**
- Home, Artists → Fully accessible to guests
- Favorites, Bookings → Open login modal when tapped

**Search:**
- Works fully for guests
- No authentication restrictions
- Navigates to `/makeup-artists?search=...`

## Data Flow

### Guest User Journey

```
1. App Launch
   useAuth → { user: null, loading: false }

2. useUserRole
   Receives user: null → sets { role: null, loading: false }

3. BottomNavigation
   Receives { role: null, loading: false }
   Checks: if (loading) → false
   Renders: isCustomer = true, full dock navigation

4. User Interaction
   - Tap Home/Artists → Navigate successfully
   - Tap Search → Opens search sheet, works fully
   - Tap Favorites/Bookings → Page component checks auth → shows LoginPromptModal

5. Login Flow
   - Tap "Login" in modal → Navigate to /auth
   - After login → useAuth updates → Dock re-renders with full access
   - Favorites/Bookings now accessible
```

### Authentication State Changes

**Logout:**
- `useAuth` sets `user: null`
- `useUserRole` sets `role: null, loading: false`
- Dock shows guest navigation (no Favorites/Bookings access)
- If on Bookings page → `LoginPromptModal` appears

**Login (from guest):**
- `useAuth` updates with user
- `useUserRole` starts loading, fetches role
- During load: `loading: true` → Dock hides briefly
- After load: `role: "customer"` → Dock re-appears
- Favorites/Bookings now accessible

## Error Handling & Edge Cases

### Loading States
- **Initial Load:** Dock hidden during auth loading → prevents UI flash
- **Role Loading:** Brief dock hide during role refetch → acceptable transition
- **No Breaking Changes:** Authenticated users see no difference

### Edge Case Handling

**1. User logs out while on Bookings page:**
- `useAuth` → `user: null`
- `Bookings.tsx` detects no user → shows `LoginPromptModal`
- User chooses "Maybe Later" to stay, or "Login" to re-authenticate

**2. User logs in while on Home page:**
- `useAuth` updates → `useUserRole` refetches
- During refetch: Dock temporarily hides (`loading: true`)
- After refetch: Dock re-appears with same navigation
- Brief hide/show is acceptable

**3. Guest accesses protected route directly (e.g., /favorites):**
- `RoleGate` renders `<Favorites />` (line 44 allows no-user access)
- `Favorites.tsx` checks auth → shows `LoginPromptModal`
- No redirect, no blocking → consistent UX

**4. Search during auth changes:**
- Search state is local to `BottomNavigation`
- Auth changes unmount/remount component → search closes
- Acceptable: search is transient, not critical state

## Implementation Plan

### Files to Modify

**1. BottomNavigation.tsx**
- **Line:** 63
- **Change:** Remove `|| role === null` from loading check
- **Risk:** Minimal - one line change

**2. LoginPromptModal.tsx** (NEW)
- **Location:** `src/components/auth/LoginPromptModal.tsx`
- **Components:** Use Sheet from `@/components/ui/sheet`
- **Dependencies:** `useLanguage()`, `react-router-dom`

**3. Favorites.tsx**
- **Add:** Auth check with `useAuth()` hook
- **Add:** `LoginPromptModal` with state management
- **Pattern:** Check on mount, show modal if no user

**4. Bookings.tsx**
- **Changes:** Same as Favorites.tsx
- **Pattern:** Auth check + modal trigger

### Files Not Changed

- **App.tsx** - Routes remain unchanged
- **RoleGate.tsx** - Already supports guests (line 44)
- **useAuth.ts** - Works as-is
- **useUserRole.ts** - Works as-is
- **Search functionality** - Already works for guests

### Implementation Order

1. **Create LoginPromptModal** (new file, no dependencies, low risk)
2. **Modify BottomNavigation.tsx** (one line, enables guest dock)
3. **Modify Favorites.tsx** (add modal trigger)
4. **Modify Bookings.tsx** (add modal trigger)
5. **Test** all scenarios from checklist

### Estimated Effort

- **Development:** 1-2 hours
- **Testing:** 30 minutes
- **Risk Level:** Low (minimal changes, no breaking changes)

## Testing Checklist

### Guest Mode Tests

- [ ] Launch app without logging in → Dock appears with 4 items
- [ ] Tap Home → Navigates to /home, page loads
- [ ] Tap Artists → Navigates to /makeup-artists, page loads
- [ ] Tap Favorites (guest) → LoginPromptModal appears
- [ ] Tap Bookings (guest) → LoginPromptModal appears
- [ ] Tap "Maybe Later" → Modal closes, stay on current page
- [ ] Tap "Login" → Navigate to /auth page
- [ ] Tap search button → Search sheet opens
- [ ] Type query and press Enter → Navigates with search results
- [ ] Quick search buttons work → Navigate with search term

### Authentication Transition Tests

- [ ] Login from guest mode → Dock re-appears after role loads
- [ ] Logout from logged in → Dock shows guest navigation
- [ ] Rapid logout/login → No UI glitches
- [ ] Navigate to /favorites directly as guest → Modal shows
- [ ] Slow network → Loading state, then dock appears

### Authenticated User Tests (Regression)

- [ ] Login → Dock shows as before (no changes)
- [ ] Favorites accessible → No modal shown
- [ ] Bookings accessible → No modal shown
- [ ] Search works identically
- [ ] All existing features work
- [ ] No console errors during any flows

## Success Criteria

✓ Guest users see dock navigation on app launch
✓ All 4 navigation items visible (Home, Artists, Favorites, Bookings)
✓ Favorites and Bookings show login modal when tapped by guests
✓ Login modal includes "Login" and "Maybe Later" buttons
✓ Search works fully for guest users
✓ No regressions for authenticated users
✓ No console errors during guest ↔ authenticated transitions
✓ Loading states handled gracefully (no UI flashes)

## Future Considerations

**Potential Enhancements:**
- Add analytics tracking for guest → login conversion rate
- A/B test login modal messaging
- Add "Continue as Guest" option to auth page
- Show guest-specific promotional content on home page

**Out of Scope for This Implementation:**
- Guest cart functionality (cart currently requires auth)
- Guest booking flow (currently requires auth)
- Social login options
- Persistent guest session (preferences, browsing history)
