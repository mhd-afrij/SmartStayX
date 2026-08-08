// stripeUtil.js — Stripe SDK wrapper for payment processing
import Stripe from 'stripe'

// Stripe utility — lazy-init Stripe client and webhook event construction.
// Returns a Stripe client instance, or null if the secret key is not configured
export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// Constructs and verifies a Stripe webhook event from the raw body and signature header
export const constructEvent = (rawBody, sigHeader) => {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.webhooks.constructEvent(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)
}
