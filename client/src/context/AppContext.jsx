import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";
import React from "react";  

// Setting default base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Add request timeout
axios.defaults.timeout = 30000; // 30 seconds

// Add response interceptor for better error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (error.response) {
      // Server responded with error status
      console.error(`API Error [${error.response.status}]:`, error.response.data?.message || error.message);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response from server');
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Creating AppContext
export const AppContext = createContext();

// AppProvider component
export const AppProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isOwner, setIsOwner] = useState(false);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [showHotelReg, setShowHotelReg] = useState(false);
  const [searchedCities, setSearchedCities] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch rooms data
  const fetchRooms = async (retryCount = 0) => {
    try {
      const { data } = await axios.get("/api/rooms");
      if (data.success) {
        setRooms(data.rooms || []);
      } else {
        toast.error(data.message || "Failed to load rooms");
        setRooms([]);
      }
    } catch (error) {
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        // Network error or server not reachable
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          if (retryCount < 3) {
            console.log(`Network error, retrying... (${retryCount + 1}/3)`);
            setTimeout(() => {
              fetchRooms(retryCount + 1);
            }, 3000);
            return;
          }
          toast.error("Cannot connect to server. Please check your connection.");
          setRooms([]);
          return;
        }
        
        // Server responded with error status
        if (error.response) {
          const status = error.response.status;
          
          // 503 - Service Unavailable (Database connecting)
          if (status === 503 && retryCount < 5) {
            console.log(`Database connecting, retrying... (${retryCount + 1}/5)`);
            setTimeout(() => {
              fetchRooms(retryCount + 1);
            }, 3000);
            return;
          }
          
          // Other server errors
          const errorMessage = error.response.data?.message || `Server error: ${status}`;
          toast.error(errorMessage);
          setRooms([]);
          return;
        }
      }
      
      // Generic error handling
      console.error("Error fetching rooms:", error);
      toast.error(error.message || "Failed to load rooms");
      setRooms([]);
    }
  };

  // Fetch user data
  const fetchUser = async (retryCount = 0) => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("No token available");
        setIsUserDataLoading(false);
        return;
      }

      const { data } = await axios.get("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (data.success) {
        setIsOwner(data.role === "hotelOwner");
        setSearchedCities(data.recentSearchedCities || []);
        setIsUserDataLoading(false);
      } else {
        // If user not found, don't retry - it's a permanent error
        if (data.message && data.message.includes("not found")) {
          console.log("User not found in database");
          // Set default values
          setIsOwner(false);
          setSearchedCities([]);
          setIsUserDataLoading(false);
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
          setIsUserDataLoading(false);
        }
      }
    } catch (error) {
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        // Network error or server not reachable
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          if (retryCount < 2) {
            console.log(`Network error, retrying user fetch... (${retryCount + 1}/2)`);
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            setTimeout(() => {
              fetchUser(retryCount + 1);
            }, delay);
            return;
          }
          // Set default values on network failure
          setIsOwner(false);
          setSearchedCities([]);
          setIsUserDataLoading(false);
          return;
        }
        
        // Server responded with error status
        if (error.response) {
          const status = error.response.status;
          
          // 503 - Service Unavailable (Database connecting)
          if (status === 503 && retryCount < 5) {
            console.log(`Database connecting, retrying user fetch... (${retryCount + 1}/5)`);
            setTimeout(() => {
              fetchUser(retryCount + 1);
            }, 3000);
            return;
          }
          
          // 401 - Unauthorized (token issues)
          if (status === 401) {
            console.log("Authentication failed");
            setIsOwner(false);
            setSearchedCities([]);
            setIsUserDataLoading(false);
            return;
          }
        }
      }
      
      // Generic error handling
      console.error("Error fetching user:", error);
      // Set default values instead of showing error to user
      setIsOwner(false);
      setSearchedCities([]);
      setIsUserDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsUserDataLoading(true);
      fetchUser();
    } else {
      setIsUserDataLoading(false);
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
    isUserDataLoading,
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
