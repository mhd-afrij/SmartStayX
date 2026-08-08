import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";
import { User, Bell, LifeBuoy, LogOut, CalendarDays, LayoutDashboard, Building2, ChevronDown, Menu } from "lucide-react";
import { assets } from "../assets/assets";

const Navbar = () => {
  const navLinks = [
    { key: "home", path: "/" },
    { key: "hotels", path: "/rooms" },
    { key: "trip-planner", path: "/trip-planner" },
    { key: "itinerary", path: "/itinerary" },
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

  const clerk = useClerk();
  const { signOut } = clerk;
  const { user, navigate, isOwner, isReceptionist, translate, selectedLanguage, setSelectedLanguage, languageOptions, selectedCurrency, setSelectedCurrency, currencyOptions } = useAppContext();

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
          ? "bg-[#07111f]/92 backdrop-blur-xl shadow-[0_4px_40px_rgba(0,0,0,0.28)] border-b border-white/8"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
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
                className="absolute right-0 mt-2 w-36 bg-[#0c1a2e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
              >
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLanguage(lang.code); setLangOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                      selectedLanguage === lang.code
                        ? "text-[#D4A85F] bg-white/6"
                        : "text-white/70 hover:text-white hover:bg-white/6"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
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
                className="absolute right-0 mt-2 w-40 bg-[#0c1a2e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
              >
                {currencyOptions.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => { setSelectedCurrency(cur.code); setCurrencyOpen(false); }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                      selectedCurrency === cur.code
                        ? "text-[#D4A85F] bg-white/6"
                        : "text-white/70 hover:text-white hover:bg-white/6"
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
          <div className="relative hidden md:block" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A85F] to-[#F5D08A] flex items-center justify-center text-[10px] font-bold text-[#0B1220]">
                {(user.firstName || user.primaryEmailAddress?.emailAddress || "G")[0].toUpperCase()}
              </div>
              <span className="text-xs text-white/70 max-w-[80px] truncate">
                {user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Guest'}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-[#0c1a2e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-white/[0.06]">
                    <p className="text-xs text-white/80 px-2 py-1 truncate">{user.primaryEmailAddress?.emailAddress || "No email"}</p>
                  </div>
                  <div className="p-1">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#D4A85F]" />
                        <span className="text-[10px] uppercase tracking-[0.12em] text-white/50">Organization</span>
                      </div>
                      <OrganizationSwitcher
                        appearance={{
                          elements: {
                            organizationSwitcherTrigger: "w-full text-xs text-white/70 hover:text-white bg-white/[0.04] rounded-lg px-2 py-1.5 mt-1",
                            organizationSwitcherPopoverCard: "bg-[#0c1a2e] border border-white/10",
                            organizationSwitcherPopoverActionButton: "text-white/70 text-xs hover:text-white",
                          }
                        }}
                      />
                    </div>
                    <button onClick={() => { setUserMenuOpen(false); navigate("/profile"); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <User className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button onClick={() => { setUserMenuOpen(false); navigate("/my-bookings"); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <CalendarDays className="w-3.5 h-3.5" /> My Bookings
                    </button>
                    <button onClick={() => { setUserMenuOpen(false); navigate("/notifications"); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <Bell className="w-3.5 h-3.5" /> Notifications
                    </button>
                    <button onClick={() => { setUserMenuOpen(false); navigate("/support"); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <LifeBuoy className="w-3.5 h-3.5" /> Support
                    </button>
                    {(isOwner || isReceptionist) && (
                      <div className="border-t border-white/[0.06] mt-1 pt-1">
                        <button onClick={() => { setUserMenuOpen(false); navigate(isOwner ? "/Owner" : "/Receptionist"); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#D4A85F] hover:bg-[#D4A85F]/10 rounded-lg transition-colors">
                          <LayoutDashboard className="w-3.5 h-3.5" /> {isOwner ? "Owner Dashboard" : "Receptionist Dashboard"}
                        </button>
                      </div>
                    )}
                    <div className="border-t border-white/[0.06] mt-1 pt-1">
                      <button onClick={() => signOut()} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {user ? null : (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => clerk.openSignIn()}
              className="px-4 py-2 ghost-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("login")}
            </button>
            <button
              onClick={() => clerk.openSignUp()}
              className="px-5 py-2 gold-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("signUp")}
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white/75 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-[#07111f]/98 backdrop-blur-xl border-b border-white/8 px-6 py-6 md:hidden"
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
            <div className="flex gap-3 pt-4 border-t border-white/8">
              <div className="flex gap-2 flex-1">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2.5 text-xs uppercase tracking-[0.1em] text-white/80 outline-none focus:border-[#D4A85F]/50"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#07111f]">{lang.label}</option>
                  ))}
                </select>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2.5 text-xs uppercase tracking-[0.1em] text-white/80 outline-none focus:border-[#D4A85F]/50"
                >
                  {currencyOptions.map((cur) => (
                    <option key={cur.code} value={cur.code} className="bg-[#07111f]">{cur.symbol} — {cur.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/8">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Building2 className="w-3.5 h-3.5 text-[#D4A85F]" />
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/50">Organization</span>
                  </div>
                  <OrganizationSwitcher
                    appearance={{
                      elements: {
                        organizationSwitcherTrigger: "w-full text-xs text-white/70 hover:text-white bg-white/[0.04] rounded-lg px-3 py-2.5",
                        organizationSwitcherPopoverCard: "bg-[#07111f] border border-white/10",
                        organizationSwitcherPopoverActionButton: "text-white/70 text-xs hover:text-white",
                      }
                    }}
                  />
                  <button onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Profile</button>
                  <button onClick={() => { navigate("/my-bookings"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">My Bookings</button>
                  <button onClick={() => { navigate("/notifications"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Notifications</button>
                  <button onClick={() => { navigate("/support"); setIsMenuOpen(false); }} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">Support</button>
                  {(isOwner || isReceptionist) && (
                    <button onClick={() => { navigate(isOwner ? "/Owner" : "/Receptionist"); setIsMenuOpen(false); }} className="gold-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">
                      {isOwner ? "Dashboard" : "Receptionist"}
                    </button>
                  )}
                  <button onClick={() => signOut()} className="px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#EF4444]/70 border border-[#EF4444]/20 rounded-xl hover:bg-[#EF4444]/10 transition-colors">Sign Out</button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => clerk.openSignIn()} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("login")}</button>
                  <button onClick={() => clerk.openSignUp()} className="gold-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("signUp")}</button>
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
