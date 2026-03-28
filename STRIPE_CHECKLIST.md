# SmartStayX Stripe Payment Integration Checklist

## ✅ Already Configured

Your project already has the following Stripe features implemented:

- ✅ **Stripe Backend Integration** - Secret key configured
- ✅ **Checkout Session Creation** - `/api/bookings/create-checkout-session` endpoint
- ✅ **Webhook Handler** - `/api/bookings/stripe-webhook` endpoint with signature verification
- ✅ **Booking Model** - Fields for `isPaid`, `paymentMethod`, `status`
- ✅ **Frontend UI** - "Pay with Stripe" button in MyBookings page
- ✅ **Payment Status Display** - Green/red indicator showing payment status
- ✅ **Dynamic Pricing** - Integrated with booking calculation logic

---

## 🔧 What You Need to Do

### 1. **Environment Setup** (5 minutes)
```bash
# Navigate to Server directory
cd Server

# Copy the example env file
cp .env.example .env

# Edit .env with your actual keys:
# - STRIPE_SECRET_KEY=sk_test_...
# - STRIPE_WEBHOOK_SECRET=whsec_...
# - MONGODB_URI=...
# - CLERK_SECRET_KEY=...
# - CLOUDINARY keys...
```

### 2. **Get Stripe Test Keys** (10 minutes)
1. Sign up at [stripe.com](https://stripe.com)
2. Go to Developers → API keys (in test mode)
3. Copy the **Secret Key**
4. Set up webhooks and copy the **Webhook Secret**
5. Add both to your `.env` file

### 3. **Test the Integration** (10 minutes)
```bash
# Start your server
cd Server
npm run server

# In another terminal, start frontend
cd client
npm run dev

# Visit: http://localhost:5173
# Create a booking and test payment with card: 4242 4242 4242 4242
```

### 4. **Set Up Webhook Locally** (Optional but recommended)
If testing webhooks locally:
```bash
# Install ngrok
# Run ngrok to expose local server
ngrok http 3000

# Add ngrok URL to Stripe Webhooks dashboard
# Update STRIPE_WEBHOOK_SECRET in .env
```

---

## 🎯 Testing Checklist

- [ ] Server starts without errors: `npm run server`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Can create a hotel booking
- [ ] "Pay with Stripe" button appears on unpaid bookings
- [ ] Clicking button redirects to Stripe checkout
- [ ] Can enter test card `4242 4242 4242 4242`
- [ ] After payment, booking shows as "Paid" in MyBookings
- [ ] Check Stripe Dashboard for successful transaction

---

## 📊 Database Fields Used

The `Booking` model already has these payment fields:

```javascript
{
  totalPrice: Number,           // Full price including dynamic pricing
  paymentMethod: String,        // "Stripe" or "Pay At Hotel"
  isPaid: Boolean,              // true/false payment status
  status: String,               // "pending", "confirmed", "cancelled"
  basePricePerNight: Number,    // Original price
  dynamicPricePerNight: Number, // With surge pricing
  priceMultiplier: Number       // Surge multiplier (1, 1.15, 1.25, etc)
}
```

---

## 🔗 API Endpoints Reference

### Create Checkout Session
```
POST /api/bookings/create-checkout-session
Headers: Authorization: Bearer {token}
Body: { bookingId: "..." }
Response: { success: true, sessionId: "...", url: "..." }
```

### Webhook Handler (Stripe → Your Server)
```
POST /api/bookings/stripe-webhook
Headers: stripe-signature (automatic)
Body: Stripe event (JSON)
Automatic: Updates booking to isPaid=true, status="confirmed"
```

### Get User Bookings
```
GET /api/bookings/user
Headers: Authorization: Bearer {token}
Response: { success: true, bookings: [...] }
```

---

## 🚀 Deployment Steps

### Before Going Live:

1. **Switch to Live Keys:**
   - Stripe Dashboard → Developers → API keys
   - Toggle "Viewing test data" to OFF
   - Copy "Live Secret Key" (sk_live_...)

2. **Update .env for Production:**
   ```env
   STRIPE_SECRET_KEY=sk_live_your_production_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Update Webhook URL:**
   - Stripe Webhooks → Edit endpoint
   - Change from local/ngrok to: `https://yourdomain.com/api/bookings/stripe-webhook`

4. **Secure Your .env:**
   - Never commit `.env` to Git
   - Use environment secrets in your hosting platform (Vercel, Heroku, AWS, etc.)

5. **Test Before Launch:**
   - Make a test payment with live keys
   - Verify booking shows as confirmed in database
   - Check email notifications work

---

## 🔒 Security Notes

- ✅ Secret keys stored in `.env` (not in code)
- ✅ Webhook signatures verified (prevents spoofing)
- ✅ User authentication required on payment endpoints
- ✅ Stripe handles card data (PCI compliant)
- ⚠️ Never hardcode API keys
- ⚠️ Never expose test keys publicly (though they're safe, it's bad practice)

---

## ❓ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| **"Stripe is not configured"** | Check `STRIPE_SECRET_KEY` is in `.env` and `.env` is loaded |
| **Webhook not firing** | Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard |
| **Payment redirects to error page** | Check `FRONTEND_URL` in `.env` is correct |
| **Booking doesn't save as paid** | Check webhook receiving events (Stripe Dashboard → Webhooks) |
| **ngrok keeps failing** | Restart ngrok, update Stripe webhook URL with new domain |

---

## 📝 File Locations

- **Backend Controller:** `Server/controllers/bookingController.js`
- **Backend Routes:** `Server/routes/bookingRoutes.js`
- **Backend Model:** `Server/models/Booking.js`
- **Frontend UI:** `client/src/pages/MyBookings.jsx`
- **Environment Config:** `Server/.env` (create from `.env.example`)

---

## 🎓 Next Steps

1. [ ] Copy `STRIPE_SETUP_GUIDE.md` and follow step-by-step
2. [ ] Create `.env` file with your Stripe keys
3. [ ] Test locally with test cards
4. [ ] Set up webhook with ngrok
5. [ ] Deploy to production with live keys
6. [ ] Monitor transactions in Stripe Dashboard

---

## 📞 Support Resources

- **Stripe API Docs:** https://stripe.com/docs
- **Stripe Testing Guide:** https://stripe.com/docs/testing
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Test Card Numbers:** https://stripe.com/docs/testing#cards

Everything is ready to go! Just add your Stripe keys to `.env` and you're set. 🎉
