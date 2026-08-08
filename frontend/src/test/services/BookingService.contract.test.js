import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => {
  const mockAxios = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockAxios };
});

const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: mockToast,
  default: { toast: mockToast },
}));

vi.mock('../../config/endpoints', () => ({
  default: {
    bookings: {
      user: '/api/bookings/user',
      base: '/api/bookings',
      book: '/api/bookings/book',
      cancel: '/api/bookings/cancel',
      modify: '/api/bookings/modify',
      pay: '/api/bookings/pay',
      paymentMethod: '/api/bookings/payment-method',
      checkAvailability: '/api/bookings/check-availability',
      createCheckout: '/api/bookings/create-checkout-session',
      confirmCheckout: '/api/bookings/confirm-checkout-session',
      ownerDelete: (id) => `/api/bookings/owner/${id}`,
      ownerUpdatePayment: '/api/bookings/owner/update-payment',
      hotel: (id) => `/api/bookings/hotel?hotelId=${id}`,
    },
  },
}));

describe('BookingService (contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000');
  });

  it('fetchUserBookings: GET with Authorization header', async () => {
    const axios = (await import('axios')).default;
    axios.get.mockResolvedValue({ data: { success: true, bookings: [{ _id: '1' }] } });

    const BookingService = (await import('../../services/BookingService')).default;

    const result = await BookingService.fetchUserBookings('test-token');

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/user',
      expect.objectContaining({
        timeout: expect.any(Number),
        headers: { Authorization: 'Bearer test-token' },
      })
    );
    expect(result.success).toBe(true);
  });

  it('checkAvailability: POST with room + dates payload', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockResolvedValue({ data: { success: true, isAvailable: true } });

    const BookingService = (await import('../../services/BookingService')).default;

    await BookingService.checkAvailability('room-123', '2025-06-10', '2025-06-15');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/check-availability',
      { room: 'room-123', checkInDate: '2025-06-10', checkOutDate: '2025-06-15' },
      expect.objectContaining({ headers: {} })
    );
  });

  it('createCheckoutSession: POST bookingId with Authorization header', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockResolvedValue({ data: { success: true, url: 'https://stripe.com/checkout/session_123' } });

    const BookingService = (await import('../../services/BookingService')).default;

    const res = await BookingService.createCheckoutSession('booking-1', 'token');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/create-checkout-session',
      { bookingId: 'booking-1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
    expect(res.url).toContain('session_123');
  });

  it('setPaymentMethod: POST to /payment-method and sends paymentMethod field', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockResolvedValue({ data: { success: true } });

    const BookingService = (await import('../../services/BookingService')).default;

    await BookingService.setPaymentMethod('booking-1', 'Stripe', 'token');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/payment-method',
      { bookingId: 'booking-1', paymentMethod: 'Stripe' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
  });

  it('ownerUpdatePayment: POST sets isPaid', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockResolvedValue({ data: { success: true } });

    const BookingService = (await import('../../services/BookingService')).default;

    await BookingService.ownerUpdatePayment('booking-1', true, 'token');

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/owner/update-payment',
      { bookingId: 'booking-1', isPaid: true },
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
  });

  it('ownerDeleteBooking: DELETE passes auth header', async () => {
    const axios = (await import('axios')).default;
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Deleted' } });

    const BookingService = (await import('../../services/BookingService')).default;

    const res = await BookingService.ownerDeleteBooking('booking-1', 'token');

    expect(axios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookings/owner/booking-1',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
    expect(res.message).toBe('Deleted');
  });

  it('error handling: toast.error and rethrows when API rejects (response.message)', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockRejectedValue({ response: { data: { message: 'Auth failed' } } });

    const BookingService = (await import('../../services/BookingService')).default;

    await expect(BookingService.cancel('booking-1', 'token')).rejects.toBeTruthy();
    expect(mockToast.error).toHaveBeenCalledWith('Auth failed');
  });

  it('error handling: toast.error and rethrows when API rejects (no response.data.message)', async () => {
    const axios = (await import('axios')).default;
    axios.get.mockRejectedValue(new Error('Network Error'));

    const BookingService = (await import('../../services/BookingService')).default;

    await expect(BookingService.fetchHotelBookings('hotel-1', 'token')).rejects.toBeTruthy();
    expect(mockToast.error).toHaveBeenCalled();
  });
});

