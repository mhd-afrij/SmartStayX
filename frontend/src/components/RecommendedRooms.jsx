import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { Sparkles, Star, Loader2 } from "lucide-react";

const RecommendedRooms = () => {
  const { axios, getToken, formatPrice, navigate, user } = useAppContext();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/recommendations/user?limit=4", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.rooms?.length > 0) {
        setRooms(data.rooms);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading || rooms.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-xl font-playfair text-slate-900">Recommended for You</h2>
          </div>
          <p className="text-sm text-slate-400">Personalized picks based on your preferences and past stays</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rooms.map((room, i) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/rooms/${room._id}`)}
              className="group cursor-pointer luxury-card overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={room.image?.[0] || room.images?.[0] || "/placeholder.svg"}
                  alt={room.roomType || "Room"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#2563EB]/90 text-[10px] font-semibold text-white">
                  {room.recommendationScore?.toFixed(0) || "?"}% Match
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{room.roomType || "Room"}</h3>
                <p className="text-xs text-slate-400 truncate">{room.hotel?.name || "Hotel"}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#2563EB] font-semibold">{formatPrice(room.pricePerNight || 0)}<span className="text-slate-400 font-normal"> / night</span></p>
                  {room.recommendationReason?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Star className="w-3 h-3 text-[#2563EB]" />
                      <span className="truncate max-w-[100px]">{room.recommendationReason[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedRooms;
