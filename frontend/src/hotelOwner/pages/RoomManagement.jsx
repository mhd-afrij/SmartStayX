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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Room Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage rooms, add new listings, and handle reservations.</p>
      </div>

      <div className="flex gap-1 bg-[#f4f2ef] rounded-xl p-1 border border-black/[0.06] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-white"
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
