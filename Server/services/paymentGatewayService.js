// paymentGatewayService.js — Multi-gateway payment adapter (Stripe, PayPal, Pay At Hotel)
import { getStripe } from "../utils/stripeUtil.js";

class PaymentGatewayService {
  constructor() {
    this.gateways = {
      stripe: { enabled: Boolean(process.env.STRIPE_SECRET_KEY), processor: this.stripeProcessor.bind(this) },
      paypal: { enabled: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), processor: this.paypalProcessor.bind(this) },
      pay_at_hotel: { enabled: true, processor: this.payAtHotelProcessor.bind(this) },
    };
  }

  getAvailableGateways() {
    return Object.entries(this.gateways)
      .filter(([, config]) => config.enabled)
      .map(([name]) => name);
  }

  async processPayment({ method, booking, frontendUrl }) {
    const gateway = this.gateways[method];
    if (!gateway) throw Object.assign(new Error(`Payment method '${method}' not supported`), { status: 400 });
    if (!gateway.enabled) throw Object.assign(new Error(`Payment method '${method}' is not configured`), { status: 400 });
    return gateway.processor({ booking, frontendUrl });
  }

  async stripeProcessor({ booking, frontendUrl }) {
    const stripe = getStripe();
    if (!stripe) throw Object.assign(new Error("Stripe is not configured"), { status: 500 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(booking.totalPrice || 0) * 100),
          product_data: {
            name: `Booking - ${booking.hotel?.name || "Hotel"}`,
            description: `${new Date(booking.checkInDate).toDateString()} to ${new Date(booking.checkOutDate).toDateString()}`,
          },
        },
      }],
      success_url: `${frontendUrl}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/my-bookings?payment=cancelled`,
      metadata: { bookingId: booking._id.toString() },
    });

    return {
      gateway: "stripe",
      sessionId: session.id,
      url: session.url,
      redirectUrl: session.url,
    };
  }

  async paypalProcessor({ booking, frontendUrl }) {
    const base = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    // Get access token
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Create order
    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: booking._id.toString(),
          amount: { currency_code: "USD", value: String(Number(booking.totalPrice || 0).toFixed(2)) },
          description: `Booking at ${booking.hotel?.name || "StayX"}`,
        }],
        application_context: {
          return_url: `${frontendUrl}/my-bookings?payment=success&gateway=paypal`,
          cancel_url: `${frontendUrl}/my-bookings?payment=cancelled&gateway=paypal`,
        },
      }),
    });
    const orderData = await orderRes.json();
    const approvalUrl = orderData.links?.find((l) => l.rel === "approve")?.href;

    return {
      gateway: "paypal",
      orderId: orderData.id,
      url: approvalUrl,
      redirectUrl: approvalUrl,
      status: orderData.status,
    };
  }

  payAtHotelProcessor() {
    return {
      gateway: "pay_at_hotel",
      message: "Payment will be collected at the hotel during check-in",
      requiresConfirmation: true,
    };
  }

  async capturePayPalOrder(orderId) {
    const base = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();

    const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
    });
    return res.json();
  }
}

export default new PaymentGatewayService();
