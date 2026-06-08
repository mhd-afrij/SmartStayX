import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "../assets/assets";
import { useClerk, UserButton } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  // Primary navigation destinations.
  const navLinks = [
    { key: "home", path: "/" },
    { key: "hotels", path: "/rooms" },
    { key: "tripPlanner", path: "/trip-planner" },
    { key: "blog", path: "/blog" },
    { key: "experience", path: "/experience" },
    { key: "about", path: "/about" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const langRef = useRef(null);
  const currencyRef = useRef(null);

  const { openSignIn, openSignUp } = useClerk();
  const { user, navigate, isOwner, translate, selectedLanguage, setSelectedLanguage, languageOptions, selectedCurrency, setSelectedCurrency, currencyOptions } = useAppContext();

  const ownerEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const effectiveOwner = isOwner || ownerEmail === "mbmafrij@gmail.com";

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
      {/* Brand logo */}
      <Link to="/" className="flex-shrink-0">
        <img src={assets.logo} alt="logo" className="h-10" />
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
        {navLinks.map((link, i) => (
          <a
            key={i}
            href={link.path}
            className="nav-link text-sm font-medium uppercase tracking-[0.18em]"
          >
            {translate(link.key)}
          </a>
        ))}
      </div>

      {/* Language, Currency, Auth and owner actions */}
      <div className="flex items-center gap-2">
        {/* Language dropdown */}
        <div className="relative hidden md:block" ref={langRef}>
          <button
            onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
          >
            <span>{selectedLanguage.toUpperCase()}</span>
            <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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

        {/* Currency dropdown */}
        <div className="relative hidden md:block" ref={currencyRef}>
          <button
            onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-[0.12em] text-white/70 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
          >
            <span>{selectedCurrency}</span>
            <svg className={`w-3 h-3 transition-transform ${currencyOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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

        {user && effectiveOwner && (
          <button
            onClick={() => navigate("/Owner")}
            className="hidden md:block px-5 py-2 gold-button text-xs uppercase tracking-[0.18em]"
          >
            {translate("dashboard")}
          </button>
        )}

        {user ? (
          <>
            <span className="hidden md:block text-xs text-white/50 mr-1">
              Hi, {user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Guest'}
            </span>
            <UserButton />
          </>
        ) : (
          <div className="hidden md:flex gap-2">
            <button
              onClick={openSignIn}
              className="px-4 py-2 ghost-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("login")}
            </button>
            <button
              onClick={openSignUp}
              className="px-5 py-2 gold-button text-xs uppercase tracking-[0.18em]"
            >
              {translate("signUp")}
            </button>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white/75 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile navigation drawer */}
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
            <div className="flex gap-3 pt-2 border-t border-white/8">
              {user ? (
                <UserButton />
              ) : (
                <>
                  <button onClick={openSignIn} className="ghost-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("login")}</button>
                  <button onClick={openSignUp} className="gold-button flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]">{translate("signUp")}</button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
