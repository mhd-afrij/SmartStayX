import React, { useContext, useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { destinationLocaleConfig } from "../assets/assets";

const Checkbox = ({ label, selected = false, onChange = () => {} }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked, label)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900/20"
      />
      <span className="text-sm text-slate-700 font-medium select-none">{label}</span>
    </label>
  );
};

const AllRooms = () => {
  const { rooms, formatPrice, setSelectedCurrency, setSelectedLanguage } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-update currency and language based on destination
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
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Rooms</p>
            <h1 className="text-3xl md:text-4xl font-playfair text-slate-900">
              {searchParams.get("destination")
                ? `Stays in ${searchParams.get("destination")}`
                : "Find your next stay"}
            </h1>
            <p className="text-sm text-slate-600">
              Showing {filteredCount} of {totalRooms} rooms
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 bg-white"
            >
              <option value="">Sort: Recommended</option>
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:text-slate-900 hover:border-slate-300"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="space-y-4 lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Room Type</label>
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price per night</label>
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
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => removeFilter(filter)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                  >
                    {filter}
                    <span className="text-slate-400">x</span>
                  </button>
                ))}
              </div>
            )}

            {filteredRooms.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No rooms found</h3>
                <p className="text-slate-600 mb-4">Try adjusting your filters.</p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredRooms.map((room, index) => (
                <article
                  key={room._id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition h-full flex flex-col"
                >
                  <div
                    className="relative h-44 bg-slate-100 cursor-pointer"
                    onClick={() => {
                      navigate(`/rooms/${room._id}`);
                      scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {room.images?.[0] ? (
                      <img
                        src={room.images[0]}
                        alt={room.hotel?.name || "room"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/95 px-3 py-1 rounded-full text-xs font-semibold text-slate-800">
                      {formatPrice(room.pricePerNight)} / night
                    </div>
                    {index % 3 === 0 && (
                      <div className="absolute top-3 right-3 bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest">
                        FEATURED
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div>
                      <h3
                        onClick={() => {
                          navigate(`/rooms/${room._id}`);
                          scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-lg font-semibold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer line-clamp-1"
                      >
                        {room.hotel?.name || "Luxury Hotel"}
                      </h3>
                      <p className="text-sm text-slate-600">{room.roomType || room.type || "Signature room"}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {room.hotel?.city || room.hotel?.address || "Prime location"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.slice(0, 2).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities?.length > 2 && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                          +{room.amenities.length - 2} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <div className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{formatPrice(room.pricePerNight)}</span> / night
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/rooms/${room._id}`);
                          scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllRooms;
