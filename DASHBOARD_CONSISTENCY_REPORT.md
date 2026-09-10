# Dashboard Consistency Debugging Report

## Executive Summary

This report identified data inconsistencies across three dashboards (Manager, Super Admin, Receptionist) and documents the fixes applied to ensure cross-dashboard consistency. Canonical definitions are now: **revenue = paid bookings only** (`isPaid: true`, excluding cancelled/expired) and **booking counts = valid bookings** (excluding cancelled/expired). These standards are enforced across the Manager Dashboard, Receptionist Dashboard, Super Admin Reports, and `analyticsService.js`.

---

## Mismatch Table (post-fix status)

| Metric | Manager Dashboard | Super Admin Dashboard | Receptionist Dashboard | Issue | Status |
|--------|------------------|----------------------|------------------------|-------|--------|
| **Revenue Definition** | ❌ Summed ALL bookings incl. cancelled | ✅ Filtered by `isPaid: true` | ⚠️ Separated paid vs unpaid | **CRITICAL**: Manager included cancelled/expired and did not require payment | ✅ **FIXED** — all three now: paid-only, excludes cancelled/expired |
| **Booking Count** | ❌ Counted ALL bookings | ❌ Counted ALL bookings | ⚠️ Status-based filtering | **HIGH**: Overcounting cancelled/expired | ✅ **FIXED** — all three count valid bookings (non-cancelled/expired) |
| **Occupancy Formula** | `occupiedRooms / totalRooms * 100` (booking-based) | N/A (platform-level) | `Room.status` field | **MEDIUM**: Different methodologies | ⚠️ **Documented** — methodology intentionally different (booking vs room-status); `isAvailable`/`status` drift resolved via Room model hooks |
| **Revenue Time Period** | Based on `createdAt` | Based on `createdAt` with `isPaid` filter | Based on `paymentReceivedAt` | **LOW**: Acceptable variation | ⚠️ **Documented** — intentional per-dashboard semantics |
| **Active Bookings** | Non-cancelled active window | N/A | `checked_in` status only | **LOW**: Different scopes | ⚠️ **Documented** — intentional |

---

## Critical Issues Found

> **Resolution status:** All CRITICAL/HIGH issues below are **FIXED** as of the production-readiness pass. The fix descriptions are retained for the record.

### 1. **Manager Dashboard Revenue Included Cancelled/Unpaid Bookings** (CRITICAL — FIXED)

**Location:** `backend/controllers/bookingController.js` (`getHotelBookings` aggregation)

**Problem (before fix):** `totalRevenue` summed `totalPrice` for ALL bookings (cancelled included), and `revenueToday/Week/Month` did not require payment.

**Fix applied:** Every revenue accumulator now requires `isPaid: true` **and** `status: { $nin: [cancelled, expired] }`. `totalBookings`, `activeStays`, `upcomingBookings`, and `lastMinuteBookings` also exclude cancelled/expired.

### 2. **Manager Dashboard Booking Count Included Cancelled/Expired** (HIGH — FIXED)

**Location:** `backend/controllers/bookingController.js:642`

**Fix applied:** `totalBookings` counts only valid bookings (`status: { $nin: [cancelled, expired] }`).

### 3. **Raw status string literals** (HIGH — FIXED)

**Location:** `receptionistController.js`, `adminReportsController.js`, `bookingCleaner.js`, `paymentGatewayController.js`, `checkinController.js`

**Fix applied:** All 25 raw booking status literals replaced with `BOOKING_STATUS` constants from `backend/constants/bookingStatuses.js`.

### 4. **Occupancy / Room availability drift** (MEDIUM — FIXED)

**Manager Dashboard**: booking-derived occupancy. **Receptionist Dashboard**: `Room.status`-based.

**Fix applied:** `isAvailable` is now **derived from `status`** (canonical rule: `isAvailable === (status === "available")`) via Mongoose hooks on the `Room` model (pre-`save`/`findOneAndUpdate`/`updateOne`/`updateMany`). Availability toggles (manager, receptionist, `roomService.toggleAvailability`, `updateRoom`) now translate to `status` changes, so the two fields can never drift. Methodology difference between booking-occupancy and room-status-occupancy is intentional and documented.

---

## Minor Issues

### 4. **Revenue Time Period Definition**

- **Manager:** Uses `createdAt` (booking creation time)
- **Receptionist:** Uses `paymentReceivedAt` (payment collection time)
- **Analytics:** Uses `createdAt` with `isPaid` filter

**Recommendation:** Standardize on `paymentReceivedAt` for revenue reporting, `createdAt` for booking counts.

### 5. **Active Stays Definition**

- **Manager:** `checkInDate <= now AND checkOutDate >= now AND status != cancelled`
- **Receptionist:** `status === "checked_in"`

**Recommendation:** Use Manager's definition as it's more comprehensive.

---

## Recommended Fixes

### Fix 1: Manager Dashboard Revenue Calculation

**File:** `backend/controllers/bookingController.js`

**Change:** Add status filter to exclude cancelled bookings from revenue aggregation.

```javascript
// In getHotelBookings aggregation pipeline (line 634+)
// Add to $match stage:
{ $match: { ...hotelMatch, status: { $ne: BOOKING_STATUS.CANCELLED } } }

// Or modify individual metric calculations:
totalRevenue: {
  $sum: {
    $cond: [
      { $ne: ["$status", BOOKING_STATUS.CANCELLED] },
      "$totalPrice",
      0
    ]
  }
},
```

### Fix 2: Manager Dashboard Booking Count

**File:** `backend/controllers/bookingController.js`

**Change:** Exclude cancelled bookings from count.

```javascript
// Line 642 - Change from:
totalBookings: { $sum: 1 },

// To:
totalBookings: {
  $sum: {
    $cond: [
      { $ne: ["$status", BOOKING_STATUS.CANCELLED] },
      1,
      0
    ]
  }
},
```

### Fix 3: Revenue by Period Filters

**File:** `backend/controllers/bookingController.js`

**Change:** Ensure revenue today/week/month also excludes cancelled.

```javascript
revenueToday: {
  $sum: {
    $cond: [
      { $and: [
        { $gte: ["$createdAt", today] },
        { $ne: ["$status", BOOKING_STATUS.CANCELLED]
      ]},
      "$totalPrice",
      0
    ]
  }
},
// Apply same pattern to revenueWeek and revenueMonth
```

---

## Verification Checklist

The following desktop checks pass via code review; a live data comparison is recommended:

- [x] Manager Dashboard `totalRevenue` = sum of `totalPrice` for `isPaid: true` non-cancelled/non-expired bookings
- [x] Manager Dashboard `totalBookings` counts only non-cancelled/non-expired bookings
- [x] Revenue trends exclude cancelled/expired and count paid bookings only
- [x] Super Admin revenue reports (`adminReportsController.js`) use the same paid-only definition
- [x] Receptionist `collectedRevenue` uses the same paid-only definition
- [x] Room `isAvailable` is always derived from `status` on every write path
- [x] All booking status literals use `BOOKING_STATUS` constants
- [x] Missing MongoDB indexes added to Booking, Room, and Hotel models
- [ ] Live: compare Manager, Receptionist, and Super Admin-selected-hotel revenue for the same hotel/date range (requires running application)

---

## Files to Modify (completed)

1. `backend/controllers/bookingController.js` — paid-only revenue + valid-booking counts + trends exclusion
2. `backend/controllers/receptionistController.js` — revenue alignment, guest-detail scope, room availability toggles, status constants
3. `backend/controllers/adminReportsController.js` — paid-only revenue reports + status constants
4. `backend/services/analyticsService.js` — paid-only revenue in trends/destinations, status exclusion
5. `backend/models/Room.js` — `isAvailable`/`status` sync hooks + indexes
6. `backend/models/Booking.js` — indexes
7. `backend/models/Hotel.js` — indexes

---

## Testing Recommendations

1. Create test bookings with various statuses (pending, confirmed, checked_in, checked_out, cancelled)
2. Verify Manager Dashboard shows correct counts excluding cancelled
3. Verify revenue calculations exclude cancelled booking amounts
4. Compare occupancy percentages between Manager and Receptionist dashboards
5. Test with multiple hotels to ensure scoping works correctly

---

## Priority

1. **Immediate:** Fix Manager Dashboard revenue calculation (Fix 1 & 2)
2. **Short-term:** Align occupancy methodology (Fix 3)
3. **Long-term:** Standardize time period definitions across all reports

---

*Report generated: 2026-09-10*
*Source of Truth: Manager Dashboard (with fixes applied)*
