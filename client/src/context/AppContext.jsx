import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";  

// Setting default base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
      const token = await getToken();
      if (!token) {
        console.log("No token available");
        return;
      }

      const { data } = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setIsOwner(data.role === "hotelOwner");
        setSearchedCities(data.recentSearchedCities || []);
      } else {
        // If user not found, don't retry - it's a permanent error
        if (data.message && data.message.includes("not found")) {
          console.log("User not found in database");
          // Set default values
          setIsOwner(false);
          setSearchedCities([]);
          return;
        }
        
        // For other errors, retry with exponential backoff
        if (retryCount < 2) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          setTimeout(() => {
            fetchUser(retryCount + 1);
          }, delay);
        } else {
          console.error("Failed to fetch user details:", data.message);
          // Set default values instead of showing error
          setIsOwner(false);
          setSearchedCities([]);
        }
      }
    } catch (error) {
      // Handle network errors or other exceptions
      if (retryCount < 2) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        setTimeout(() => {
          fetchUser(retryCount + 1);
        }, delay);
      } else {
        console.error("Error fetching user:", error.message);
        // Set default values instead of showing error
        setIsOwner(false);
        setSearchedCities([]);
      }
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
export const useAppContext = () => useContext(AppContext);
