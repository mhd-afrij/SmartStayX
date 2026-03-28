import React from "react";
import HotelCard from "./HotelCard";
import Title from "./Title";
import { useAppContext } from "../context/AppContext";

const FeaturedDestination = () => {

  const { rooms, navigate } = useAppContext();





  return rooms.length> 0 &&(
    <div className="w-full px-6 md:px-16 lg:px-24 bg-slate-50 py-20">
      <div className="flex flex-col items-center space-y-8">
        <Title
          title="Featured Destination"
          subtitle="Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experiences."
        />

        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4 min-w-max">
            {rooms.slice(0, 8).map((room) => (
              <div key={room._id || room.id} className="w-72 flex-shrink-0">
                <HotelCard room={room} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            navigate("/rooms");
            scrollTo(0, 0);
          }}
          className="my-8 px-6 py-2.5 text-sm font-semibold border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
        >
          View All Destinations
        </button>
      </div>
    </div>
  );
};

export default FeaturedDestination;
