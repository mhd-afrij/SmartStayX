import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, List, CalendarCheck } from "lucide-react";
import AddRoom from "./rooms/AddRoom";
import ListRoom from "./rooms/ListRoom";
import ReservationManagement from "./ReservationManagement";

const TABS = [
  { key: "rooms", label: "Rooms", icon: List },
  { key: "add-room", label: "Add Room", icon: PlusCircle },
  { key: "reservations", label: "Reservations", icon: CalendarCheck },
];

const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Room Management</h1>
        <p className="text-sm text-white/40 mt-1">Manage rooms, add new listings, and handle reservations.</p>
      </div>

      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#D4A85F] text-[#0B1220] shadow-lg shadow-[#D4A85F]/20"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "rooms" && <ListRoom />}
        {activeTab === "add-room" && <AddRoom />}
        {activeTab === "reservations" && <ReservationManagement />}
      </motion.div>
    </div>
  );
};

export default RoomManagement;
