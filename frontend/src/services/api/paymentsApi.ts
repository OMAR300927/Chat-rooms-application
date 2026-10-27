import type {
  CheckoutSessionResponse,
  PaymentResponse,
} from '../../types/payments'
import coreApi from './coreApi'

export async function createCheckoutSession(): Promise<CheckoutSessionResponse> {
  const response =
    await coreApi.post<CheckoutSessionResponse>('/payments/checkout')
  return response.data
}

export async function getPaymentHistory(): Promise<PaymentResponse[]> {
  const response = await coreApi.get<PaymentResponse[]>('/payments')
  return response.data
}
