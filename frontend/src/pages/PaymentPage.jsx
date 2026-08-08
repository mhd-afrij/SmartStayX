import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BookingService from "../services/BookingService";
import { CreditCard, Wallet, Landmark } from "lucide-react";
import toast from "react-hot-toast";

const GATEWAY_ICONS = { stripe: CreditCard, paypal: Wallet, pay_at_hotel: Landmark };
const GATEWAY_LABELS = { stripe: "Credit / Debit Card", paypal: "PayPal", pay_at_hotel: "Pay At Hotel" };

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { getToken, formatPrice, navigate, user } = useAppContext();
  const [booking, setBooking] = useState(null);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    document.title = "Payment — SmartStayX";
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const [bookingsData, gatewaysData] = await Promise.all([
          BookingService.fetchUserBookings(token),
          BookingService.getAvailableGateways(token),
        ]);
        if (bookingsData.success) {
          const found = bookingsData.bookings.find((b) => b._id === bookingId);
          if (found) setBooking(found);
          else {
            toast.error("Booking not found");
            navigate("/my-bookings");
          }
        }
        if (gatewaysData.success) setGateways(gatewaysData.gateways || []);
      } catch {
        toast.error("Failed to load payment details");
        navigate("/my-bookings");
      } finally {
        setLoading(false);
      }
    };
    if (bookingId && user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, user]);

  const handlePay = async (method) => {
    setPaying(true);
    try {
      const token = await getToken();
      const data = await BookingService.createGatewayPayment(bookingId, method, token);
      if (!data.success) {
        toast.error(data.message || "Payment could not be started");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.success("Booking confirmed — pay at the hotel on arrival.");
      navigate("/my-bookings");
    } catch {
      toast.error("Payment could not be started");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="mx-auto max-w-lg px-4 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-[#f4f2ef]" />
          <div className="h-64 rounded-2xl bg-[#f4f2ef]" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white pt-32">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-slate-400">Booking not found.</p>
          <button onClick={() => navigate("/my-bookings")} className="gold-button inline-flex px-6 py-2.5 mt-4 text-sm">Go to Bookings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-60" />

      <div className="relative mx-auto max-w-xl px-4 md:px-8">
        <div className="luxury-card overflow-hidden p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-[#2563EB]" />
            </div>
            <h1 className="text-2xl font-playfair text-slate-900">Complete Payment</h1>
            <p className="text-sm text-slate-400 mt-1">Choose how you'd like to pay to finalize the booking.</p>
          </div>

          <div className="rounded-xl border border-black/[0.06] bg-[#f4f2ef] p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Hotel</span>
              <span className="text-slate-900 font-medium">{booking.hotel?.name || "Hotel"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Room</span>
              <span className="text-slate-900">{booking.room?.roomType || "Room"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Check-in</span>
              <span className="text-slate-900">{new Date(booking.checkInDate).toDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Check-out</span>
              <span className="text-slate-900">{new Date(booking.checkOutDate).toDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Guests</span>
              <span className="text-slate-900">{booking.guests}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-3 border-t border-black/[0.06]">
              <span className="text-slate-900">Total</span>
              <span className="text-[#2563EB]">{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {gateways.length === 0 ? (
              <p className="text-sm text-center text-slate-400">No payment methods are currently available.</p>
            ) : (
              gateways.map((g) => {
                const Icon = GATEWAY_ICONS[g] || CreditCard;
                return (
                  <button
                    key={g}
                    type="button"
                    disabled={paying}
                    onClick={() => handlePay(g)}
                    className="ghost-button w-full py-3.5 text-sm justify-between px-5 disabled:opacity-60"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#2563EB]" />
                      {GATEWAY_LABELS[g] || g}
                    </span>
                    <span className="text-xs text-slate-400">{g === "pay_at_hotel" ? "" : formatPrice(booking.totalPrice)}</span>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/my-bookings")}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
