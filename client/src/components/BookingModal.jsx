// BookingModal — Multi-step booking modal: date selection, review, payment checkout
import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const BookingModal = ({ isOpen, onClose, initialRoom, initialHotel }) => {
  const { formatPrice, axios, getToken } = useAppContext();

  // Booking form state.
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom?._id || "");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedRoom(initialRoom?._id || "");
    setCheckInDate("");
    setCheckOutDate("");
    setGuests(1);
    setBookingDetails(null);
    setLoading(false);
    setStep(1);

    if (!initialRoom?._id) return;

    try {
      const draft = JSON.parse(localStorage.getItem("bookingDraft") || "{}");
      if (draft.roomId === initialRoom._id) {
        setCheckInDate(draft.checkInDate || "");
        setCheckOutDate(draft.checkOutDate || "");
        setGuests(draft.guests || 1);
      }
    } catch {
      localStorage.removeItem("bookingDraft");
    }
  }, [initialRoom, isOpen]);

  if (!isOpen) return null;

  // Step 1: check room availability before booking.
  const handeCheckAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/bookings/check-availability", {
        room: selectedRoom || initialRoom._id,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
      });
      if (data.isAvailable) {
        toast.success("Room is available!");
        setStep(2);
      } else {
        toast.error("Room not available for selected dates");
      }
    } catch {
      toast.error("Failed to check availability");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: create the booking record.
  const handleCreateBooking = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/bookings/book",
        { room: selectedRoom, checkInDate, checkOutDate, guests: parseInt(guests) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setBookingDetails({
          booking: data.booking,
          pricing: data.pricing,
          idempotencyKey: data.idempotencyKey,
          holdExpiresAt: data.holdExpiresAt,
        });
        setStep(3);
        toast.success("Booking created! Proceed to payment");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: send the user to payment.
  const handlePayment = async () => {
    if (!bookingDetails?.booking._id) {
      toast.error("Booking ID missing");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/bookings/create-checkout-session",
        { bookingId: bookingDetails.booking._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success && data.url) {
        window.location.assign(data.url);
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch {
      toast.error("Payment setup failed");
    } finally {
      setLoading(false);
    }
  };

  const hotelName = initialHotel?.name || initialRoom?.hotel?.name || "Hotel";
  const nights =
    checkInDate && checkOutDate
      ? Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))
      : 0;

  return (
    /* Modal overlay */
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="perspective-1000 w-full max-w-2xl">
        {/* Modal panel */}
        <div className="glass-light animate-scale-in border-gradient rounded-3xl w-full max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>

          {/* Decorative background accents */}
          <div className="absolute -top-24 -right-24 w-72 h-72 orb-primary rounded-full pointer-events-none opacity-60" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 orb-amber rounded-full pointer-events-none opacity-40" />

          {/* Scrollable content container */}
          <div className="overflow-y-auto max-h-[90vh] rounded-3xl">

            {/* Modal header */}
            <div className="sticky top-0 z-10 glass-light rounded-t-3xl border-b border-white/20 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-playfair font-semibold gradient-text">
                Book at {hotelName}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:animate-pulse-glow transition-all duration-300 text-xl"
              >
                ×
              </button>
            </div>

            {/* Booking progress indicator */}
            <div className="px-6 pt-6">
              <StepIndicator currentStep={step} />
            </div>

            {/* Step-specific content */}
            <div className="p-6 space-y-6">
              {step >= 1 && (
                <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                  <DateSelectionStep
                    checkInDate={checkInDate}
                    setCheckInDate={setCheckInDate}
                    checkOutDate={checkOutDate}
                    setCheckOutDate={setCheckOutDate}
                    guests={guests}
                    setGuests={setGuests}
                    isDisabled={step > 1}
                    step={step}
                    onCheck={handeCheckAvailability}
                    loading={loading}
                  />
                </div>
              )}

              {step >= 2 && (
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <ReviewStep
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    nights={nights}
                    guests={guests}
                    bookingDetails={bookingDetails}
                    formatPrice={formatPrice}
                    step={step}
                    onCreateBooking={handleCreateBooking}
                    loading={loading}
                  />
                </div>
              )}

              {step >= 3 && (
                <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <PaymentStep
                    bookingDetails={bookingDetails}
                    onPay={handlePayment}
                    loading={loading}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: "Dates" },
    { num: 2, label: "Review" },
    { num: 3, label: "Payment" },
  ];
  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
              currentStep >= s.num
                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white/60 border-2 border-slate-200 text-slate-400"
            } ${currentStep === s.num ? "animate-float" : ""}`}>
              {currentStep > s.num ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <span className={`text-xs font-medium transition-colors duration-500 ${
              currentStep >= s.num ? "text-blue-600" : "text-slate-400"
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 rounded-full transition-all duration-700 ${
              currentStep > s.num ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-slate-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function DateSelectionStep({
  checkInDate, setCheckInDate,
  checkOutDate, setCheckOutDate,
  guests, setGuests, isDisabled, step, onCheck, loading,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">1</div>
        <h3 className="text-lg font-semibold text-black">Step 1: Select Dates & Guests</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Check-in Date</label>
          <input
            type="date" value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="booking-date-input w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2.5 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: '#000000', WebkitTextFillColor: '#000000', colorScheme: 'light' }}
            disabled={isDisabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">Check-out Date</label>
          <input
            type="date" value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="booking-date-input w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2.5 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none"
            style={{ color: '#000000', WebkitTextFillColor: '#000000', colorScheme: 'light' }}
            disabled={isDisabled}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-2">Number of Guests</label>
        <select
          value={guests} onChange={(e) => setGuests(e.target.value)}
          className="booking-select w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2.5 text-black focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: '#000000', WebkitTextFillColor: '#000000', colorScheme: 'light' }}
          disabled={isDisabled}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n} className="text-black">{n} Guest{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>
      {step === 1 && (
        <button
          onClick={onCheck} disabled={loading}
          className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 ${loading ? 'animate-shimmer' : ''}`}
        >
          {loading ? "Checking..." : "Check Availability"}
        </button>
      )}
    </div>
  );
}

function ReviewStep({ checkInDate, checkOutDate, nights, guests, bookingDetails, formatPrice, step, onCreateBooking, loading }) {
  return (
    <div className="space-y-5 pt-6 border-t border-slate-200/60">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">2</div>
        <h3 className="text-lg font-semibold text-slate-800">Step 2: Review Booking Details</h3>
      </div>
      <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 space-y-3 tilt-card">
        <DetailRow label="Check-in:" value={new Date(checkInDate).toDateString()} />
        <div className="border-t border-slate-100" />
        <DetailRow label="Check-out:" value={new Date(checkOutDate).toDateString()} />
        <div className="border-t border-slate-100" />
        <DetailRow label="Nights:" value={nights} />
        <div className="border-t border-slate-100" />
        <DetailRow label="Guests:" value={guests} />
      </div>

      {bookingDetails?.pricing && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-5 space-y-2">
          <DetailRow label="Price per night:" value={formatPrice(bookingDetails.pricing.dynamicPricePerNight)} />
          <div className="border-t border-blue-200/30" />
          <DetailRow label={`Subtotal (${nights} nights):`} value={formatPrice(bookingDetails.pricing.totalPrice)} />
          <div className="border-t border-blue-200/30 pt-2 flex justify-between font-semibold">
            <span className="text-slate-700">Total:</span>
            <span className="text-lg gradient-text">{formatPrice(bookingDetails.pricing.totalPrice)}</span>
          </div>
        </div>
      )}

      {step === 2 && (
        <button
          onClick={onCreateBooking} disabled={loading}
          className={`w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 ${loading ? 'animate-shimmer' : ''}`}
        >
          {loading ? "Creating booking..." : "Confirm Booking"}
        </button>
      )}
    </div>
  );
}

function PaymentStep({ bookingDetails, onPay, loading }) {
  return (
    <div className="space-y-5 pt-6 border-t border-slate-200/60">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">3</div>
        <h3 className="text-lg font-semibold text-slate-800">Step 3: Payment</h3>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-green-700">Booking reserved!</p>
        </div>
        <p className="text-sm text-slate-500 mb-1">
          Your hold expires at:{" "}
          <span className="font-semibold text-slate-700">{new Date(bookingDetails?.holdExpiresAt).toLocaleTimeString()}</span>
        </p>
        <p className="text-sm text-slate-500">
          Complete payment to confirm your booking.
        </p>
      </div>
      <button
        onClick={onPay} disabled={loading}
        className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 ${loading ? 'animate-shimmer' : ''}`}
      >
        {loading ? "Processing..." : (
          <>
            Proceed to Secure Payment
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 011-1h12a1 1 0 011 1H3zm0 2h14v2H3V3zm0 4h14v2H3V7zm0 4h14v2H3v-2zm0 4h14v2H3v-2z" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export default BookingModal;
