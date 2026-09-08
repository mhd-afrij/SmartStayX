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
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#E9F1F2] tracking-tight">Room Management</h1>
        <p className="text-sm text-slate-500 dark:text-[#8299A0] mt-1">Manage rooms, add new listings, and handle reservations.</p>
      </div>

      <div className="flex gap-1 bg-[#f4f2ef] dark:bg-[#10131D] rounded-xl p-1 border border-black/[0.06] dark:border-[#232737] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[#D4A853] dark:bg-[#E6C075] text-[#2A230F] shadow-lg shadow-[#D4A853]/30"
                : "text-slate-500 dark:text-[#8299A0] hover:text-slate-900 dark:hover:text-[#E9F1F2] hover:bg-white dark:hover:bg-[#122A32]"
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
