# 📋 Feature Implementation Plan - Radiant Matches App

**Analysis Date:** 28 December 2025  
**Version:** 1.0  
**Purpose:** Identify missing features and create implementation priority

---

## 🎯 Implementation Priorities

### Priority 1: Critical User Experience (High Impact, Medium Effort)

#### 1. Review Reply System ⭐
**Status:** ❌ Missing  
**Files to Create:**
- `src/hooks/useReviewReplies.ts` - Hook for review replies
- `src/components/ReviewReplyForm.tsx` - Reply form component

**Files to Modify:**
- `src/pages/ArtistProfile.tsx` - Add reply UI to reviews
- `supabase/migrations/` - Create `review_replies` table

**Database Changes:**
```sql
CREATE TABLE review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 2. Review Filtering & Sorting ⭐
**Status:** ❌ Partial (only basic sorting exists)  
**Files to Modify:**
- `src/pages/ArtistProfile.tsx` - Add filter/sort controls
- `src/hooks/useReviews.ts` - Add filter parameters

**Features to Add:**
- Filter by: Newest, Highest Rated, With Photos
- Sort controls for reviews section

---

#### 3. Helpful Review Voting ⭐
**Status:** ❌ Missing  
**Files to Create:**
- `src/hooks/useReviewHelpful.ts` - Hook for helpful votes

**Files to Modify:**
- `src/components/ReviewCard.tsx` - Add helpful vote button
- `supabase/migrations/` - Add `helpful_votes` column to reviews

**Database Changes:**
```sql
ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id)
);
```

---

#### 4. Report Review System ⭐
**Status:** ❌ Missing  
**Files to Create:**
- `src/components/ReportReviewDialog.tsx` - Report dialog

**Files to Modify:**
- `src/components/ReviewCard.tsx` - Add report button
- `src/hooks/useAdminReviews.ts` - Add reported reviews logic

**Database Changes:**
```sql
ALTER TABLE reviews ADD COLUMN is_reported BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN report_reason TEXT;
ALTER TABLE reviews ADD COLUMN report_status TEXT DEFAULT 'pending';
```

---

### Priority 2: Advanced Search Features (Medium Impact, High Effort)

#### 5. Voice Search
**Status:** ❌ Missing  
**Files to Create:**
- `src/components/VoiceSearch.tsx` - Voice search button and UI
- `src/hooks/useVoiceSearch.ts` - Hook for speech recognition

**Technology:** Web Speech API
```typescript
const startListening = () => {
  const recognition = new (window as any).webkitSpeechRecognition() || 
                     new (window as any).SpeechRecognition();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setSearchQuery(transcript);
  };
  recognition.start();
};
```

---

#### 6. Advanced Filters for Search
**Status:** ⚠️ Partial (basic filters exist)  
**Files to Modify:**
- `src/pages/MakeupArtists.tsx` - Add additional filters

**Missing Filters:**
- Average price filter
- Response time filter
- Registration date filter
- Certifications/Awards filter

---

### Priority 3: Payment & Wallet (High Impact, High Effort)

#### 7. Digital Wallet System
**Status:** ❌ Missing  
**Files to Create:**
- `src/pages/Wallet.tsx` - Wallet page
- `src/hooks/useWallet.ts` - Wallet management hook
- `src/components/WalletCard.tsx` - Wallet display component

**Database Changes:**
```sql
CREATE TABLE wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'QAR',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit', 'debit', 'refund'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- booking_id, withdrawal_id, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 8. Loyalty Points System
**Status:** ❌ Missing  
**Files to Create:**
- `src/hooks/useLoyaltyPoints.ts` - Points management

**Database Changes:**
```sql
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE point_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  reward_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 9. Cashback on Bookings
**Status:** ❌ Missing  
**Files to Modify:**
- `src/hooks/useCreateBooking.ts` - Add cashback logic

**Implementation:**
```typescript
// After successful booking, add 5% cashback
const addCashback = async (bookingId: string, amount: number) => {
  const cashbackAmount = amount * 0.05; // 5% cashback
  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    type: 'credit',
    amount: cashbackAmount,
    description: 'Cashback from booking',
    reference_id: bookingId
  });
};
```

---

### Priority 4: Security Features (Critical Impact, High Effort)

#### 10. Two-Factor Authentication (2FA) 🔐
**Status:** ❌ Missing  
**Files to Create:**
- `src/components/TwoFactorAuth.tsx` - 2FA setup UI
- `src/hooks/useTwoFactorAuth.ts` - 2FA management

**Database Changes:**
```sql
ALTER TABLE profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN two_factor_secret TEXT;
ALTER TABLE profiles ADD COLUMN backup_codes TEXT[];
```

---

#### 11. Biometric Login (Face ID / Fingerprint)
**Status:** ❌ Missing  
**Files to Modify:**
- `src/pages/Auth.tsx` - Add biometric login option

**Technology:** Web Authentication API (WebAuthn)
```typescript
const signInWithBiometric = async () => {
  // Use WebAuthn API for biometric auth
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array(32),
      // ... other options
    }
  });
};
```

---

#### 12. Activity Log
**Status:** ❌ Missing  
**Files to Create:**
- `src/pages/ActivityLog.tsx` - Activity log page
- `src/hooks/useActivityLog.ts` - Activity log hook

**Database Changes:**
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Priority 5: Performance & PWA (Medium Impact, Medium Effort)

#### 13. Progressive Web App (PWA)
**Status:** ❌ Missing  
**Files to Create:**
- `public/sw.js` - Service worker
- `public/manifest.json` - PWA manifest

**Implementation Steps:**
1. Create service worker for offline support
2. Add PWA manifest to public folder
3. Register service worker in main.tsx
4. Test offline functionality

---

#### 14. Lazy Loading for Images
**Status:** ❌ Missing  
**Files to Modify:**
- `src/components/ui/lazy-image.tsx` - Create lazy image component
- Replace all `<img>` tags with lazy image component

**Technology:** React LazyLoad or Intersection Observer API

---

### Priority 6: Analytics & Reporting (High Impact, High Effort)

#### 15. Google Analytics Integration
**Status:** ❌ Missing  
**Files to Create:**
- `src/lib/analytics.ts` - Analytics helper functions

**Implementation:**
```typescript
// Add GA4 tracking
export const trackEvent = (eventName: string, params?: object) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};
```

---

#### 16. Custom Admin Reports
**Status:** ❌ Missing  
**Files to Create:**
- `src/pages/admin/CustomReports.tsx` - Custom reports builder
- `src/hooks/useCustomReports.ts` - Reports generation

**Features:**
- Report builder UI
- Export to CSV, PDF, Excel
- Schedule reports
- Real-time analytics dashboard

---

### Priority 7: Communication Features (Medium Impact, Medium Effort)

#### 17. Read Receipts in Chat
**Status:** ❌ Missing  
**Files to Modify:**
- `src/hooks/useMessages.ts` - Add read status tracking
- `src/pages/Chat.tsx` - Add read receipt indicators

**Database Changes:**
```sql
ALTER TABLE messages ADD COLUMN read_at TIMESTAMPTZ;
```

---

#### 18. Typing Indicators
**Status:** ❌ Missing  
**Files to Create:**
- `src/hooks/useTypingIndicator.ts` - Typing status hook
- `src/components/TypingIndicator.tsx` - Typing indicator component

**Database Changes:**
```sql
CREATE TABLE typing_indicators (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
```

---

### Priority 8: Marketing & Campaigns (Medium Impact, High Effort)

#### 19. Marketing Campaign Management
**Status:** ❌ Missing  
**Files to Create:**
- `src/pages/admin/Campaigns.tsx` - Campaign management page
- `src/hooks/useCampaigns.ts` - Campaign data hook

**Database Changes:**
```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'discount', 'promo', 'special_offer'
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience JSONB, -- filters for who sees campaign
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📊 Summary Table

| Feature | Status | Priority | Effort | Impact |
|---------|----------|-----------|---------|--------|
| Review Replies | ❌ Missing | 1 | Medium | High |
| Review Filtering | ❌ Partial | 1 | Low | High |
| Helpful Votes | ❌ Missing | 1 | Low | Medium |
| Report Review | ❌ Missing | 1 | Low | Medium |
| Voice Search | ❌ Missing | 2 | High | High |
| Advanced Filters | ⚠️ Partial | 2 | Medium | High |
| Digital Wallet | ❌ Missing | 3 | High | High |
| Loyalty Points | ❌ Missing | 3 | High | High |
| Cashback | ❌ Missing | 3 | Low | Medium |
| 2FA | ❌ Missing | 4 | High | Critical |
| Biometric Login | ❌ Missing | 4 | High | High |
| Activity Log | ❌ Missing | 4 | Medium | Medium |
| PWA | ❌ Missing | 5 | Medium | Medium |
| Lazy Loading | ❌ Missing | 5 | Low | High |
| GA Analytics | ❌ Missing | 6 | Low | High |
| Custom Reports | ❌ Missing | 6 | High | High |
| Read Receipts | ❌ Missing | 7 | Low | Medium |
| Typing Indicators | ❌ Missing | 7 | Low | Medium |
| Marketing Campaigns | ❌ Missing | 8 | High | Medium |

---

## 🚀 Recommended Implementation Order

### Phase 1: Quick Wins (1-2 weeks)
1. Review Filtering & Sorting
2. Helpful Review Voting
3. Report Review System
4. Read Receipts in Chat
5. Typing Indicators

### Phase 2: Medium Effort (2-4 weeks)
6. Review Reply System
7. Cashback on Bookings
8. Advanced Filters for Search
9. Activity Log
10. Lazy Loading for Images

### Phase 3: Major Features (4-8 weeks)
11. Digital Wallet System
12. Loyalty Points System
13. Two-Factor Authentication
14. Voice Search
15. Marketing Campaign Management

### Phase 4: Advanced Features (8+ weeks)
16. Biometric Login
17. Custom Admin Reports
18. Progressive Web App (PWA)
19. Google Analytics Integration

---

## 📝 Notes

- Some features may require additional services (e.g., Twilio for SMS, Stripe for payments)
- All database changes should be done with proper migrations
- Test all features thoroughly before deploying
- Consider user feedback when prioritizing features
- Performance testing required for PWA implementation

---

**Last Updated:** 28 December 2025


