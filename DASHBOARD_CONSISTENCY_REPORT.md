# Dashboard Consistency Debugging Report

## Executive Summary

This report identifies data inconsistencies across three dashboards (Manager, Super Admin, Receptionist) and provides fixes to ensure cross-dashboard consistency using the Manager Dashboard as the source of truth for business calculations.

---

## Mismatch Table

| Metric | Manager Dashboard | Super Admin Dashboard | Receptionist Dashboard | Issue |
|--------|------------------|----------------------|------------------------|-------|
| **Revenue Definition** | Sums ALL bookings (including cancelled) | Filters by `isPaid: true` | Separates paid vs unpaid | **CRITICAL**: Manager includes cancelled bookings in revenue |
| **Booking Count** | Counts ALL bookings (including cancelled) | Counts ALL bookings globally | Uses status-based filtering | **HIGH**: Manager overcounts bookings |
| **Occupancy Formula** | `occupiedRooms / totalRooms * 100` (booking-based) | N/A (platform-level) | Uses `Room.status` field | **MEDIUM**: Different methodologies |
| **Revenue Time Period** | Based on `createdAt` | Based on `createdAt` with `isPaid` filter | Based on `paymentReceivedAt` | **LOW**: Acceptable variation |
| **Active Bookings** | Includes all non-cancelled | N/A | Uses `checked_in` status only | **LOW**: Different scopes |

---

## Critical Issues Found

### 1. **Manager Dashboard Revenue Includes Cancelled Bookings** (CRITICAL)

**Location:** `backend/controllers/bookingController.js:634-703`

**Problem:** The aggregation pipeline sums `totalPrice` for ALL bookings, including cancelled ones:

```javascript
// Line 643
totalRevenue: { $sum: "$totalPrice" },
```

This means cancelled bookings still contribute to revenue metrics, which is incorrect.

**Impact:**
- `totalRevenue` KPI shows inflated numbers
- `revenueToday`, `revenueWeek`, `revenueMonth` all include cancelled amounts
- Revenue trends are inaccurate

**Fix:** Add status filter to exclude cancelled bookings from revenue calculations.

### 2. **Manager Dashboard Booking Count Includes Cancelled** (HIGH)

**Location:** `backend/controllers/bookingController.js:642`

**Problem:** Counts all bookings regardless of status:

```javascript
// Line 642
totalBookings: { $sum: 1 },
```

**Impact:**
- Total bookings KPI is inflated
- Trends show cancelled bookings as regular activity

**Fix:** Add status filter to exclude cancelled bookings.

### 3. **Occupancy Calculation Methodology Differs** (MEDIUM)

**Manager Dashboard** (`bookingController.js:726-738`):
- Counts rooms with active bookings spanning today
- Excludes: cancelled, checked_out, expired

**Receptionist Dashboard** (`receptionistController.js:488-494`):
- Uses `Room.status` field directly
- Different status values: available, occupied, reserved, cleaning, maintenance, out_of_service

**Impact:**
- Occupancy percentages may differ between dashboards
- Manager shows "booking-derived" occupancy
- Receptionist shows "room status" occupancy

**Recommendation:** Use consistent formula: `(occupied / total) * 100` where occupied = rooms with `status: "occupied"` OR rooms with active bookings.

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

After applying fixes, verify:

- [ ] Manager Dashboard `totalRevenue` matches sum of non-cancelled booking `totalPrice` values
- [ ] Manager Dashboard `totalBookings` counts only non-cancelled bookings
- [ ] Revenue trends exclude cancelled bookings
- [ ] Occupancy calculation is consistent (or documented difference)
- [ ] Super Admin analytics remain accurate (already correct)
- [ ] Receptionist payments section remains accurate (already correct)

---

## Files to Modify

1. `backend/controllers/bookingController.js` - Fix revenue and booking count calculations
2. (Optional) `backend/controllers/receptionistController.js` - Align occupancy methodology

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
