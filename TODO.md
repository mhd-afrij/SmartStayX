# SmartStayX Production-Readiness Implementation — TODO

## PHASE 1 — Booking Correctness
- [x] 1. Fix maintenance report workflow (backend route + frontend connection)
- [x] 2. Implement refund system (Refund model, Stripe integration, controller, routes)
- [x] 3. Fix payment method handling (remove hardcoded "Stripe")
- [x] 4. Add booking status transition service
- [x] 5. Improve booking hold expiration

## PHASE 2 — Availability & Pricing
- [ ] 6. Inventory-level availability (room-type based)
- [ ] 7. Final atomic availability check before booking creation
- [ ] 8. Extend dynamic pricing (verify completeness)
- [ ] 9. Price history tracking
- [ ] 10. Fix BookingWizard (offerId, guest validation, date validation, specialRequests, hold timer)

## PHASE 3 — My Bookings
- [ ] 11. Modify booking modal
- [ ] 12. Refund request UI
- [ ] 13. Invoice download
- [ ] 14. Pagination/search/filters

## TESTING (as we go)
- [ ] Backend unit tests for new services
- [ ] Frontend tests for new components
- [ ] Build/lint verification
