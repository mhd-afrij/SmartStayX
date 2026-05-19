import React from "react";
import { motion } from "framer-motion";
import HotelCard from "./HotelCard";
import Title from "./Title";
import { useAppContext } from "../context/AppContext";

const FeaturedDestination = () => {
  const { rooms, navigate } = useAppContext();

  return rooms.length > 0 && (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center space-y-8">
          <Title
            kicker="Curated Collection"
            title="Featured Destination"
            subtitle="Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experiences."
          />

          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-4 min-w-max">
              {rooms.slice(0, 8).map((room, index) => (
                <motion.div
                  key={room._id || room.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="w-72 flex-shrink-0"
                >
                  <HotelCard room={room} index={index} />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => {
              navigate("/rooms");
              scrollTo(0, 0);
            }}
            className="gold-button px-8 py-3 text-sm uppercase tracking-[0.18em]"
          >
            View All Destinations
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestination;
