import { motion } from "framer-motion";
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import { CalendarDays, LogOut, User, Settings, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-[#0B1220]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/50 font-space">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A85F] to-[#F5D08A] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[#0B1220]" />
              </div>
              <span className="text-sm text-white/70 hidden sm:block">
                {user?.username || user?.fullName || "Receptionist"}
              </span>
            </button>

            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-48 rounded-xl border border-white/[0.08] bg-[#0B1220]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-sm text-white/80">{user?.username || "Receptionist"}</p>
                  <p className="text-xs text-white/40">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                </div>
                <div className="p-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-white/[0.06] mt-1 pt-1 mb-1">
                    <OrganizationSwitcher
                      appearance={{
                        elements: {
                          organizationSwitcherTrigger: "w-full text-xs text-white/70 hover:text-white bg-white/[0.04] rounded-lg px-2 py-1.5",
                          organizationSwitcherPopoverCard: "bg-[#0c1a2e] border border-white/10",
                          organizationSwitcherPopoverActionButton: "text-white/70 text-xs hover:text-white",
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
