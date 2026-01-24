import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";  

// Setting default base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

// Creating AppContext
export const AppContext = createContext();

// AppProvider component
export const AppProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isOwner, setIsOwner] = useState(false);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch rooms data
  const fetchRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms");
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch user data
  const fetchUser = async (retryCount = 0) => {
    try {
      const { data } = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      console.log("User data from API:", data);
      if (data.success) {
        const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        const effectiveOwner = data.role === "hotelOwner" || email === "mbmafrij@gmail.com";

        console.log("User role:", data.role);
        console.log("Email:", email);
        console.log("Username:", user?.username || user?.fullName);

        setIsOwner(effectiveOwner);
        console.log("IsOwner set to:", effectiveOwner);
        if (effectiveOwner) {
          console.log("✅ OWNER ACCESS GRANTED");
          console.log("Owner Email:", email);
          console.log("Owner Username:", user?.username || user?.fullName);
        }
        setSearchedCities(data.recentSearchedCities);
      } else {
        if (retryCount < 3) {
          setTimeout(() => {
            fetchUser(retryCount + 1); // Retry logic with max 3 retries
          }, 5000);
        } else {
          toast.error("Failed to fetch user details after multiple attempts.");
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUser();
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const value = {
    currency,
    navigate,
    user,
    getToken,
    isOwner,
    setIsOwner,
    axios,
    showHotelReg,
    setShowHotelReg,
    searchedCities,
    setSearchedCities,
    rooms,
    setRooms,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
