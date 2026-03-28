import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { useClerk, UserButton } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";


const BookIcon = () => (
  <svg
    className="w-4 h-4 text-gray-700"
    aria-hidden="true"
    xmlns="http://www.w3.
org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 19V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13H7a2 2 0 0 0-2 2Zm0
0a2 2 0 0 0 2 2h12M9 3v14m7 0v4"
    />
  </svg>
);

const Navbar = () => {
  const navLinks = [
    { key: "home", path: "/" },
    { key: "hotels", path: "/rooms" },
    { key: "tripPlanner", path: "/trip-planner" },
    { key: "experience", path: "/experience" },
    { key: "about", path: "/about" },
  ];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { openSignIn, openSignUp } = useClerk();
  const location = useLocation();

  const {
    user,
    navigate,
    isOwner,
    selectedLanguage,
    setSelectedLanguage,
    languageOptions,
    selectedCurrency,
    setSelectedCurrency,
    currencyOptions,
    translate,
  } = useAppContext();

  const ownerEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const effectiveOwner = isOwner || ownerEmail === "mbmafrij@gmail.com";

  const getCurrencyDisplay = (currency) => `${currency.symbol} ${currency.label}`;

  useEffect(() => {
    if (location.pathname !== "/") {
      setIsScrolled(true);
      return;
    } else {
      setIsScrolled(false);
    }
    setIsScrolled((prev) => (location.pathname !== "/" ? true : prev));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 md:px-6 lg:px-10 xl:px-20 transition-all duration-500 z-50 ${
        isScrolled
          ? "bg-white/80 shadow-md text-gray-700 backdrop-blur-lg"
          : "backdrop-blur-md"
      }`}
    >
      {/* Logo */}
      <Link to="/">
        <img
          src={assets.logo}
          alt="logo"
          className={`h-10 ${isScrolled ? "invert" : ""}`}
        />
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-4 lg:gap-6">
        {navLinks.map((link, i) => (
          <a
            key={i}
            href={link.path}
            className={`group flex flex-col gap-0.5 ${
              isScrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {translate(link.key)}
            <div
              className={`${
                isScrolled ? "bg-gray-700" : "bg-white"
              } h-0.5 w-0 group-hover:w-full transition-all duration-300`}
            />
          </a>
        ))}

        {user && effectiveOwner && (
          <button
            className={`px-5 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all ${
              isScrolled 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => navigate("/Owner")}
          >
            {translate("dashboard")}
          </button>
        )}
      </div>

      {/* Desktop Right */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <svg
              className={`h-4 w-4 ${isScrolled ? "text-gray-600" : "text-white"}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2.5 12H21.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2C14.6 4.7 16.1 8.2 16.1 12C16.1 15.8 14.6 19.3 12 22C9.4 19.3 7.9 15.8 7.9 12C7.9 8.2 9.4 4.7 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              aria-label={translate("language")}
              className={`text-xs bg-transparent border-b pb-0.5 outline-none min-w-[100px] ${
                isScrolled ? "border-gray-300 text-gray-700" : "border-white/60 text-white"
              }`}
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code} className="text-gray-800">
                  {language.code.toUpperCase()} - {language.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-semibold ${isScrolled ? "text-gray-600" : "text-white"}`}>$</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              aria-label={translate("currency")}
              className={`text-xs border-b pb-0.5 min-w-[132px] ${
                isScrolled ? "border-gray-300 text-gray-700" : "border-white/60 text-white"
              }`}
            >
              {currencyOptions.map((currency) => (
                <option key={currency.code} value={currency.code} className="text-gray-800">
                  {getCurrencyDisplay(currency)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {user ? (
          <UserButton>
            {!effectiveOwner && (
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<BookIcon />}
                  onClick={() => navigate("/my-bookings")}
                />
              </UserButton.MenuItems>
            )}
          </UserButton>
        ) : (
          <>
            <button
              onClick={openSignIn}
              className={`px-6 py-2 rounded-full ml-3 transition-all duration-500 ${
                isScrolled ? "text-white bg-black" : "bg-white text-black"
              }`}
            >
              {translate("login")}
            </button>
            <button
              onClick={openSignUp}
              className={`px-6 py-2 rounded-full transition-all duration-500 ${
                isScrolled ? "text-white bg-black" : "bg-white text-black"
              }`}
            >
              {translate("signUp")}
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}

      <div className="flex items-center gap-3 md:hidden">
        {user && (
          <UserButton>
            {!effectiveOwner && (
              <UserButton.MenuItems>
                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<BookIcon />}
                  onClick={() => navigate("/my-bookings")}
                />
              </UserButton.MenuItems>
            )}
          </UserButton>
        )}

        <img
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          src={assets.menuIcon}
          alt=""
          className={`h-6 ${isScrolled ? "invert" : ""}`}
        />
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-screen bg-white text-base flex flex-col md:hidden items-center justify-center gap-6 font-medium text-gray-800 transition-all duration-500 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-4 right-4"
          onClick={() => setIsMenuOpen(false)}
        >
          <img src={assets.closeIcon} alt="close-menu" className="h-6.5" />
        </button>

        {navLinks.map((link, i) => (
          <a key={i} href={link.path} onClick={() => setIsMenuOpen(false)}>
            {translate(link.key)}
          </a>
        ))}

        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2.5 12H21.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2C14.6 4.7 16.1 8.2 16.1 12C16.1 15.8 14.6 19.3 12 22C9.4 19.3 7.9 15.8 7.9 12C7.9 8.2 9.4 4.7 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border-b border-gray-300 px-1 py-2 text-sm outline-none"
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.code.toUpperCase()} - {language.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-600">$</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full border-b border-gray-300 px-1 py-2 text-sm outline-none"
            >
              {currencyOptions.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {getCurrencyDisplay(currency)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {user && isOwner && (
          <button
            className="border px-4 py-1 text-sm font-light rounded-full cursor-pointer transition-all"
            onClick={() => {
              navigate("/Owner");
              setIsMenuOpen(false);
            }}
          >
            Owner Dashboard
          </button>
        )}
        {!user && (
          <>
            <button
              onClick={openSignIn}
              className="bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500"
            >
              {translate("login")}
            </button>
            <button
              onClick={openSignUp}
              className="bg-black text-white px-8 py-2.5 rounded-full transition-all duration-500"
            >
              {translate("signUp")}
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
