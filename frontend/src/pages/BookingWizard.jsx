import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BookingService from "../services/BookingService";
import toast from "react-hot-toast";
import {
  BedDouble, User, ClipboardCheck, CreditCard, CheckCircle2,
  ChevronRight, ChevronLeft, MapPin, Wallet, Landmark, Loader2,
} from "lucide-react";
import { Input, Textarea } from "../components/ui/Field";
import { Skeleton, ErrorState } from "../components/ui/States";

const STEPS = [
  { key: "room", label: "Select Room", icon: BedDouble },
  { key: "guest", label: "Guest Details", icon: User },
  { key: "review", label: "Review", icon: ClipboardCheck },
  { key: "method", label: "Payment Method", icon: Wallet },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "confirm", label: "Confirmation", icon: CheckCircle2 },
];

const GATEWAY_ICONS = { stripe: CreditCard, paypal: Wallet, pay_at_hotel: Landmark };
const GATEWAY_LABELS = { stripe: "Credit / Debit Card", paypal: "PayPal", pay_at_hotel: "Pay At Hotel" };

const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-between gap-1 mb-8 overflow-x-auto scrollbar-hide">
    {STEPS.map((s, i) => {
      const Icon = s.icon;
      const isActive = i === step;
      const isDone = i < step;
      return (
        <div key={s.key} className="flex items-center flex-1 min-w-[76px]">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                isDone ? "bg-[#2563EB] border-[#2563EB] text-white"
                : isActive ? "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/10"
                : "border-[#E2E8F0] text-[#94A3B8] bg-white"
              }`}
            >
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] uppercase tracking-wide text-center ${isActive ? "text-[#0F172A] font-semibold" : "text-[#94A3B8]"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 -mt-5 ${isDone ? "bg-[#2563EB]" : "bg-[#E2E8F0]"}`} />
          )}
        </div>
      );
    })}
  </div>
);

const BookingWizard = () => {
  const { roomId } = useParams();
  const { axios, getToken, user, formatPrice, navigate } = useAppContext();

  const [step, setStep] = useState(0);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [dates, setDates] = useState({ checkInDate: "", checkOutDate: "", guests: 1 });
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [checking, setChecking] = useState(false);

  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "", specialRequests: "" });

  const [booking, setBooking] = useState(null);
  const [creatingBooking, setCreatingBooking] = useState(false);

  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paying, setPaying] = useState(false);

  const nights = useMemo(() => calcNights(dates.checkInDate, dates.checkOutDate), [dates]);

  useEffect(() => {
    document.title = "Book Your Stay — SmartStayX";
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const { data } = await axios.get(`/api/rooms/${roomId}`);
        if (data.success) setRoom(data.room);
        else setLoadError(true);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchRoom();
  }, [roomId, axios]);

  useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleCheckAvailability = async () => {
    if (!dates.checkInDate || !dates.checkOutDate || !dates.guests) {
      toast.error("Please fill in check-in, check-out, and guest count.");
      return;
    }
    if (nights < 1) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    setChecking(true);
    try {
      const availability = await BookingService.checkAvailability(roomId, dates.checkInDate, dates.checkOutDate);
      if (!availability.success || !availability.isAvailable) {
        toast.error("Room is not available for these dates.");
        return;
      }
      const priceData = await BookingService.calculatePrice({
        roomId,
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        guests: dates.guests,
      });
      if (priceData.success) setPricing(priceData.pricing);
      setAvailabilityChecked(true);
      setStep(1);
    } catch {
      toast.error("Could not check availability.");
    } finally {
      setChecking(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!user) {
      toast.error("Please login to book this room.");
      return;
    }
    setCreatingBooking(true);
    try {
      const token = await getToken();
      const data = await BookingService.create(
        {
          room: roomId,
          checkInDate: dates.checkInDate,
          checkOutDate: dates.checkOutDate,
          guests: Number(dates.guests),
          guestEmail: guestInfo.email,
        },
        token
      );
      if (data.success) {
        setBooking(data.booking);
        const gatewaysData = await BookingService.getAvailableGateways(token);
        if (gatewaysData.success) {
          setGateways(gatewaysData.gateways || []);
          setSelectedGateway((gatewaysData.gateways || [])[0] || null);
        }
        setStep(3);
      } else {
        toast.error(data.message || "Failed to create booking.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking.");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handlePay = async () => {
    if (!selectedGateway || !booking) return;
    setPaying(true);
    try {
      const token = await getToken();
      const data = await BookingService.createGatewayPayment(booking._id, selectedGateway, token);
      if (!data.success) {
        toast.error(data.message || "Payment could not be started");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setStep(5);
    } catch {
      toast.error("Payment could not be started");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-16 px-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (loadError || !room) {
    return (
      <div className="min-h-screen bg-white pt-28">
        <ErrorState title="Room not found" description="This room may no longer be available." />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <StepIndicator step={step} />

        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src={room.images?.[0]} alt={room.roomType} className="h-20 w-28 rounded-xl object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">{room.roomType}</h2>
                  <p className="flex items-center gap-1 text-sm text-[#64748B]">
                    <MapPin className="w-3.5 h-3.5" /> {room.hotel?.name}, {room.hotel?.city}
                  </p>
                  <p className="text-sm text-[#2563EB] font-medium mt-1">{formatPrice(room.pricePerNight)} / night</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  type="date"
                  label="Check in"
                  required
                  value={dates.checkInDate}
                  onChange={(e) => setDates((p) => ({ ...p, checkInDate: e.target.value }))}
                />
                <Input
                  type="date"
                  label="Check out"
                  required
                  value={dates.checkOutDate}
                  onChange={(e) => setDates((p) => ({ ...p, checkOutDate: e.target.value }))}
                />
                <Input
                  type="number"
                  min={1}
                  max={room.maxGuests || 10}
                  label="Guests"
                  required
                  value={dates.guests}
                  onChange={(e) => setDates((p) => ({ ...p, guests: Number(e.target.value) }))}
                />
              </div>

              {pricing && nights > 0 && (
                <div className="rounded-xl bg-[#F1F5F9] p-4 text-sm flex justify-between">
                  <span className="text-[#64748B]">{nights} night{nights > 1 ? "s" : ""}</span>
                  <span className="font-semibold text-[#0F172A]">{formatPrice(pricing.totalPrice)}</span>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0F172A]">Guest Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full name" required value={guestInfo.name} onChange={(e) => setGuestInfo((p) => ({ ...p, name: e.target.value }))} />
                <Input type="email" label="Email address" required value={guestInfo.email} onChange={(e) => setGuestInfo((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <Input type="tel" label="Phone number" helper="Optional — used for check-in coordination" value={guestInfo.phone} onChange={(e) => setGuestInfo((p) => ({ ...p, phone: e.target.value }))} />
              <Textarea label="Special requests" helper="Optional" placeholder="Late check-in, high floor, dietary needs..." value={guestInfo.specialRequests} onChange={(e) => setGuestInfo((p) => ({ ...p, specialRequests: e.target.value }))} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-[#0F172A]">Review your booking</h2>
              <div className="rounded-xl bg-[#F1F5F9] p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[#64748B]">Hotel</span><span className="text-[#0F172A] font-medium">{room.hotel?.name}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Room</span><span className="text-[#0F172A]">{room.roomType}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Check-in</span><span className="text-[#0F172A]">{new Date(dates.checkInDate).toDateString()}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Check-out</span><span className="text-[#0F172A]">{new Date(dates.checkOutDate).toDateString()}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Guests</span><span className="text-[#0F172A]">{dates.guests}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Guest name</span><span className="text-[#0F172A]">{guestInfo.name}</span></div>
                {pricing && (
                  <div className="flex justify-between pt-2 border-t border-[#E2E8F0] text-base font-semibold">
                    <span className="text-[#0F172A]">Total ({nights} night{nights > 1 ? "s" : ""})</span>
                    <span className="text-[#2563EB]">{formatPrice(pricing.totalPrice)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#94A3B8]">
                Free cancellation until 24 hours before check-in. Your room is held for a limited time — complete payment to confirm.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0F172A]">Choose a payment method</h2>
              {gateways.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No payment methods available right now.</p>
              ) : (
                <div className="space-y-2.5">
                  {gateways.map((g) => {
                    const Icon = GATEWAY_ICONS[g] || CreditCard;
                    const active = selectedGateway === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGateway(g)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm transition-colors ${
                          active ? "border-[#2563EB] bg-[#2563EB]/5" : "border-[#E2E8F0] hover:border-[#2563EB]/40"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-[#0F172A] font-medium">{GATEWAY_LABELS[g] || g}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center py-6">
              <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  {selectedGateway === "pay_at_hotel" ? "Confirming your booking..." : "Redirecting to secure payment..."}
                </h2>
                <p className="text-sm text-[#64748B] mt-1">Please don't close this window.</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5 text-center py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A]">Booking confirmed!</h2>
                <p className="text-sm text-[#64748B] mt-1">
                  {selectedGateway === "pay_at_hotel" ? "Pay at the hotel during check-in." : "Your payment was received."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Link to="/my-bookings" className="gold-button px-6 py-2.5 text-sm">View My Bookings</Link>
                <Link to="/rooms" className="ghost-button px-6 py-2.5 text-sm">Browse More Rooms</Link>
              </div>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="ghost-button px-5 py-2.5 text-sm gap-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step === 0 && (
              <button type="button" onClick={handleCheckAvailability} disabled={checking} className="gold-button px-6 py-2.5 text-sm gap-1.5 disabled:opacity-60">
                {checking ? "Checking..." : "Continue"} <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={() => (guestInfo.name && guestInfo.email ? setStep(2) : toast.error("Name and email are required."))}
                className="gold-button px-6 py-2.5 text-sm gap-1.5"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button type="button" onClick={handleCreateBooking} disabled={creatingBooking} className="gold-button px-6 py-2.5 text-sm gap-1.5 disabled:opacity-60">
                {creatingBooking ? "Placing hold..." : "Continue to Payment"} <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={() => { setStep(4); handlePay(); }} disabled={!selectedGateway || paying} className="gold-button px-6 py-2.5 text-sm gap-1.5 disabled:opacity-60">
                Pay Now <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
