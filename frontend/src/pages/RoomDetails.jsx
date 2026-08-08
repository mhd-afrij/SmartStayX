// RoomDetails — Detailed room view with gallery, facilities, reviews, and booking flow
import { useEffect, useState, useRef, useMemo } from "react";
import { roomCommonData } from "../assets/assets";
import { useParams, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Coffee,
  ConciergeBell,
  MapPin,
  Phone,
  Sofa,
  Sparkles,
  Star,
  Tv2,
  Wifi,
  Waves,
  Wine,
  ShieldCheck,
  Mountain,
  Heart,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import ReviewSection from "../components/ReviewSection";

const amenityIconsMap = {
  "King Bed": BedDouble,
  "Ocean View": Waves,
  "Living Room": Sofa,
  Jacuzzi: Bath,
  AC: Sparkles,
  "Mini Bar": Wine,
  WiFi: Wifi,
  "Free Wifi": Wifi,
  "Free WiFi": Wifi,
  "Free Breakfast": Coffee,
  "Room Service": ConciergeBell,
  "Mountain View": Mountain,
  "Pool Access": Waves,
  TV: Tv2,
  Balcony: Building2,
};

const roomFactIconsMap = {
  "Clean & Safe Stay": ShieldCheck,
  "Enhanced Cleaning": Sparkles,
  "Excellent Location": MapPin,
  "Smooth Check-In": CheckCircle2,
};

const getAmenityIcon = (label) => amenityIconsMap[label] || amenityIconsMap[label?.replace(/\s+/g, " ")?.trim()] || Sparkles;

const getRoomFactIcon = (label) => roomFactIconsMap[label] || ShieldCheck;

const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const getCallouts = (pricing) => {
  if (!pricing) return [];
  const calls = [];
  const mult = pricing.priceMultiplier;
  if (mult > 1) {
    const pct = Math.round((mult - 1) * 100);
    if (pct > 0) calls.push({ type: "surcharge", text: `${pct}% surcharge applied (weekend/seasonal)` });
  }
  if (pricing.basePricePerNight > pricing.dynamicPricePerNight && !pricing.offerDiscountPercent) {
    const saved = pricing.basePricePerNight - pricing.dynamicPricePerNight;
    const pct = Math.round((saved / pricing.basePricePerNight) * 100);
    if (pct > 0) calls.push({ type: "saving", text: `Save ${pct}% with long-stay / last-minute discount` });
  }
  if (pricing.offerDiscountPercent > 0) {
    calls.push({ type: "offer", text: `${pricing.offerDiscountPercent}% OFF offer applied` });
  }
  return calls;
};

const Skeleton = () => (
  <div className="pt-24 min-h-screen bg-white">
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 lg:px-10 py-8 animate-pulse">
      <div className="h-4 w-48 rounded bg-[#f4f2ef] mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-8 w-64 rounded bg-[#f4f2ef]" />
          <div className="aspect-[16/9] rounded-[2rem] bg-[#f4f2ef]" />
          <div className="h-24 w-full rounded-2xl bg-[#f4f2ef]" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-96 rounded-[2rem] bg-[#f4f2ef]" />
        </div>
      </div>
    </div>
  </div>
);

const RoomDetails = () => {
  const { id } = useParams();
  const { axios, getToken, user, navigate, formatPrice, offers } = useAppContext();
  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
  });
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePreview, setPricePreview] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const priceTimer = useRef(null);

  const roomOffers = useMemo(() => {
    if (!room?._id || !offers?.length) return [];
    return offers
      .filter((o) => o.room?._id === room._id || o.room === room._id)
      .sort((a, b) => b.discountPercent - a.discountPercent);
  }, [room, offers]);

  useEffect(() => {
    if (roomOffers.length > 0 && !selectedOfferId) {
      setSelectedOfferId(roomOffers[0]._id);
    }
  }, [roomOffers, selectedOfferId]);

  useEffect(() => {
    document.title = room?.hotel?.name
      ? `${room.hotel.name} — SmartStayX`
      : "Room Details — SmartStayX";
  }, [room]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/rooms/${id}`);
        if (data.success) {
          setRoom(data.room);
          setMainImage(data.room.images?.[0] || null);
        } else {
          toast.error(data.message || "Failed to load room");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error loading room details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRoom();
  }, [id, axios]);

  useEffect(() => {
    if (!room?._id) return;
    const saved = localStorage.getItem("bookingDraft");
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.roomId === room._id) {
        setFormValues({
          checkInDate: draft.checkInDate || "",
          checkOutDate: draft.checkOutDate || "",
          guests: draft.guests || 1,
        });
        setAvailabilityChecked(Boolean(draft.isAvailable));
        setIsAvailable(Boolean(draft.isAvailable));
      }
    } catch {
      localStorage.removeItem("bookingDraft");
    }
  }, [room?._id]);

  useEffect(() => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    const { checkInDate, checkOutDate } = formValues;
    if (!checkInDate || !checkOutDate || !room?._id) {
      setPricePreview(null);
      return;
    }
    const nights = calcNights(checkInDate, checkOutDate);
    if (nights < 1) { setPricePreview(null); return; }
    setPriceLoading(true);
    priceTimer.current = setTimeout(async () => {
      try {
        const payload = {
          roomId: room._id,
          checkInDate,
          checkOutDate,
          guests: formValues.guests,
        };
        if (selectedOfferId) payload.offerId = selectedOfferId;
        const { data } = await axios.post("/api/bookings/calculate-price", payload);
        if (data.success) setPricePreview(data.pricing);
      } catch {
        setPricePreview(null);
      } finally {
        setPriceLoading(false);
      }
    }, 400);
  }, [formValues.checkInDate, formValues.checkOutDate, formValues.guests, room?._id, selectedOfferId, axios]);

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setAvailabilityChecked(false);
    setIsAvailable(false);
  };

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault();
    if (!room?._id) return;

    const { checkInDate, checkOutDate, guests } = formValues;
    if (!checkInDate || !checkOutDate || !guests) {
      toast.error("Please fill in check-in, check-out, and guests.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!availabilityChecked || !isAvailable) {
        const { data } = await axios.post("/api/bookings/check-availability", {
          room: room._id,
          checkInDate,
          checkOutDate,
        });

        if (data.success && data.isAvailable) {
          setAvailabilityChecked(true);
          setIsAvailable(true);
          localStorage.setItem("bookingDraft", JSON.stringify({
            roomId: room._id,
            checkInDate,
            checkOutDate,
            guests: Number(guests),
            isAvailable: true,
          }));
          toast.success("Room is available. You can book now.");
        } else {
          setAvailabilityChecked(true);
          setIsAvailable(false);
          toast.error("Room is not available for these dates.");
        }
      } else {
        if (!user) {
          toast.error("Please login to book this room.");
          return;
        }
        const token = await getToken();
        if (!token) {
          toast.error("Session expired. Please login again.");
          return;
        }
        const payload = { room: room._id, checkInDate, checkOutDate, guests: Number(guests) };
        if (selectedOfferId) payload.offerId = selectedOfferId;
        const { data } = await axios.post("/api/bookings/book", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          toast.success("Booking created successfully.");
          localStorage.removeItem("bookingDraft");
          navigate("/my-bookings");
        } else {
          toast.error(data.message || "Failed to create booking.");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Skeleton />;

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="font-playfair text-2xl text-slate-900 mb-2">Room not found</p>
          <Link to="/rooms" className="gold-button inline-flex px-6 py-3 text-sm">Browse rooms</Link>
        </div>
      </div>
    );
  }

  const galleryImages = room.images?.filter(Boolean) || [];
  const secondaryImages = (() => {
    const rest = galleryImages.filter((img) => img !== mainImage);
    if (rest.length >= 2) return rest.slice(0, 2);
    if (!mainImage) return rest;
    return [...rest, ...Array(2 - rest.length).fill(mainImage)];
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-40" />

      <div className="relative mx-auto max-w-[1200px] px-4 md:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#2563EB] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/rooms" className="hover:text-[#2563EB] transition-colors">Rooms</Link>
          <span>/</span>
          <span className="text-slate-600">{room.hotel?.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="space-y-8 lg:col-span-8 min-w-0">
            <div className="space-y-3">
              <p className="luxury-kicker">Room</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-playfair text-slate-900">
                  {room.hotel?.name}
                </h1>
                <span className="text-xs uppercase tracking-widest font-semibold text-[#2563EB] border border-[#2563EB]/30 px-3 py-1 rounded-full">
                  {room.roomType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Star className="w-4 h-4 text-[#2563EB] fill-[#2563EB]" />
                <span>200+ reviews</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-600" />
                <span>{room.hotel?.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 rounded-[2rem] overflow-hidden bg-[#f4f2ef] aspect-[16/9] max-h-[360px] border border-black/[0.06]">
                {mainImage ? (
                  <img src={mainImage} alt="Room" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">No image</div>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {secondaryImages.map((image, index) => (
                  <button
                    type="button"
                    onClick={() => setMainImage(image)}
                    key={`${image}-${index}`}
                    className={`overflow-hidden rounded-2xl border transition aspect-[16/9] ${
                      mainImage === image ? "border-[#2563EB]" : "border-black/[0.06]"
                    }`}
                  >
                    <img src={image} alt="Room Image" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-playfair text-slate-900">Experience understated luxury</h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities?.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#f4f2ef] border border-black/[0.06]">
                    {(() => {
                      const AmenityIcon = getAmenityIcon(item);
                      return <AmenityIcon className="w-4 h-4 text-slate-500" />;
                    })()}
                    <p className="text-xs text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              {roomCommonData.map((spec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#f4f2ef] border border-black/[0.06] flex items-center justify-center">
                    {(() => {
                      const FactIcon = getRoomFactIcon(spec.title);
                      return <FactIcon className="w-5 h-5 text-slate-500" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-base text-slate-900 font-medium">{spec.title}</p>
                    <p className="text-sm text-slate-500">{spec.description}</p>
                  </div>
                </div>
              ))}
            </section>

            <div className="border-y border-black/[0.06] py-8 text-slate-600">
              <p>Guests will be allocated on the ground floor according to availability. You get a comfortable two bedroom apartment with a true city feeling. The price quoted is for two guests; please mark the number of guests to get the exact price for groups.</p>
            </div>

            <div className="luxury-card overflow-hidden p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <img
                  src={room.hotel?.owner?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.hotel?.name || "H")}&background=f4f2ef&color=B8862F&size=56`}
                  alt="Host"
                  className="h-14 w-14 rounded-full object-cover border border-black/[0.06]"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(room.hotel?.name || "H")}&background=f4f2ef&color=B8862F&size=56`; }}
                />
                <div>
                  <p className="text-lg text-slate-900">Hosted by {room.hotel?.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                    <Star className="w-4 h-4 text-[#2563EB] fill-[#2563EB]" />
                    <span>200+ reviews</span>
                  </div>
                  {room.hotel?.address && (
                    <p className="text-xs text-slate-400 mt-1">{room.hotel.address}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowContact(!showContact)}
                className="mt-6 ghost-button px-6 py-2.5 text-sm"
              >
                {showContact ? "Hide contact" : "Contact now"}
              </button>

              {showContact && (
                <div className="mt-4 pt-4 border-t border-black/[0.06] space-y-2 text-sm">
                  {room.hotel?.contact ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <a href={`tel:${room.hotel.contact}`} className="hover:text-[#2563EB] transition-colors">{room.hotel.contact}</a>
                    </div>
                  ) : (
                    <p className="text-slate-400">No contact information available.</p>
                  )}
                  {room.hotel?.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <span>{room.hotel?.address}</span>
                    </div>
                  )}
                </div>
              )}

              <Link
                to={`/rooms?destination=${encodeURIComponent(room.hotel?.city || room.hotel?.address || '')}`}
                className="mt-4 ghost-button px-6 py-2.5 text-sm w-full text-center block"
              >
                Browse all rooms in {room.hotel?.city || "this area"}
              </Link>

            </div>

            <ReviewSection roomId={id} />
          </div>

          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="luxury-card overflow-hidden p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="luxury-kicker">{pricePreview ? "Dynamic price" : "Base price"}</p>
                  <p className="text-3xl font-semibold text-slate-900">
                    {pricePreview ? formatPrice(pricePreview.dynamicPricePerNight) : formatPrice(room.pricePerNight)}
                  </p>
                </div>
                <span className="text-sm text-slate-500">per night</span>
              </div>

              {pricePreview && (
                <div className="mt-4 space-y-2 text-xs text-slate-600 bg-[#f4f2ef] rounded-2xl p-4 border border-black/[0.06]">
                  <div className="flex justify-between">
                    <span>Base rate</span>
                    <span className="text-slate-900">{formatPrice(pricePreview.basePricePerNight)} / night</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multiplier</span>
                    <span className="text-slate-900">{pricePreview.priceMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between font-medium text-[#2563EB] border-t border-black/[0.06] pt-2 mt-2">
                    <span>{pricePreview.nights} {pricePreview.nights > 1 ? "nights" : "night"} total</span>
                    <span>{formatPrice(pricePreview.totalPrice)}</span>
                  </div>
                </div>
              )}

              {priceLoading && (
                <div className="mt-2 text-xs text-slate-400 animate-pulse text-center">Calculating price...</div>
              )}

              {pricePreview && pricePreview.offerDiscountPercent > 0 && (
                <div className="mt-3 rounded-2xl bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center gap-2 text-green-700 text-xs font-medium mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    Offer Applied
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Original price</span>
                      <span className="text-slate-500 line-through">{formatPrice(pricePreview.originalPricePerNight)} / night</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="text-green-700">-{pricePreview.offerDiscountPercent}%</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-700 border-t border-green-200 pt-1 mt-1">
                      <span>Discounted price</span>
                      <span>{formatPrice(pricePreview.dynamicPricePerNight)} / night</span>
                    </div>
                  </div>
                </div>
              )}

              {pricePreview && getCallouts(pricePreview).length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {getCallouts(pricePreview).map((c, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
                      c.type === "saving"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : c.type === "offer"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {roomOffers.length > 0 && !pricePreview?.offerDiscountPercent && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    Available Offers
                  </p>
                  {roomOffers.map((offer) => (
                    <button
                      key={offer._id}
                      type="button"
                      onClick={() => setSelectedOfferId(selectedOfferId === offer._id ? null : offer._id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${
                        selectedOfferId === offer._id
                          ? "border-green-300 bg-green-50"
                          : "border-black/[0.06] bg-[#f4f2ef] hover:bg-black/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{offer.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{offer.description}</p>
                        </div>
                        <span className="text-sm font-bold text-green-700 shrink-0 ml-3">-{offer.discountPercent}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Link
                to={`/booking/${room._id}`}
                className="gold-button mt-6 w-full py-3 text-sm uppercase tracking-[0.18em]"
              >
                Book This Room
              </Link>
              <p className="mt-2 text-center text-[11px] text-slate-400">Guided step-by-step booking with review &amp; secure payment</p>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-black/[0.06]" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">or quick book</span>
                <div className="h-px flex-1 bg-black/[0.06]" />
              </div>

              <form className="space-y-4" onSubmit={handleAvailabilitySubmit}>
                <div>
                  <label htmlFor="checkInDate" className="text-sm font-medium text-slate-700">Check in</label>
                  <input
                    type="date"
                    id="checkInDate"
                    value={formValues.checkInDate}
                    onChange={(e) => updateField("checkInDate", e.target.value)}
                    className="luxury-input mt-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="checkOutDate" className="text-sm font-medium text-slate-700">Check out</label>
                  <input
                    type="date"
                    id="checkOutDate"
                    value={formValues.checkOutDate}
                    onChange={(e) => updateField("checkOutDate", e.target.value)}
                    className="luxury-input mt-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="guests" className="text-sm font-medium text-slate-700">Guests</label>
                  <input
                    type="number"
                    id="guests"
                    value={formValues.guests}
                    min={1}
                    onChange={(e) => updateField("guests", e.target.value)}
                    className="luxury-input mt-2"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-button w-full py-3 text-sm uppercase tracking-[0.18em] disabled:opacity-70"
                >
                  {isAvailable ? "Book now" : "Check availability"}
                </button>
              </form>
            </div>

            <div className="luxury-card-soft p-5 text-sm text-slate-600">
              <p className="font-medium text-slate-900">What you will love</p>
              <ul className="mt-3 space-y-2">
                <li>Instant confirmation on select dates</li>
                <li>Flexible check-in windows</li>
                <li>Concierge support during your stay</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
