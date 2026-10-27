export type CheckoutSessionResponse = {
  checkout_url: string
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export type PaymentResponse = {
  id: string
  status: PaymentStatus
  amount_total: number | null
  currency: string | null
  created_at: string
}
