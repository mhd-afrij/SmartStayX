import { useEffect, useState } from "react";
import { assets, facilityIcons, roomCommonData } from "../assets/assets";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import StarRating from "../components/StarRating";

const RoomDetails = () => {
  const { id } = useParams();
  const { axios, getToken, user, navigate, formatPrice } = useAppContext();
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
        console.error("Room fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoom();
    }
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
    } catch (error) {
      localStorage.removeItem("bookingDraft");
    }
  }, [room?._id]);

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
          localStorage.setItem(
            "bookingDraft",
            JSON.stringify({
              roomId: room._id,
              checkInDate,
              checkOutDate,
              guests: Number(guests),
              isAvailable: true,
            })
          );
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

        const payload = {
          room: room._id,
          checkInDate,
          checkOutDate,
          guests: Number(guests),
        };

        const { data } = await axios.post("/api/bookings/book", payload, {
          headers: { Authorization: `Bearer ${await getToken()}` },
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

  if (loading) {
    return <div className="py-28 px-4 md:px-16 lg:px-24 xl:px-32 text-center">Loading room details...</div>;
  }

  if (!room) {
    return <div className="py-28 px-4 md:px-16 lg:px-24 xl:px-32 text-center text-red-500">Room not found</div>;
  }

  const galleryImages = room.images?.filter(Boolean) || [];
  const secondaryImages = (() => {
    const rest = galleryImages.filter((img) => img !== mainImage);
    if (rest.length >= 2) return rest.slice(0, 2);
    if (!mainImage) return rest;
    return [...rest, ...Array(2 - rest.length).fill(mainImage)];
  })();

  return (
    <div className="pt-24 pb-16 bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Home</span>
          <span>/</span>
          <span>Rooms</span>
          <span>/</span>
          <span className="text-slate-700">{room.hotel?.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="space-y-8 lg:col-span-8 min-w-0">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Room</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-playfair text-slate-900">
                  {room.hotel?.name}
                </h1>
                <span className="text-xs uppercase tracking-widest font-semibold text-slate-600 border border-slate-200 px-3 py-1 rounded-full">
                  {room.roomType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <StarRating />
                <span>200+ reviews</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <img src={assets.locationIcon} alt="location-icon" className="w-4 h-4" />
                <span>{room.hotel?.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => mainImage && setMainImage(mainImage)}
                className="lg:col-span-2 rounded-3xl overflow-hidden bg-slate-100 aspect-[16/9] max-h-[360px]"
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt="Room"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                    No image
                  </div>
                )}
              </button>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {secondaryImages.map((image, index) => (
                  <button
                    type="button"
                    onClick={() => setMainImage(image)}
                    key={`${image}-${index}`}
                    className={`overflow-hidden rounded-2xl border transition aspect-[16/9] ${
                      mainImage === image ? "border-slate-900" : "border-transparent"
                    }`}
                  >
                    <img
                      src={image}
                      alt="Room Image"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-playfair text-slate-900">
                Experience understated luxury
              </h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-slate-200"
                  >
                    <img src={facilityIcons[item]} alt={item} className="w-4 h-4" />
                    <p className="text-xs text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              {roomCommonData.map((spec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                    <img src={spec.icon} alt={`${spec.title}-icon`} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base text-slate-900 font-medium">{spec.title}</p>
                    <p className="text-sm text-slate-500">{spec.description}</p>
                  </div>
                </div>
              ))}
            </section>

            <div className="border-y border-slate-200 py-8 text-slate-600">
              <p>
                Guests will be allocated on the ground floor according to availability. You get a comfortable two bedroom
                apartment with a true city feeling. The price quoted is for two guests; please mark the number of guests to
                get the exact price for groups.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <img
                  src={room.hotel?.owner?.image}
                  alt="Host"
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg text-slate-900">Hosted by {room.hotel?.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                    <StarRating />
                    <span>200+ reviews</span>
                  </div>
                </div>
              </div>
              <button className="mt-6 px-6 py-2.5 rounded-full text-white bg-slate-900 hover:bg-slate-800 transition-all">
                Contact now
              </button>
            </div>
          </div>

          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Price</p>
                  <p className="text-3xl font-semibold text-slate-900">{formatPrice(room.pricePerNight)}</p>
                </div>
                <span className="text-sm text-slate-500">per night</span>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleAvailabilitySubmit}>
                <div>
                  <label htmlFor="checkInDate" className="text-sm font-medium text-slate-700">
                    Check in
                  </label>
                  <input
                    type="date"
                    id="checkInDate"
                    placeholder="Check-in"
                    value={formValues.checkInDate}
                    onChange={(event) => updateField("checkInDate", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 mt-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkOutDate" className="text-sm font-medium text-slate-700">
                    Check out
                  </label>
                  <input
                    type="date"
                    id="checkOutDate"
                    placeholder="Check-out"
                    value={formValues.checkOutDate}
                    onChange={(event) => updateField("checkOutDate", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 mt-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="guests" className="text-sm font-medium text-slate-700">
                    Guests
                  </label>
                  <input
                    type="number"
                    id="guests"
                    placeholder="0"
                    value={formValues.guests}
                    min={1}
                    onChange={(event) => updateField("guests", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 mt-2 outline-none focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 transition-all text-white rounded-2xl py-3 text-base disabled:opacity-70"
                >
                  {isAvailable ? "Book now" : "Check availability"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              <p className="font-medium text-slate-800">What you will love</p>
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
