// AllRooms — Browse all available rooms with value scoring, filtering, sorting, and pagination
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { cities } from "../assets/assets";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import BestValueBadge from "../components/BestValueBadge";

const ITEMS_PER_PAGE = 8;

const Checkbox = ({ label, selected = false, onChange = () => {} }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input
      type="checkbox"
      checked={selected}
      onChange={(e) => onChange(e.target.checked, label)}
      className="h-4 w-4 rounded border-black/[0.1] bg-white text-[#2563EB] focus:ring-[#2563EB]/30 focus:ring-2 accent-[#2563EB]"
    />
    <span className={`text-sm font-medium select-none transition-colors ${selected ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</span>
  </label>
);

const formatSearchDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const SkeletonCard = () => (
  <div className="luxury-card overflow-hidden animate-pulse">
    <div className="h-44 bg-[#f4f2ef]" />
    <div className="p-5 space-y-3">
      <div className="h-5 w-3/4 rounded bg-[#f4f2ef]" />
      <div className="h-3 w-1/2 rounded bg-[#f4f2ef]" />
      <div className="h-3 w-2/3 rounded bg-[#f4f2ef]" />
      <div className="flex gap-1.5 mt-4">
        <div className="h-5 w-16 rounded-full bg-[#f4f2ef]" />
        <div className="h-5 w-16 rounded-full bg-[#f4f2ef]" />
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-black/[0.06]">
        <div className="h-5 w-20 rounded bg-[#f4f2ef]" />
        <div className="h-9 w-16 rounded bg-[#f4f2ef]" />
      </div>
    </div>
  </div>
);

const StarRating = ({ rating }) => {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'text-[#2563EB] fill-[#2563EB]' : 'text-slate-300'}`} />
      ))}
    </div>
  );
};

const AllRooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const formatPrice = (v) => `$${v}`;

  useEffect(() => {
    document.title = searchParams.get("destination")
      ? `Stays in ${searchParams.get("destination")} — SmartStayX`
      : "Find Your Next Stay — SmartStayX";
  }, [searchParams]);

  useEffect(() => {
    const fetchRooms = async () => {
      setPageLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        const dest = searchParams.get("destination");
        if (dest) params.set("city", dest);
        const res = await fetch(`/api/guest/best-value?${params.toString()}`);
        const data = await res.json();
        if (data.success) setRooms(data.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setPageLoading(false);
      }
    };
    fetchRooms();
  }, [searchParams]);

  const [openFilter, setOpenFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    roomType: [],
    priceRange: [],
    rating: [],
  });
  const [selectedSort, setSelectedSort] = useState("");

  const roomTypes = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];

  const priceRanges = useMemo(() => [
    { label: "Under $100", display: "Under $100", min: 0, max: 100 },
    { label: "$100 – $300", display: "$100 – $300", min: 100, max: 300 },
    { label: "$300 – $500", display: "$300 – $500", min: 300, max: 500 },
    { label: "$500 – $1,000", display: "$500 – $1,000", min: 500, max: 1000 },
    { label: "$1,000+", display: "$1,000+", min: 1000, max: Infinity },
  ], []);

  const ratingOptions = ["3+ stars", "4+ stars", "5 stars"];
  const sortOptions = ["Best Value", "Price: Low to High", "Price: High to Low", "Newest First", "Highest Rated"];

  const handleFilterChange = (checked, value, type) => {
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[type] = [...updated[type], value];
      } else {
        updated[type] = updated[type].filter((item) => item !== value);
      }
      return updated;
    });
  };

  const matchRoomType = (room) => {
    if (selectedFilters.roomType.length === 0) return true;
    return selectedFilters.roomType.includes(room.roomType);
  };

  const matchesPriceRange = (room) => {
    if (selectedFilters.priceRange.length === 0) return true;
    return selectedFilters.priceRange.some((range) => {
      const match = priceRanges.find((r) => r.display === range);
      if (!match) return false;
      return room.pricePerNight >= match.min && room.pricePerNight <= match.max;
    });
  };

  const matchesRating = (room) => {
    if (selectedFilters.rating.length === 0) return true;
    const rating = room.avgRating || 0;
    return selectedFilters.rating.some((filter) => {
      const minStars = parseInt(filter, 10);
      return rating >= minStars;
    });
  };

  const filterDestination = (room) => {
    const destination = searchParams.get("destination");
    if (!destination) return true;
    const city = (room.hotelCity || room.hotel?.city || '').toLowerCase();
    return city.includes(destination.toLowerCase());
  };

  const handleSortChange = (sortOption) => setSelectedSort(sortOption);

  const sortRooms = (a, b) => {
    if (selectedSort === "Price: Low to High") return a.pricePerNight - b.pricePerNight;
    if (selectedSort === "Price: High to Low") return b.pricePerNight - a.pricePerNight;
    if (selectedSort === "Newest First") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (selectedSort === "Highest Rated") return (b.avgRating || 0) - (a.avgRating || 0);
    if (selectedSort === "Best Value") return (b.valueScore || 0) - (a.valueScore || 0);
    return 0;
  };

  const searchDestination = searchParams.get("destination");
  const searchCheckIn = searchParams.get("checkIn");
  const searchCheckOut = searchParams.get("checkOut");

  const allFiltered = useMemo(() => {
    return rooms.filter((room) =>
      matchRoomType(room) && matchesPriceRange(room) && matchesRating(room) && filterDestination(room)
    ).sort(sortRooms);
  }, [rooms, selectedFilters, selectedSort, matchRoomType, matchesPriceRange, matchesRating, filterDestination, sortRooms]);

  const filteredRooms = allFiltered.slice(0, visibleCount);
  const hasMore = allFiltered.length > visibleCount;

  const activeFilters = [...selectedFilters.roomType, ...selectedFilters.priceRange, ...selectedFilters.rating];

  const clearFilters = () => {
    setSelectedFilters({ roomType: [], priceRange: [], rating: [] });
    setSelectedSort("");
    setSearchParams({});
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const removeFilter = (value) => {
    setSelectedFilters((prev) => ({
      roomType: prev.roomType.filter((item) => item !== value),
      priceRange: prev.priceRange.filter((item) => item !== value),
      rating: prev.rating.filter((item) => item !== value),
    }));
  };

  const filteredCount = allFiltered.length;

  return (
    <div className="pt-20 min-h-screen bg-white">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="luxury-kicker">Rooms</p>
            <h1 className="text-3xl md:text-4xl font-playfair text-slate-900 mt-1">
              {searchDestination
                ? `Stays in ${searchDestination}`
                : "Find your next stay"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {pageLoading ? 'Loading rooms...' : `Showing ${Math.min(visibleCount, filteredCount)} of ${filteredCount} rooms`}
            </p>
            <AnimatePresence>
              {(searchCheckIn || searchCheckOut) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600"
                >
                  {searchCheckIn && (
                    <span className="luxury-card-soft px-3 py-2">
                      Check-in: {formatSearchDate(searchCheckIn)}
                    </span>
                  )}
                  {searchCheckOut && (
                    <span className="luxury-card-soft px-3 py-2">
                      Check-out: {formatSearchDate(searchCheckOut)}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={searchDestination || ""}
              onChange={(e) => {
                const val = e.target.value;
                const params = new URLSearchParams(searchParams);
                if (val) { params.set("destination", val); } else { params.delete("destination"); }
                setSearchParams(params);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className="luxury-select text-sm min-w-[8rem]"
            >
              <option value="" className="bg-white">All destinations</option>
              {cities.map((city) => (
                <option key={city} value={city} className="bg-white">{city}</option>
              ))}
            </select>

            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="luxury-select text-sm min-w-[10rem]"
            >
              <option value="" className="bg-white">Sort: Recommended</option>
              {sortOptions.map((option) => (
                <option key={option} value={option} className="bg-white">{option}</option>
              ))}
            </select>
            <button onClick={clearFilters} className="ghost-button px-4 py-2.5 text-sm">Reset</button>

            <button
              onClick={() => setOpenFilter(!openFilter)}
              className="lg:hidden ghost-button px-4 py-2.5 text-sm"
            >
              Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <AnimatePresence>
            {openFilter && (
              <motion.aside
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden col-span-full overflow-hidden"
              >
                <div className="luxury-card p-5 space-y-5 mb-4">
                  <FilterContent
                    roomTypes={roomTypes}
                    selectedFilters={selectedFilters}
                    handleFilterChange={handleFilterChange}
                    priceRanges={priceRanges}
                    ratingOptions={ratingOptions}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <aside className="hidden lg:block space-y-4 lg:col-span-3">
            <div className="luxury-card p-5 space-y-5">
              <FilterContent
                roomTypes={roomTypes}
                selectedFilters={selectedFilters}
                handleFilterChange={handleFilterChange}
                priceRanges={priceRanges}
                ratingOptions={ratingOptions}
              />
            </div>
          </aside>

          <main className="space-y-4 min-w-0 lg:col-span-9">
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => removeFilter(filter)}
                    className="luxury-card-soft flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600"
                  >
                    {filter}
                    <span className="text-slate-400 hover:text-slate-900 transition-colors">✕</span>
                  </button>
                ))}
              </div>
            )}

            {pageLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!pageLoading && filteredRooms.length === 0 && (
              <div className="luxury-card p-10 text-center">
                <h3 className="font-playfair text-xl text-slate-900 mb-2">No rooms found</h3>
                <p className="text-slate-500 mb-5">Try adjusting your filters or destination.</p>
                <button onClick={clearFilters} className="gold-button px-6 py-2.5 text-sm">Clear filters</button>
              </div>
            )}

            {!pageLoading && filteredRooms.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredRooms.map((room, index) => (
                    <motion.article
                      key={room._id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.04 }}
                      className="luxury-card overflow-hidden transition flex flex-col group"
                    >
                      <Link
                        to={`/rooms/${room._id}`}
                        className="relative h-44 overflow-hidden block"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        {room.images?.[0] ? (
                          <img
                            src={room.images[0]}
                            alt={room.hotel?.name || "room"}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400 bg-[#f4f2ef]">
                            No image
                          </div>
                        )}
                        <div className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl px-3 py-1 text-xs font-semibold text-white">
                          {formatPrice(room.pricePerNight)} / night
                        </div>
                        <div className="absolute top-3 right-3">
                          <BestValueBadge score={room.valueScore} savingsPercent={room.savingsPercent} />
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex-1">
                          <Link
                            to={`/rooms/${room._id}`}
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="font-playfair text-lg text-slate-900 hover:text-[#2563EB] transition-colors"
                          >
                            {room.hotel?.name || "Luxury Hotel"}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={room.avgRating || 4} />
                            <span className="text-xs text-slate-400">{(room.avgRating || 4).toFixed(1)}</span>
                            {room.reviewCount > 0 && (
                              <span className="text-xs text-slate-400">({room.reviewCount} reviews)</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{room.roomType || "Signature room"}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {room.hotel?.city || room.hotel?.address || "Prime location"}
                            {room.capacity ? ` · Up to ${room.capacity} guests` : ''}
                          </p>
                        </div>

                        {room.recommendationReasons && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {room.recommendationReasons.slice(0, 2).map((reason, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-[#fbf2e1] text-[#2563EB] text-[10px]">
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {room.amenities?.slice(0, 2).map((amenity) => (
                            <span key={amenity} className="px-2.5 py-1 rounded-full border border-black/[0.06] bg-[#f4f2ef] text-slate-600 text-[0.7rem]">
                              {amenity}
                            </span>
                          ))}
                          {room.amenities?.length > 2 && (
                            <span className="px-2.5 py-1 rounded-full border border-black/[0.06] bg-[#f4f2ef] text-slate-600 text-[0.7rem]">
                              +{room.amenities.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-black/[0.06]">
                          <div>
                            <span className="text-sm text-slate-400">Value Score</span>
                            <span className="text-lg font-bold text-slate-900 ml-1">{room.valueScore}</span>
                            <span className="text-xs text-slate-400">/100</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-semibold text-slate-900">{formatPrice(room.pricePerNight)}</span>
                            <span className="text-sm text-slate-400 ml-1">/ night</span>
                          </div>
                        </div>
                        <Link
                          to={`/rooms/${room._id}`}
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="gold-button mt-3 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-center block"
                        >
                          View
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                      className="ghost-button px-8 py-3 text-sm uppercase tracking-[0.18em]"
                    >
                      Show {Math.min(ITEMS_PER_PAGE, allFiltered.length - visibleCount)} more rooms
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const FilterContent = ({ roomTypes, selectedFilters, handleFilterChange, priceRanges, ratingOptions }) => (
  <>
    <div>
      <label className="block text-xs font-space uppercase tracking-[0.2em] text-slate-500 mb-3">Room Type</label>
      <div className="space-y-2">
        {roomTypes.map((room, index) => (
          <Checkbox
            key={index}
            label={room}
            selected={selectedFilters.roomType.includes(room)}
            onChange={(checked) => handleFilterChange(checked, room, "roomType")}
          />
        ))}
      </div>
    </div>

    <div className="luxury-divider" />

    <div>
      <label className="block text-xs font-space uppercase tracking-[0.2em] text-slate-500 mb-3">Price per night</label>
      <div className="space-y-2">
        {priceRanges.map((range, index) => (
          <Checkbox
            key={index}
            label={range.display}
            selected={selectedFilters.priceRange.includes(range.display)}
            onChange={(checked) => handleFilterChange(checked, range.display, "priceRange")}
          />
        ))}
      </div>
    </div>

    <div className="luxury-divider" />

    <div>
      <label className="block text-xs font-space uppercase tracking-[0.2em] text-slate-500 mb-3">Rating</label>
      <div className="space-y-2">
        {ratingOptions.map((option) => (
          <Checkbox
            key={option}
            label={option}
            selected={selectedFilters.rating.includes(option)}
            onChange={(checked) => handleFilterChange(checked, option, "rating")}
          />
        ))}
      </div>
    </div>
  </>
);

export default AllRooms;
