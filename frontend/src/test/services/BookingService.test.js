import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000');
  vi.stubEnv('VITE_API_TIMEOUT', '30000');
});

const mockApiBase = 'http://localhost:3000';

import BookingService from '../../services/BookingService';

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
      hotel: (id) => `/api/bookings/hotel?hotelId=${id}`,
      ownerDelete: (id) => `/api/bookings/owner/${id}`,
      ownerUpdatePayment: '/api/bookings/owner/update-payment',
    },
  },
}));

vi.mock('axios', () => {
  const mockAxios = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
  return { default: mockAxios };
});

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({
  default: mockToast,
  toast: mockToast,
}));

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });



  describe('fetchUserBookings', () => {
    it('calls GET /api/bookings/user with auth header', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, bookings: [{ _id: '1' }] } });

      const result = await BookingService.fetchUserBookings('test-token');

      expect(axios.get).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/user`,
        expect.objectContaining({ headers: { Authorization: 'Bearer test-token' }, timeout: 30000 })
      );
      expect(result.success).toBe(true);
      expect(result.bookings).toHaveLength(1);
    });

    it('throws and shows toast on error', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockRejectedValue({ response: { data: { message: 'Auth failed' } } });

      await expect(BookingService.fetchUserBookings('bad-token')).rejects.toThrow();
      expect(mockToast.error).toHaveBeenCalledWith('Auth failed');
    });
  });

  describe('checkAvailability', () => {
    it('calls POST with room, checkIn, checkOut', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, isAvailable: true } });

      const result = await BookingService.checkAvailability('room-123', '2025-06-10', '2025-06-15');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/check-availability`,
        { room: 'room-123', checkInDate: '2025-06-10', checkOutDate: '2025-06-15' },
        expect.objectContaining({ timeout: 30000 })
      );
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('createCheckoutSession', () => {
    it('posts bookingId and returns URL', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, url: 'https://stripe.com/checkout/session_123' } });

      const result = await BookingService.createCheckoutSession('booking-1', 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/create-checkout-session`,
        { bookingId: 'booking-1' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.url).toBe('https://stripe.com/checkout/session_123');
    });
  });

  describe('confirmCheckoutSession', () => {
    it('posts sessionId and returns paid status', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, paid: true } });

      const result = await BookingService.confirmCheckoutSession('session_abc', 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/confirm-checkout-session`,
        { sessionId: 'session_abc' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.paid).toBe(true);
    });
  });

  describe('cancel', () => {
    it('posts bookingId to cancel endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, message: 'Cancelled' } });

      const result = await BookingService.cancel('booking-1', 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/cancel`,
        { bookingId: 'booking-1' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.message).toBe('Cancelled');
    });
  });

  describe('create', () => {
    it('posts booking data to base endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'new' } } });

      const result = await BookingService.create({ room: 'room-1' }, 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/book`,
        { room: 'room-1' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.booking._id).toBe('new');
    });
  });

  describe('modify', () => {
    it('posts modifications to modify endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'modified' } } });

      const result = await BookingService.modify('booking-1', { checkInDate: '2025-07-01' }, 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/modify`,
        { bookingId: 'booking-1', checkInDate: '2025-07-01' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('setPaymentMethod', () => {
    it('posts payment method to payment-method endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true } });

      const result = await BookingService.setPaymentMethod('booking-1', 'Stripe', 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/payment-method`,
        { bookingId: 'booking-1', paymentMethod: 'Stripe' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('ownerDeleteBooking', () => {
    it('calls DELETE with owner endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.delete.mockResolvedValue({ data: { success: true, message: 'Deleted' } });

      const result = await BookingService.ownerDeleteBooking('booking-1', 'token');

      expect(axios.delete).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/owner/booking-1`,
        expect.objectContaining({ headers: { Authorization: 'Bearer token' }, timeout: 30000 })
      );
      expect(result.message).toBe('Deleted');
    });
  });

  describe('ownerUpdatePayment', () => {
    it('posts isPaid to owner update payment endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true } });

      const result = await BookingService.ownerUpdatePayment('booking-1', true, 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/owner/update-payment`,
        { bookingId: 'booking-1', isPaid: true },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('fetchHotelBookings', () => {
    it('calls GET with hotel endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, bookings: [{ _id: 'h1' }] } });

      const result = await BookingService.fetchHotelBookings('hotel-1', 'token');

      expect(axios.get).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/hotel?hotelId=hotel-1`,
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.bookings).toHaveLength(1);
    });
  });

  describe('pay', () => {
    it('posts bookingId to base endpoint', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({ data: { success: true } });

      const result = await BookingService.pay('booking-1', 'token');

      expect(axios.post).toHaveBeenCalledWith(
        `${mockApiBase}/api/bookings/pay`,
        { bookingId: 'booking-1' },
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockRejectedValue(new Error('Network Error'));

      await expect(BookingService.fetchUserBookings('token')).rejects.toThrow('Network Error');
      expect(mockToast.error).toHaveBeenCalledWith('Network Error');
    });

    it('handles errors without response data', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockRejectedValue({ response: {} });

      await expect(BookingService.fetchUserBookings('token')).rejects.toThrow();
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
