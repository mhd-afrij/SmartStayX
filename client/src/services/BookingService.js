import axios from "axios";
import { toast } from "react-hot-toast";
import API_ENDPOINTS from "../config/endpoints";
import { config } from "../config/ConfigManager";

// Booking API service — user and owner booking CRUD, Stripe checkout, refunds.
class BookingService {
  get #baseUrl() {
    return config.get("api.baseUrl") || "";
  }

  get #timeout() {
    return config.get("api.timeout") || 30000;
  }

  #headers(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async #request(method, url, payload = null, token = null) {
    const cfg = { timeout: this.#timeout, headers: this.#headers(token) };
    try {
      const fullUrl = url.startsWith("http") ? url : `${this.#baseUrl}${url}`;
      let response;
      if (method === "get" || method === "delete") {
        response = await axios[method](fullUrl, cfg);
      } else {
        response = await axios[method](fullUrl, payload, cfg);
      }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(message);
      throw error;
    }
  }

  fetchUserBookings(token) {
    return this.#request("get", API_ENDPOINTS.bookings.user, null, token);
  }

  create(bookingData, token) {
    return this.#request("post", API_ENDPOINTS.bookings.base, bookingData, token);
  }

  cancel(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.cancel, { bookingId }, token);
  }

  modify(bookingId, modifications, token) {
    return this.#request("post", API_ENDPOINTS.bookings.modify, { bookingId, ...modifications }, token);
  }

  checkAvailability(room, checkInDate, checkOutDate) {
    return this.#request("post", API_ENDPOINTS.bookings.checkAvailability, { room, checkInDate, checkOutDate });
  }

  createCheckoutSession(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.createCheckout, { bookingId }, token);
  }

  confirmCheckoutSession(sessionId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.confirmCheckout, { sessionId }, token);
  }

  pay(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.base, { bookingId }, token);
  }

  setPaymentMethod(bookingId, paymentMethod, token) {
    return this.#request("post", `${API_ENDPOINTS.bookings.base}/payment-method`, { bookingId, paymentMethod }, token);
  }

  fetchHotelBookings(hotelId, token) {
    return this.#request("get", API_ENDPOINTS.bookings.hotel(hotelId), null, token);
  }

  ownerDeleteBooking(bookingId, token) {
    return this.#request("delete", API_ENDPOINTS.bookings.ownerDelete(bookingId), null, token);
  }

  ownerUpdatePayment(bookingId, isPaid, token) {
    return this.#request("post", API_ENDPOINTS.bookings.ownerUpdatePayment, { bookingId, isPaid }, token);
  }

  requestRefund(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.refundRequest, { bookingId }, token);
  }

  handleRefund(bookingId, action, token) {
    return this.#request("post", API_ENDPOINTS.bookings.handleRefund, { bookingId, action }, token);
  }
}

export default new BookingService();
