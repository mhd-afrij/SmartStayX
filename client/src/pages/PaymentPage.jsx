import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BookingService from "../services/BookingService";
import { CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const PaymentForm = ({ bookingId, totalPrice, formatPrice, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { getToken, navigate } = useAppContext();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      const token = await getToken();
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/my-bookings`,
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setPaying(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const data = await BookingService.confirmPaymentIntent(bookingId, paymentIntent.id, token);
        if (data.success) {
          toast.success("Payment successful!");
          navigate("/my-bookings");
        } else {
          toast.error(data.message || "Failed to confirm payment");
        }
      } else {
        toast.error("Payment was not completed");
      }
    } catch {
      toast.error("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
        <PaymentElement
          options={{
            style: {
              theme: "night",
              variables: {
                colorPrimary: "#D4A85F",
                colorBackground: "#0d1728",
                colorText: "#ffffff",
                colorTextSecondary: "#a0aec0",
                fontFamily: "Inter, system-ui, sans-serif",
                borderRadius: "12px",
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || paying}
        className="gold-button w-full py-3 text-sm uppercase tracking-[0.18em] disabled:opacity-70"
      >
        {paying ? "Processing..." : `Pay ${formatPrice(totalPrice)}`}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
      >
        Back to My Bookings
      </button>
    </form>
  );
};

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { getToken, formatPrice, navigate, user } = useAppContext();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    document.title = "Payment — SmartStayX";
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const data = await BookingService.fetchUserBookings(token);
        if (data.success) {
          const found = data.bookings.find((b) => b._id === bookingId);
          if (found) {
            setBooking(found);
            const pi = await BookingService.createPaymentIntent(bookingId, token);
            if (pi.success && pi.clientSecret) {
              setClientSecret(pi.clientSecret);
            } else {
              toast.error(pi.message || "Failed to initialize payment");
              navigate("/my-bookings");
            }
          } else {
            toast.error("Booking not found");
            navigate("/my-bookings");
          }
        } else {
          toast.error("Failed to load booking");
          navigate("/my-bookings");
        }
      } catch {
        toast.error("Failed to load payment details");
        navigate("/my-bookings");
      } finally {
        setLoading(false);
      }
    };
    if (bookingId && user) fetchBooking();
  }, [bookingId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] pt-32">
        <div className="mx-auto max-w-lg px-4 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-white/5" />
          <div className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#07111f] pt-32">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-white/40">Booking not found.</p>
          <button onClick={() => navigate("/my-bookings")} className="gold-button inline-flex px-6 py-2.5 mt-4 text-sm">Go to Bookings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-40" />

      <div className="relative mx-auto max-w-xl px-4 md:px-8">

        <div className="luxury-card overflow-hidden p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#D4A85F]/10 border border-[#D4A85F]/20 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-[#D4A85F]" />
            </div>
            <h1 className="text-2xl font-playfair text-white">Complete Payment</h1>
            <p className="text-sm text-white/40 mt-1">Confirm your payment to finalize the booking.</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Hotel</span>
              <span className="text-white font-medium">{booking.hotel?.name || "Hotel"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Room</span>
              <span className="text-white">{booking.room?.roomType || "Room"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Check-in</span>
              <span className="text-white">{new Date(booking.checkInDate).toDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Check-out</span>
              <span className="text-white">{new Date(booking.checkOutDate).toDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Guests</span>
              <span className="text-white">{booking.guests}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-3 border-t border-white/[0.06]">
              <span className="text-white">Total</span>
              <span className="text-[#F5D08A]">{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                bookingId={booking._id}
                totalPrice={booking.totalPrice}
                formatPrice={formatPrice}
                onBack={() => navigate("/my-bookings")}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
