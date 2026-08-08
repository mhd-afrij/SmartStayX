import axios from "axios";
import { toast } from "react-hot-toast";
import API_ENDPOINTS from "../config/endpoints";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Booking API service — user and owner booking CRUD, Stripe checkout.
class BookingService {
  get #baseUrl() {
    return API_BASE_URL;
  }

  get #timeout() {
    return API_TIMEOUT;
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
    return this.#request("post", API_ENDPOINTS.bookings.book, bookingData, token);
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

  calculatePrice(payload) {
    return this.#request("post", API_ENDPOINTS.bookings.calculatePrice, payload);
  }

  getAvailableGateways(token) {
    return this.#request("get", API_ENDPOINTS.payments.available, null, token);
  }

  createGatewayPayment(bookingId, method, token) {
    return this.#request("post", API_ENDPOINTS.payments.create, { bookingId, method }, token);
  }

  createCheckoutSession(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.createCheckout, { bookingId }, token);
  }

  confirmCheckoutSession(sessionId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.confirmCheckout, { sessionId }, token);
  }

  pay(bookingId, token) {
    return this.#request("post", API_ENDPOINTS.bookings.pay, { bookingId }, token);
  }

  setPaymentMethod(bookingId, paymentMethod, token) {
    return this.#request("post", API_ENDPOINTS.bookings.paymentMethod, { bookingId, paymentMethod }, token);
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

}

export default new BookingService();
