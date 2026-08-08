import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { UserButton } from "@clerk/clerk-react";
import { User, Bell, LifeBuoy, LogOut, CalendarDays, LayoutDashboard, Building2, ChevronDown, Menu } from "lucide-react";
import { assets } from "../assets/assets";

const Navbar = () => {
  const navLinks = [
    { key: "home", path: "/" },
    { key: "hotels", path: "/rooms" },
    { key: "itinerary", path: "/trip-planner" },
    { key: "blog", path: "/blog" },
    { key: "about", path: "/about" },

  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef(null);
  const currencyRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, navigate, isOwner, isReceptionist, translate, selectedLanguage, setSelectedLanguage, languageOptions, selectedCurrency, setSelectedCurrency, currencyOptions, logout } = useAppContext();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 z-50 w-full flex h-16 items-center justify-between px-4 md:px-8 lg:px-12 transition-all duration-300 ${
        isScrolled
          ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(15,23,42,0.06)] border-b border-black/[0.06]"
          : "bg-transparent"
      }`}
    >
      <Link to="/" className="flex-shrink-0">
        <img src={assets.logo} alt="logo" className="h-10" />
      </Link>

      <div className="hidden md:flex items-center gap-6 flex-1 justify-center overflow-hidden">
        {navLinks.map((link, i) => (
          <a
            key={i}
            href={link.path}
            className="nav-link text-sm font-medium uppercase tracking-[0.18em] whitespace-nowrap"
          >
            {translate(link.key)}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block" ref={langRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 border border-black/[0.08] hover:border-[#2563EB]/30 rounded-lg transition-all"
          >
            <span>{selectedLanguage.toUpperCase()}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-36 bg-white border border-black/[0.08] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
              >
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLanguage(lang.code); setLangOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                      selectedLanguage === lang.code
                        ? "text-[#2563EB] bg-[#2563EB]/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/6"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative hidden md:block" ref={currencyRef}>
          <button
            onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 border border-black/[0.08] hover:border-[#2563EB]/30 rounded-lg transition-all"
          >
            <span>{selectedCurrency}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {currencyOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-40 bg-white border border-black/[0.08] rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
              >
                {currencyOptions.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => { setSelectedCurrency(cur.code); setCurrencyOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                      selectedCurrency === cur.code
                        ? "text-[#2563EB] bg-[#2563EB]/10"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/6"
                    }`}
                  >
                    {cur.symbol} — {cur.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {user && (
          <div className="hidden md:flex items-center">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }}>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Profile"
                  labelIcon={<User className="w-3.5 h-3.5" />}
                  onClick={() => navigate("/profile")}
                />
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<CalendarDays className="w-3.5 h-3.5" />}
                  onClick={() => navigate("/my-bookings")}
                />
                <UserButton.Action
                  label="Notifications"
                  labelIcon={<Bell className="w-3.5 h-3.5" />}
                  onClick={() => navigate("/notifications")}
                />
                <UserButton.Action
                  label="Support"
                  labelIcon={<LifeBuoy className="w-3.5 h-3.5" />}
                  onClick={() => navigate("/support")}
                />
                {(isOwner || isReceptionist) && (
                  <UserButton.Action
                    label={isOwner ? "Owner Dashboard" : "Receptionist Dashboard"}
                    labelIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                    onClick={() => navigate(isOwner ? "/Owner" : "/Receptionist")}
                  />
                )}
              </UserButton.MenuItems>
            </UserButton>
          </div>
        )}

        {user ? null : (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 ghost-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("login")}
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-5 py-2 gold-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("signUp")}
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-white/97 backdrop-blur-xl border-b border-black/[0.06] px-6 py-6 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="nav-link text-sm uppercase tracking-[0.18em]"
              >
                {translate(link.key)}
              </a>
            ))}
            <div className="flex gap-3 pt-4 border-t border-black/[0.06]">
              <div className="flex gap-2 flex-1">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="flex-1 bg-white border border-black/[0.08] rounded-lg px-3 py-2.5 text-xs uppercase tracking-[0.1em] text-slate-700 outline-none focus:border-[#2563EB]/50"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white">{lang.label}</option>
                  ))}
                </select>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="flex-1 bg-white border border-black/[0.08] rounded-lg px-3 py-2.5 text-xs uppercase tracking-[0.1em] text-slate-700 outline-none focus:border-[#2563EB]/50"
                >
                  {currencyOptions.map((cur) => (
                    <option key={cur.code} value={cur.code} className="bg-white">{cur.symbol} — {cur.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.06]">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Organization</span>
                  </div>
                  <button onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Profile</button>
                  <button onClick={() => { navigate("/my-bookings"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">My Bookings</button>
                  <button onClick={() => { navigate("/notifications"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Notifications</button>
                  <button onClick={() => { navigate("/support"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Support</button>
                  {(isOwner || isReceptionist) && (
                    <button onClick={() => { navigate(isOwner ? "/Owner" : "/Receptionist"); setIsMenuOpen(false); }} className="gold-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">
                      {isOwner ? "Dashboard" : "Receptionist"}
                    </button>
                  )}
                  <button onClick={logout} className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#EF4444]/70 border border-[#EF4444]/20 rounded-xl hover:bg-[#EF4444]/10 transition-colors">Sign Out</button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => navigate("/login")} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("login")}</button>
                  <button onClick={() => navigate("/signup")} className="gold-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("signUp")}</button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
