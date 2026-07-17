import { describe, it, expect, vi, beforeEach } from 'vitest';

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
      refundRequest: '/api/bookings/refund-request',
      handleRefund: '/api/bookings/handle-refund',
    },
  },
}));

const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};
vi.mock('axios', () => ({ default: mockAxios }));

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('react-hot-toast', () => ({
  default: mockToast,
  toast: mockToast,
}));

const mockApiBase = 'http://localhost:3000';

describe('BookingService Integration — full lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_BACKEND_URL', mockApiBase);
    vi.stubEnv('VITE_API_TIMEOUT', '30000');
  });

  it('complete booking flow: check availability -> create -> pay', async () => {
    mockAxios.post
      // checkAvailability
      .mockResolvedValueOnce({ data: { success: true, isAvailable: true } })
      // create booking
      .mockResolvedValueOnce({ data: { success: true, booking: { _id: 'booking-1', status: 'pending' } } })
      // pay
      .mockResolvedValueOnce({ data: { success: true, booking: { _id: 'booking-1', isPaid: true, status: 'confirmed' } } });

    const BookingService = (await import('../../services/BookingService')).default;

    // Step 1: Check availability
    const availResult = await BookingService.checkAvailability('room-1', '2026-08-01', '2026-08-05');
    expect(availResult.isAvailable).toBe(true);
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      1,
      `${mockApiBase}/api/bookings/check-availability`,
      { room: 'room-1', checkInDate: '2026-08-01', checkOutDate: '2026-08-05' },
      expect.objectContaining({ timeout: 30000 }),
    );

    // Step 2: Create booking
    const bookingData = { room: 'room-1', checkInDate: '2026-08-01', checkOutDate: '2026-08-05', guests: 2 };
    const createResult = await BookingService.create(bookingData, 'token-1');
    expect(createResult.booking._id).toBe('booking-1');
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      2,
      `${mockApiBase}/api/bookings/book`,
      bookingData,
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );

    // Step 3: Pay
    const payResult = await BookingService.pay('booking-1', 'token-1');
    expect(payResult.booking.isPaid).toBe(true);
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      3,
      `${mockApiBase}/api/bookings/pay`,
      { bookingId: 'booking-1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
  });

  it('Stripe checkout flow: create session -> confirm session', async () => {
    mockAxios.post
      // createCheckoutSession
      .mockResolvedValueOnce({ data: { success: true, sessionId: 'cs_123', url: 'https://stripe.com/checkout/cs_123' } })
      // confirmCheckoutSession
      .mockResolvedValueOnce({ data: { success: true, paid: true, booking: { _id: 'b-1', isPaid: true } } });

    const BookingService = (await import('../../services/BookingService')).default;

    // Step 1: Create Stripe session
    const sessionResult = await BookingService.createCheckoutSession('b-1', 'token-1');
    expect(sessionResult.sessionId).toBe('cs_123');
    expect(sessionResult.url).toContain('stripe.com');
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      1,
      `${mockApiBase}/api/bookings/create-checkout-session`,
      { bookingId: 'b-1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );

    // Step 2: Confirm after return from Stripe
    const confirmResult = await BookingService.confirmCheckoutSession('cs_123', 'token-1');
    expect(confirmResult.paid).toBe(true);
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      2,
      `${mockApiBase}/api/bookings/confirm-checkout-session`,
      { sessionId: 'cs_123' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
  });

  it('cancel flow: create -> cancel', async () => {
    mockAxios.post
      .mockResolvedValueOnce({ data: { success: true, booking: { _id: 'b-1', status: 'pending' } } })
      .mockResolvedValueOnce({ data: { success: true, message: 'Booking cancelled successfully', booking: { _id: 'b-1', status: 'cancelled' } } });

    const BookingService = (await import('../../services/BookingService')).default;

    const createResult = await BookingService.create({ room: 'r-1', checkInDate: '2026-09-01', checkOutDate: '2026-09-03', guests: 1 }, 'token-1');
    expect(createResult.booking._id).toBe('b-1');

    const cancelResult = await BookingService.cancel('b-1', 'token-1');
    expect(cancelResult.message).toBe('Booking cancelled successfully');
    expect(mockAxios.post).toHaveBeenLastCalledWith(
      `${mockApiBase}/api/bookings/cancel`,
      { bookingId: 'b-1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
  });

  it('refund flow: request -> owner handles', async () => {
    mockAxios.post
      .mockResolvedValueOnce({ data: { success: true, message: 'Refund request submitted', booking: { refundStatus: 'pending' } } })
      .mockResolvedValueOnce({ data: { success: true, message: 'Refund status updated successfully', booking: { refundStatus: 'approved' } } });

    const BookingService = (await import('../../services/BookingService')).default;

    const requestResult = await BookingService.requestRefund('b-1', 'token-user');
    expect(requestResult.message).toContain('Refund request');
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      1,
      `${mockApiBase}/api/bookings/refund-request`,
      { bookingId: 'b-1' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-user' } }),
    );

    const handleResult = await BookingService.handleRefund('b-1', 'approved', 'token-owner');
    expect(handleResult.message).toContain('Refund status');
    expect(mockAxios.post).toHaveBeenNthCalledWith(
      2,
      `${mockApiBase}/api/bookings/handle-refund`,
      { bookingId: 'b-1', action: 'approved' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-owner' } }),
    );
  });

  it('modify booking flow', async () => {
    mockAxios.post
      .mockResolvedValueOnce({ data: { success: true, booking: { _id: 'b-1', status: 'pending' } } })
      .mockResolvedValueOnce({ data: { success: true, booking: { _id: 'b-1', checkInDate: '2026-10-01', checkOutDate: '2026-10-05' } } });

    const BookingService = (await import('../../services/BookingService')).default;

    await BookingService.create({ room: 'r-1', checkInDate: '2026-09-01', checkOutDate: '2026-09-03', guests: 1 }, 'token-1');

    const modifyResult = await BookingService.modify('b-1', { checkInDate: '2026-10-01', checkOutDate: '2026-10-05' }, 'token-1');
    expect(modifyResult.booking.checkInDate).toBe('2026-10-01');
    expect(mockAxios.post).toHaveBeenLastCalledWith(
      `${mockApiBase}/api/bookings/modify`,
      { bookingId: 'b-1', checkInDate: '2026-10-01', checkOutDate: '2026-10-05' },
      expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
    );
  });

  it('owner management flow: fetch hotel bookings -> delete', async () => {
    mockAxios.get
      .mockResolvedValueOnce({ data: { success: true, bookings: [{ _id: 'b-1' }, { _id: 'b-2' }] } });

    mockAxios.delete
      .mockResolvedValueOnce({ data: { success: true, message: 'Booking deleted successfully' } });

    const BookingService = (await import('../../services/BookingService')).default;

    const hotelBookings = await BookingService.fetchHotelBookings('hotel-1', 'token-owner');
    expect(hotelBookings.bookings).toHaveLength(2);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `${mockApiBase}/api/bookings/hotel?hotelId=hotel-1`,
      expect.objectContaining({ headers: { Authorization: 'Bearer token-owner' } }),
    );

    const deleteResult = await BookingService.ownerDeleteBooking('b-1', 'token-owner');
    expect(deleteResult.message).toBe('Booking deleted successfully');
    expect(mockAxios.delete).toHaveBeenCalledWith(
      `${mockApiBase}/api/bookings/owner/b-1`,
      expect.objectContaining({ headers: { Authorization: 'Bearer token-owner' } }),
    );
  });

  it('handles network errors at every stage without crashing', async () => {
    mockAxios.post
      .mockRejectedValueOnce({ response: { data: { message: 'Room not available' } } })
      .mockRejectedValueOnce(new Error('Network error'));

    const BookingService = (await import('../../services/BookingService')).default;

    await expect(BookingService.checkAvailability('r-1', '2026-08-01', '2026-08-05')).rejects.toThrow();
    expect(mockToast.error).toHaveBeenCalledWith('Room not available');

    await expect(BookingService.create({ room: 'r-1' }, 'token')).rejects.toThrow();
    expect(mockToast.error).toHaveBeenCalledWith('Network error');
  });

  it('contract: all public methods accept expected parameter shapes', async () => {
    mockAxios.get.mockResolvedValue({ data: { success: true, bookings: [] } });
    mockAxios.post.mockResolvedValue({ data: { success: true } });
    mockAxios.delete.mockResolvedValue({ data: { success: true } });

    const BookingService = (await import('../../services/BookingService')).default;
    const token = 'tkn';

    const methods = [
      () => BookingService.fetchUserBookings(token),
      () => BookingService.create({ room: 'r1', checkInDate: 'd1', checkOutDate: 'd2' }, token),
      () => BookingService.cancel('b1', token),
      () => BookingService.modify('b1', { checkInDate: 'd3' }, token),
      () => BookingService.pay('b1', token),
      () => BookingService.setPaymentMethod('b1', 'card', token),
      () => BookingService.checkAvailability('r1', 'd1', 'd2'),
      () => BookingService.createCheckoutSession('b1', token),
      () => BookingService.confirmCheckoutSession('cs1', token),
      () => BookingService.fetchHotelBookings('h1', token),
      () => BookingService.ownerDeleteBooking('b1', token),
      () => BookingService.ownerUpdatePayment('b1', true, token),
      () => BookingService.requestRefund('b1', token),
      () => BookingService.handleRefund('b1', 'approved', token),
    ];

    const results = await Promise.allSettled(methods.map((fn) => fn()));
    results.forEach((r, i) => {
      expect(r.status).toBe('fulfilled');
    });
  });
});
