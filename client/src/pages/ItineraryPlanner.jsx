import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Route, Sparkles, UtensilsCrossed, CalendarDays, Hotel, Compass } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const DEFAULT_PREFERENCES = ['Sightseeing', 'Local food', 'Relaxed pace'];

const PseudoMap = ({ center, attractions = [], restaurants = [], route }) => {
  const pins = useMemo(() => {
    const combined = [
      ...attractions.slice(0, 4).map((item, index) => ({ ...item, kind: 'Attraction', hue: '#D4A85F', index })),
      ...restaurants.slice(0, 4).map((item, index) => ({ ...item, kind: 'Restaurant', hue: '#7DD3FC', index })),
    ];
    return combined;
  }, [attractions, restaurants]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#08111f] p-4 min-h-[420px]">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(212,168,95,0.16), transparent 18%), radial-gradient(circle at 80% 30%, rgba(125,211,252,0.12), transparent 20%), linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 100%), linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 100%)', backgroundSize: '100% 100%, 100% 100%, 28px 28px, 28px 28px' }} />
      <div className="relative flex h-full min-h-[392px] flex-col justify-between">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">Map layer ready</p>
            <p className="mt-1 text-sm text-white/70">Swap this panel to `mapcn-rn.dev` markers and polylines when connected.</p>
          </div>
          <Link to={center ? `/rooms?destination=${encodeURIComponent(center.name || '')}` : '/rooms'} className="text-xs text-[#F5D08A]">
            Open rooms
          </Link>
        </div>

        <div className="relative mt-6 flex-1 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
          {pins.map((pin, index) => (
            <div
              key={`${pin.name}-${index}`}
              className="absolute"
              style={{ left: `${18 + (index % 2) * 34}%`, top: `${18 + Math.floor(index / 2) * 20}%` }}
            >
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#07111f]/90 px-3 py-2 text-xs text-white shadow-lg">
                <MapPin className="h-3.5 w-3.5" style={{ color: pin.hue }} />
                <span className="max-w-[150px] truncate">{pin.name}</span>
              </div>
            </div>
          ))}
          {route && (
            <div className="absolute left-[8%] right-[8%] top-[50%] h-px bg-gradient-to-r from-transparent via-[#D4A85F] to-transparent" />
          )}
          {!pins.length && (
            <div className="flex h-full items-center justify-center text-sm text-white/40">
              Map preview will appear here once places load.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
          <span className="rounded-full bg-white/5 px-3 py-1">Attractions</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Restaurants</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Routes</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Guest itinerary</span>
        </div>
      </div>
    </div>
  );
};

const ItineraryPlanner = () => {
  const [searchParams] = useSearchParams();
  const { axios, formatPrice } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState(null);
  const destination = searchParams.get('destination') || '';
  const hotel = searchParams.get('hotel') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '2';
  const preferences = searchParams.get('preferences') || DEFAULT_PREFERENCES.join(',');

  useEffect(() => {
    document.title = destination ? `Plan ${destination} trip — SmartStayX` : 'Guest Itinerary — SmartStayX';
  }, [destination]);

  useEffect(() => {
    const load = async () => {
      if (!destination && !hotel) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data } = await axios.get('/api/itinerary/preview', {
          params: { destination, hotel, checkIn, checkOut, guests, preferences },
        });
        if (data.success) {
          setItinerary(data.itinerary);
        } else {
          toast.error(data.message || 'Failed to load itinerary');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [axios, destination, hotel, checkIn, checkOut, guests, preferences]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] pt-24">
        <div className="mx-auto max-w-7xl px-4 py-8 text-white/50">Loading itinerary...</div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#07111f] pt-24">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="luxury-card p-8 text-center">
            <p className="font-playfair text-3xl text-white">No itinerary context yet</p>
            <p className="mt-2 text-white/60">Open a room or destination with `destination` and `hotel` query params.</p>
            <Link to="/rooms" className="gold-button mt-6 inline-flex px-6 py-3 text-sm">Browse rooms</Link>
          </div>
        </div>
      </div>
    );
  }

  const dailyPlan = itinerary.aiPlan?.dailyPlan || [];
  const hotelOptions = itinerary.aiPlan?.hotelOptions || [];
  const tips = itinerary.aiPlan?.tips || ['Start early, keep one flexible block each day, and reserve dinner near the hotel.'];

  return (
    <div className="min-h-screen bg-[#07111f] pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="luxury-kicker">Guest Itinerary</p>
            <h1 className="mt-2 font-playfair text-4xl text-white">
              {itinerary.destination || destination || hotel}
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {itinerary.aiPlan?.dateRange || (checkIn && checkOut ? `${checkIn} to ${checkOut}` : 'Flexible dates')}
            </p>
          </div>
          <Link to={hotel ? `/rooms?destination=${encodeURIComponent(destination || hotel)}` : '/rooms'} className="ghost-button px-5 py-3 text-sm">
            Back to rooms
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <PseudoMap center={itinerary.mapCenter ? { name: itinerary.destination } : null} attractions={itinerary.attractions} restaurants={itinerary.restaurants} route={itinerary.route} />

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Attractions', value: itinerary.attractions.length, icon: Compass },
                { label: 'Restaurants', value: itinerary.restaurants.length, icon: UtensilsCrossed },
                { label: 'Trip cost', value: itinerary.aiPlan?.totalEstimatedCost ? formatPrice(itinerary.aiPlan.totalEstimatedCost) : 'Flexible', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="luxury-card p-5">
                    <Icon className="h-5 w-5 text-[#D4A85F]" />
                    <p className="mt-3 text-sm text-white/55">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="luxury-card p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45">
                <CalendarDays className="h-4 w-4" /> Day by day
              </div>
              <div className="mt-5 space-y-4">
                {dailyPlan.length > 0 ? dailyPlan.map((day, index) => (
                  <div key={`${day.day}-${day.time}-${index}`} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                      <span className="rounded-full bg-white/10 px-2.5 py-1">Day {day.day}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1">{day.time}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1">{day.category}</span>
                    </div>
                    <p className="mt-3 text-lg text-white">{day.title}</p>
                    <p className="mt-1 text-sm text-white/60">{day.description}</p>
                    {day.estimatedCost ? <p className="mt-2 text-xs text-[#F5D08A]">Estimated cost: {formatPrice(day.estimatedCost)}</p> : null}
                  </div>
                )) : (
                  <p className="text-sm text-white/50">The planner did not return daily activities, so use the map and place suggestions below.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="luxury-card p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45">
                <Hotel className="h-4 w-4" /> Hotels
              </div>
              <div className="mt-4 space-y-3">
                {hotelOptions.length > 0 ? hotelOptions.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white">{item.name}</p>
                      <span className="text-[#F5D08A]">{formatPrice(item.pricePerNight)}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{item.reason}</p>
                  </div>
                )) : (
                  <p className="text-sm text-white/50">No hotel options returned yet.</p>
                )}
              </div>
            </div>

            <div className="luxury-card p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-white/45">
                <Route className="h-4 w-4" /> Nearby places
              </div>
              <div className="mt-4 space-y-3">
                {[...(itinerary.attractions || []).slice(0, 4), ...(itinerary.restaurants || []).slice(0, 4)].map((item) => (
                  <div key={item.placeId || item.name} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-white/50">{item.address || 'Nearby place'}</p>
                    {item.rating ? <p className="mt-1 text-xs text-[#F5D08A]">Rating {item.rating}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-white/45">Travel tips</p>
              <ul className="mt-4 space-y-2 text-sm text-white/65">
                {tips.slice(0, 5).map((tip, index) => (
                  <li key={index} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">{tip}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ItineraryPlanner;
