# Stripe Payment - Code Reference & Customization Guide

## 🔍 Current Implementation

### Backend Webhook Handler
Location: `Server/controllers/bookingController.js` (lines ~240-270)

```javascript
export const stripeWebhook = async (req, res) => {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send("Stripe webhook is not configured");
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      // Verify webhook signature - prevents spoofing
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return res.status(400).send(`Webhook verification failed: ${error.message}`);
    }

    // Handle payment completion
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const bookingId = session?.metadata?.bookingId;

      if (bookingId && session?.payment_status === "paid") {
        const booking = await Booking.findById(bookingId);
        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = "confirmed";
          booking.paymentMethod = "Stripe";
          await booking.save();
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).send("Webhook handler failed");
  }
};
```

### Checkout Session Creation
Location: `Server/controllers/bookingController.js` (lines ~180-230)

```javascript
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.json({ success: false, message: "Stripe is not configured" });
    }

    const user = req.user._id;
    const { bookingId } = req.body;

    // Fetch booking with related data
    const booking = await Booking.findOne({ _id: bookingId, user })
      .populate("room hotel");
    
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.json({ success: false, message: "Booking is already paid" });
    }

    // Create Stripe session
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(booking.totalPrice * 100), // Convert to cents
            product_data: {
              name: `${booking.hotel?.name || "Hotel"} - ${booking.room?.roomType || "Room"}`,
              description: `${new Date(booking.checkInDate).toDateString()} to ${new Date(booking.checkOutDate).toDateString()}`,
            },
          },
        },
      ],
      success_url: `${frontendBaseUrl}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/my-bookings?payment=cancelled`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: user.toString(),
      },
    });

    booking.paymentMethod = "Stripe";
    await booking.save();

    return res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Failed to create checkout session" });
  }
};
```

### Frontend Payment Handler
Location: `client/src/pages/MyBookings.jsx` (lines ~33-54)

```javascript
const handlePayNow = async (bookingId) => {
  if (!bookingId) return;
  setPayingId(bookingId);
  
  try {
    // Call backend to create Stripe session
    const sessionResponse = await axios.post(
      '/api/bookings/create-checkout-session',
      { bookingId },
      {
        headers: { Authorization: `Bearer ${await getToken()}` }
      }
    );

    if (!sessionResponse.data.success || !sessionResponse.data.url) {
      toast.error(sessionResponse.data.message || 'Unable to start Stripe checkout');
      return;
    }

    // Redirect to Stripe checkout
    window.location.assign(sessionResponse.data.url);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Unable to connect to Stripe');
  } finally {
    setPayingId(null);
  }
};
```

---

## 🛠️ Customization Examples

### Example 1: Add Discount Code Support

**Backend - Add to bookingController.js:**

```javascript
export const createCheckoutSession = async (req, res) => {
  try {
    // ... existing code ...
    
    const { bookingId, discountCode } = req.body;
    let discountAmount = 0;

    // Apply discount if provided
    if (discountCode) {
      const isValidCode = await validateDiscountCode(discountCode); // Your validation function
      if (isValidCode) {
        discountAmount = Math.round(booking.totalPrice * 0.1); // 10% discount
      }
    }

    const finalAmount = Math.round((booking.totalPrice - discountAmount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: finalAmount,
            product_data: {
              name: `${booking.hotel?.name} - ${booking.room?.roomType}`,
            },
          },
        },
      ],
      // ... rest of session config ...
    });

    // ... rest of handler ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### Example 2: Send Confirmation Email After Payment

**Backend - Update stripeWebhook:**

```javascript
export const stripeWebhook = async (req, res) => {
  // ... existing webhook code ...

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session?.metadata?.bookingId;
    const userId = session?.metadata?.userId;

    if (bookingId && session?.payment_status === "paid") {
      const booking = await Booking.findById(bookingId)
        .populate('user room hotel');
      
      if (booking && !booking.isPaid) {
        booking.isPaid = true;
        booking.status = "confirmed";
        booking.paymentMethod = "Stripe";
        await booking.save();

        // ✅ Send confirmation email
        await sendConfirmationEmail({
          email: booking.user.email,
          bookingDetails: booking,
          amount: session.amount_total / 100
        });
      }
    }
  }

  return res.status(200).json({ received: true });
};
```

### Example 3: Track Payment Failures

**Backend - Add payment failure tracking:**

```javascript
export const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  // Handle failed payments
  if (event.type === "charge.failed") {
    const charge = event.data.object;
    const bookingId = charge?.metadata?.bookingId;

    if (bookingId) {
      // Log failed payment attempt
      console.error(`Payment failed for booking ${bookingId}:`, charge.failure_message);
      
      // Optional: Update booking status
      await Booking.findByIdAndUpdate(
        bookingId,
        { status: "payment_failed" }
      );

      // Optional: Send user notification
      await sendPaymentFailureEmail(charge);
    }
  }

  return res.status(200).json({ received: true });
};
```

### Example 4: Add Payment Refund Functionality

**Backend - New route:**

```javascript
export const refundBooking = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId, reason } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, user });
    
    if (!booking || !booking.isPaid) {
      return res.json({ success: false, message: "Cannot refund this booking" });
    }

    // You'll need to store Stripe charge ID in the booking model
    // Then issue refund through Stripe API
    const refund = await stripe.refunds.create({
      charge: booking.stripeChargeId,
      reason: reason || "requested_by_customer"
    });

    // Update booking status
    booking.isPaid = false;
    booking.status = "refunded";
    await booking.save();

    return res.json({ success: true, refundId: refund.id });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
```

### Example 5: Add Customer Portal for Invoices

**Backend - New endpoint:**

```javascript
export const getCustomerPortal = async (req, res) => {
  try {
    const user = req.user._id;

    // Create Stripe customer session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId, // Store this when creating bookings
      return_url: process.env.FRONTEND_URL + "/my-bookings"
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
```

---

## 📊 Enhanced Booking Model (Optional)

Add these fields to store more Stripe data:

```javascript
const bookingSchema = new mongoose.Schema(
  {
    // ... existing fields ...
    
    // Stripe fields (optional but useful)
    stripeCustomerId: String,        // Stripe customer ID
    stripePaymentIntentId: String,   // Stripe payment ID
    stripeChargeId: String,          // For refunds
    transactionId: String,           // Session ID
    refundedAt: Date,                // Refund timestamp
    paymentDetails: {                // Store payment details
      brand: String,                 // "visa", "mastercard", etc.
      lastFour: String,              // Last 4 digits
      expMonth: Number,
      expYear: Number
    }
  },
  { timestamps: true }
);
```

---

## 🔗 Testing Stripe Events Locally

Use Stripe CLI to forward webhook events:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhook events to your local server
stripe listen --forward-to localhost:3000/api/bookings/stripe-webhook

# Your webhook signing secret will display - add to .env
# Then trigger test events
stripe trigger checkout.session.completed
```

---

## 🚨 Error Handling Improvements

Add better error handling to your webhook:

```javascript
async function processWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      return await handlePaymentSuccess(event);
    
    case "checkout.session.expired":
      return await handleSessionExpired(event);
    
    case "charge.refunded":
      return await handleRefund(event);
    
    case "charge.dispute.created":
      return await handleDispute(event);
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
```

---

## 📝 Environment Variables Summary

```bash
# Required for Stripe
STRIPE_SECRET_KEY=sk_test_your_key        # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_your_secret   # From webhook setup

# For redirects after payment
FRONTEND_URL=http://localhost:5173        # Dev
FRONTEND_URL=https://yourdomain.com       # Production

# Standard
MONGODB_URI=your_db_connection
NODE_ENV=development
```

---

## ✅ Testing Checklist for Customizations

When adding new payment features:

- [ ] Test with Stripe test card: `4242 4242 4242 4242`
- [ ] Test with declined card: `4000 0000 0000 0002`
- [ ] Verify webhook data with `stripe listen`
- [ ] Check database updates after webhook
- [ ] Test error scenarios (network timeout, invalid data)
- [ ] Verify email notifications (if added)
- [ ] Test with different user accounts
- [ ] Check Stripe Dashboard for all events

---

## 🔗 Useful Stripe API References

- **Checkout Sessions:** https://stripe.com/docs/api/checkout/sessions
- **Webhooks Events:** https://stripe.com/docs/api/events
- **Refunds:** https://stripe.com/docs/api/refunds
- **Customers:** https://stripe.com/docs/api/customers
- **Payment Intents:** https://stripe.com/docs/api/payment_intents

---

Need help with a specific customization? The examples above cover the most common scenarios! 🚀
