import Stripe from 'stripe'

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export const constructEvent = (rawBody, sigHeader) => {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  return stripe.webhooks.constructEvent(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)
}
