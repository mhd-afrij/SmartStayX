import React, { useContext, useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { destinationLocaleConfig } from "../assets/assets";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";

const Checkbox = ({ label, selected = false, onChange = () => {} }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked, label)}
        className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D4A85F] focus:ring-[#D4A85F]/30 focus:ring-2 accent-[#D4A85F]"
      />
      <span className={`text-sm font-medium select-none transition-colors ${selected ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>{label}</span>
    </label>
  );
};

const AllRooms = () => {
  const { rooms, formatPrice, setSelectedCurrency, setSelectedLanguage } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync locale settings with the selected destination.
  useEffect(() => {
    const destination = searchParams.get("destination");
    if (destination && destinationLocaleConfig[destination]) {
      setSelectedLanguage(destinationLocaleConfig[destination].languageCode);
      setSelectedCurrency(destinationLocaleConfig[destination].currencyCode);
    }
  }, [searchParams]);

  const [openFilter, setOpenFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    roomType: [],
    priceRange: [],
  });
  const [selectedSort, setSelectedSort] = useState("");

  const roomTypes = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];
  const priceRanges = ["0 to 100", "100 to 200", "200 to 300", "300 to 400", "400 to 500"];
  const sortOptions = ["Price: Low to High", "Price: High to Low", "Newest First"];

  const handleFilterChange = (checked, value, type) => {
    setSelectedFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };
      if (checked) {
        updatedFilters[type].push(value);
      } else {
        updatedFilters[type] = updatedFilters[type].filter((item) => item !== value);
      }
      return updatedFilters;
    });
  };

  const handleSortChange = (sortOption) => {
    setSelectedSort(sortOption);
  };

  const matchRoomType = (room) => {
    if (selectedFilters.roomType.length === 0) return true;
    return selectedFilters.roomType.includes(room.type);
  };

  const matchesPriceRange = (room) => {
    return (
      selectedFilters.priceRange.length === 0 ||
      selectedFilters.priceRange.some((range) => {
        const [min, max] = range.split(" to ").map(Number);
        return room.pricePerNight >= min && room.pricePerNight <= max;
      })
    );
  };

  const sortRooms = (a, b) => {
    if (selectedSort === "Price: Low to High") {
      return a.pricePerNight - b.pricePerNight;
    } else if (selectedSort === "Price: High to Low") {
      return b.pricePerNight - a.pricePerNight;
    } else if (selectedSort === "Newest First") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  };

  const filterDestination = (room) => {
    const destination = searchParams.get("destination");
    if (!destination) return true;
    return room.hotel?.city?.toLowerCase().includes(destination.toLowerCase());
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      matchRoomType(room) &&
      matchesPriceRange(room) &&
      filterDestination(room)
    ).sort(sortRooms);
  }, [rooms, selectedFilters, selectedSort, searchParams]);

  const activeFilters = [...selectedFilters.roomType, ...selectedFilters.priceRange];

  const clearFilters = () => {
    setSelectedFilters({
      roomType: [],
      priceRange: [],
    });
    setSelectedSort("");
    setSearchParams({});
  };

  const removeFilter = (value) => {
    setSelectedFilters((prev) => ({
      roomType: prev.roomType.filter((item) => item !== value),
      priceRange: prev.priceRange.filter((item) => item !== value),
    }));
  };

  const totalRooms = rooms.length;
  const filteredCount = filteredRooms.length;

  return (
    <div className="pt-20 min-h-screen bg-[#07111f]">
      {/* Page header and controls */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="luxury-kicker">Rooms</p>
            <h1 className="text-3xl md:text-4xl font-playfair text-white mt-1">
              {searchParams.get("destination")
                ? `Stays in ${searchParams.get("destination")}`
                : "Find your next stay"}
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Showing {filteredCount} of {totalRooms} rooms
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="luxury-select text-sm min-w-[10rem]"
            >
              <option value="" className="bg-[#0d1728]">Sort: Recommended</option>
              {sortOptions.map((option) => (
                <option key={option} value={option} className="bg-[#0d1728]">
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="ghost-button px-4 py-2.5 text-sm"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Filters and results grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="space-y-4 lg:col-span-3">
            {/* Filter panel */}
            <div className="luxury-card p-5 space-y-5">
              <div>
                <label className="block text-xs font-space uppercase tracking-[0.2em] text-white/50 mb-3">Room Type</label>
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
                <label className="block text-xs font-space uppercase tracking-[0.2em] text-white/50 mb-3">Price per night</label>
                <div className="space-y-2">
                  {priceRanges.map((range, index) => (
                    <Checkbox
                      key={index}
                      label={range}
                      selected={selectedFilters.priceRange.includes(range)}
                      onChange={(checked) => handleFilterChange(checked, range, "priceRange")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-4 min-w-0 lg:col-span-9">
            {/* Active filter chips and room cards */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => removeFilter(filter)}
                    className="luxury-card-soft flex items-center gap-2 px-3 py-1.5 text-xs text-white/70"
                  >
                    {filter}
                    <span className="text-white/40 hover:text-white transition-colors">✕</span>
                  </button>
                ))}
              </div>
            )}

            {filteredRooms.length === 0 && (
              <div className="luxury-card p-10 text-center">
                <h3 className="font-playfair text-xl text-white mb-2">No rooms found</h3>
                <p className="text-white/50 mb-5">Try adjusting your filters.</p>
                <button
                  onClick={clearFilters}
                  className="gold-button px-6 py-2.5 text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}

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
                  <div
                    className="relative h-44 overflow-hidden cursor-pointer"
                    onClick={() => {
                      navigate(`/rooms/${room._id}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {room.images?.[0] ? (
                      <img
                        src={room.images[0]}
                        alt={room.hotel?.name || "room"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
                        No image
                      </div>
                    )}
                    <div className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl px-3 py-1 text-xs font-semibold text-white">
                      {formatPrice(room.pricePerNight)} / night
                    </div>
                    {index % 3 === 0 && (
                      <div className="absolute top-3 right-3 bg-[#D4A85F]/90 text-[#1b1d20] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]">
                        Featured
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <h3
                        onClick={() => {
                          navigate(`/rooms/${room._id}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="font-playfair text-lg text-white hover:text-[#D4A85F] transition-colors cursor-pointer"
                      >
                        {room.hotel?.name || "Luxury Hotel"}
                      </h3>
                      <p className="text-sm text-white/60 mt-0.5">{room.roomType || room.type || "Signature room"}</p>
                      <p className="text-xs text-white/40 mt-1.5">
                        {room.hotel?.city || room.hotel?.address || "Prime location"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {room.amenities?.slice(0, 2).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/55 text-[0.7rem]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities?.length > 2 && (
                        <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/55 text-[0.7rem]">
                          +{room.amenities.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/8">
                      <div>
                        <span className="text-lg font-semibold text-white">{formatPrice(room.pricePerNight)}</span>
                        <span className="text-sm text-white/40 ml-1">/ night</span>
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/rooms/${room._id}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="gold-button px-5 py-2.5 text-xs uppercase tracking-[0.18em]"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllRooms;
