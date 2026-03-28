# Stripe Payment Integration Setup Guide for SmartStayX

## Overview
Your SmartStayX project is already configured with Stripe payment processing. This guide will help you complete the setup and go live.

---

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click **Sign up** and fill in your business details
3. Complete the onboarding process
4. You'll get access to your Stripe Dashboard

---

## Step 2: Get Your Stripe API Keys

### For Testing (Development):
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle visible in top-right)
3. Go to **Developers → API keys**
4. You'll see two test keys:
   - **Publishable Key**: `pk_test_...` (you won't use this in backend)
   - **Secret Key**: `sk_test_...` (KEEP THIS PRIVATE)

5. Copy your **Secret Key** and add to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

---

## Step 3: Set Up Webhooks

### Why Webhooks?
Webhooks allow Stripe to notify your server when payments are completed, so you can update booking statuses.

### Finding Your Endpoint URL

#### For Local Testing with ngrok:

**Step 1: Download and Install ngrok**
1. Go to [ngrok.com](https://ngrok.com/download)
2. Download the Windows version
3. Extract the file to a folder (e.g., `C:\ngrok`)
4. Create a free account at ngrok.com
5. Copy your auth token from your ngrok dashboard

**Step 2: Start Your Local Server**
```bash
# Open PowerShell/Terminal and navigate to Server folder
cd Server
npm run server
# You'll see: "Server running on port 3000"
```

**Step 3: Get Your Public ngrok URL**
```bash
# Open a NEW terminal window
# Navigate to ngrok folder (or add to PATH)
cd C:\ngrok

# Authenticate with your auth token
ngrok config add-authtoken your_authtoken_here

# Start ngrok to expose port 3000
ngrok http 3000
```

**Step 4: Copy Your Endpoint URL**
Look for this in the ngrok terminal output:
```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
```

Your **Endpoint URL** is:
```
https://abc123def456.ngrok.io/api/bookings/stripe-webhook
```

**⚠️ Important Notes:**
- The ngrok URL changes every time you restart ngrok (unless you have a paid account)
- Keep ngrok running while testing
- Update your Stripe webhook endpoint if ngrok URL changes

#### For Production:

Your **Endpoint URL** will be your actual domain:
```
https://yourdomain.com/api/bookings/stripe-webhook
```

---

### Configuring the Webhook in Stripe

#### For Local Testing (with ngrok):

1. **In Stripe Dashboard:**
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - Fill in the form with these values:

   | Field | Value |
   |-------|-------|
   | **Endpoint URL** | `https://abc123def456.ngrok.io/api/bookings/stripe-webhook` |
   | **Destination name** | `SmartStayX Local` (or your choice) |
   | **Description** | `Local webhook for payment testing` |

2. **Select Events to Monitor:**
   - After entering the URL, click **Select events**
   - Check both:
     - ☑️ `checkout.session.completed`
     - ☑️ `checkout.session.async_payment_succeeded`
   - Click **Add events**

3. **Copy Your Webhook Secret:**
   - After creating the endpoint, you'll see a long string starting with `whsec_`
   - This is your **Signing Secret**
   - Copy it and add to your `Server/.env`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
     ```

4. **Restart Your Server:**
   ```bash
   # Stop current server (Ctrl+C) and restart
   npm run server
   ```

#### For Production Deployment:

1. **In Stripe Dashboard:**
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Endpoint URL** | `https://yourdomain.com/api/bookings/stripe-webhook` |
   | **Destination name** | `SmartStayX Production` |
   | **Description** | `Production webhook for payment processing` |

2. **Select Events:**
   - Click **Select events** and check:
     - ☑️ `checkout.session.completed`
     - ☑️ `checkout.session.async_payment_succeeded`
   - Click **Add events**

3. **Save Your Webhook Secret:**
   - Copy the signing secret starting with `whsec_`
   - Add to your production `.env`:
     ```env
     STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
     ```

---

## Step 4: Configure Environment Variables

Create a `.env` file in the `Server` directory (copy from `.env.example`):

```env
# Existing configurations
MONGODB_URI=your_connection_string
CLERK_SECRET_KEY=your_clerk_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NEW: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SpAnsCPvfYMT663qncyGQP3h27fEZZ0mW3XTpGOXdMPudf1pnEGHPotEoOsZ19YMOmXI163oLiFeOxLjSAn3YoF00ITIYZhrn
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef

# Frontend URL (for success/cancel redirects)
FRONTEND_URL=http://localhost:5173

PORT=3000
NODE_ENV=development
```

---

## Step 5: Test Payment Flow

### Using Stripe Test Cards:
Stripe provides test card numbers for development:

- **Successful Payment:** `4242 4242 4242 4242`
- **Failed Payment:** `4000 0000 0000 0002`
- **Expired Card:** `4000 0000 0000 0069`

**For all test cards, use:**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- Cardholder Name: Any name

### Test Flow:
1. Navigate to your booking details
2. Click **Pay with Stripe**
3. Enter test card `4242 4242 4242 4242`
4. Complete checkout
5. Check your Stripe Dashboard for the transaction

---

## Step 6: Testing Locally with ngrok

If testing webhooks locally:

1. **Install ngrok:** Download from [ngrok.com](https://ngrok.com)
2. **Create account** and get your auth token
3. **Run ngrok:**
   ```bash
   ngrok http 3000
   ```
4. **Use the URL** it provides in your webhook configuration
5. **Update STRIPE_WEBHOOK_SECRET** with the new endpoint's signing secret

---

## Step 7: API Endpoints Summary

Your backend has these payment-related endpoints already configured:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bookings/book` | POST | Create booking |
| `/api/bookings/create-checkout-session` | POST | Start Stripe checkout |
| `/api/bookings/stripe-webhook` | POST | Receive Stripe events |
| `/api/bookings/user` | GET | Get user's bookings |
| `/api/bookings/pay` | POST | Mark booking as paid (mock) |

---

## Step 8: Production Deployment

When deploying to production:

1. **Switch to Live Keys:**
   - Go to Stripe Dashboard → **Developers → API keys**
   - Toggle "Viewing test data" to OFF
   - Copy your **Live Secret Key** (`sk_live_...`)

2. **Update Environment Variables:**
   ```env
   STRIPE_SECRET_KEY=sk_live_your_production_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Update Webhook URL:**
   - In Stripe Webhooks, update endpoint to: `https://yourdomain.com/api/bookings/stripe-webhook`

4. **Test thoroughly** before going live

---

## Step 9: Current Implementation Details

### Backend Flow:
1. User clicks **Pay with Stripe** in MyBookings
2. Frontend calls `/api/bookings/create-checkout-session`
3. Backend creates Stripe checkout session
4. Stripe returns session URL
5. User is redirected to Stripe checkout
6. User completes payment
7. Stripe webhooks notify your server
8. Booking status updates to `confirmed` and `isPaid: true`

### Frontend Integration:
- Located in: `client/src/pages/MyBookings.jsx`
- Calls payment endpoint and redirects to Stripe
- Displays "Pay with Stripe" button for unpaid bookings
- Shows payment status with green/red indicator

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Webhook signature verification failed** | Verify `STRIPE_WEBHOOK_SECRET` is correct and matches endpoint setup |
| **"Stripe is not configured"** | Check `STRIPE_SECRET_KEY` is set in `.env` |
| **Checkout button not working** | Ensure booking exists and user is authenticated |
| **Payment doesn't update in database** | Check webhook endpoint is reachable and signing secret is correct |
| **ngrok URL not working** | Restart ngrok and update webhook URL with new ngrok domain |

---

## Security Best Practices

✅ **DO:**
- Keep `STRIPE_SECRET_KEY` private (never commit to git)
- Use `.env` for sensitive keys
- Validate webhook signatures (already implemented)
- Use HTTPS for production

❌ **DON'T:**
- Share API keys in code
- Use test keys in production
- Hardcode endpoint secrets
- Store card information (Stripe handles this)

---

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)

---

## Next Steps

1. ✅ Create Stripe account
2. ✅ Get API keys (test and live)
3. ✅ Set up webhooks
4. ✅ Configure `.env` file
5. ✅ Test with test cards
6. ✅ Deploy to production with live keys

Need help? Check the troubleshooting section or refer to [Stripe Docs](https://stripe.com/docs).
