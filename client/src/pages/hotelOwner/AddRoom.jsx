import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast"; 


const AddRoom = () => {
  const { axios, getToken } = useAppContext();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!roomId;

  const [images, setImages] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [inputs, setInputs] = useState({
    roomType: "",
    pricePerNight: 0,
    amenities: {
      "Free Wifi": false,
      "Free Breakfast": false,
      "Room Service": false,
      "Mountain View": false,
      "Pool Access": false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Load room data when in edit mode
  useEffect(() => {
    if (isEditMode && roomId) {
      loadRoomData();
    }
  }, [roomId, isEditMode]);

  const loadRoomData = async () => {
    setLoadingRoom(true);
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/rooms/Owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const room = data.rooms.find(r => r._id === roomId);
        if (room) {
          // Set room type
          setInputs({
            roomType: room.roomType || "",
            pricePerNight: room.pricePerNight || 0,
            amenities: {
              "Free Wifi": room.amenities?.includes("Free Wifi") || false,
              "Free Breakfast": room.amenities?.includes("Free Breakfast") || false,
              "Room Service": room.amenities?.includes("Room Service") || false,
              "Mountain View": room.amenities?.includes("Mountain View") || false,
              "Pool Access": room.amenities?.includes("Pool Access") || false,
            },
          });

          // Set existing images
          if (room.images && room.images.length > 0) {
            setExistingImages(room.images);
            // Pre-populate image slots with existing images
            const imageState = { 1: null, 2: null, 3: null, 4: null };
            room.images.forEach((img, index) => {
              if (index < 4) {
                imageState[index + 1] = img; // Store URL string for existing images
              }
            });
            setImages(imageState);
          }
        } else {
          toast.error("Room not found");
          navigate("/Owner/list-room");
        }
      }
    } catch (error) {
      console.error("Error loading room:", error);
      toast.error("Failed to load room data");
      navigate("/Owner/list-room");
    } finally {
      setLoadingRoom(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Check if all inputs are filled
    // For edit mode, allow submission even if no new images (use existing ones)
    if (!inputs.roomType || !inputs.pricePerNight || !inputs.amenities) {
      toast.error("Please fill in all the required details");
      return;
    }
    
    // For new room, require at least one image
    if (!isEditMode && !Object.values(images).some((image) => image instanceof File)) {
      toast.error("Please upload at least one room image");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("roomType", inputs.roomType);
      formData.append("pricePerNight", inputs.pricePerNight);

      // Converting amenities to array & keeping only enabled amenities
      const amenities = Object
        .keys(inputs.amenities)
        .filter((key) => inputs.amenities[key]);
      formData.append("amenities", JSON.stringify(amenities));

      // Only append new file images (filter out existing image URLs which are strings)
      Object.keys(images).forEach((key) => {
        if (images[key] && images[key] instanceof File) {
          formData.append("images", images[key]);
        }
      });

      const token = await getToken();

      let data;
      // Increased timeout for file uploads (120 seconds for multiple images)
      const uploadTimeout = 120000; // 2 minutes
      
      if (isEditMode) {
        // Update existing room
        const response = await axios.put(`/api/rooms/${roomId}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`
          },
          timeout: uploadTimeout, // Increased timeout for file uploads
        });
        data = response.data;
      } else {
        // Create new room
        const response = await axios.post("/api/rooms", formData, {
          headers: { 
            Authorization: `Bearer ${token}`
          },
          timeout: uploadTimeout, // Increased timeout for file uploads
        });
        data = response.data;
      }

      if (data.success) {
        toast.success(data.message);

        if (isEditMode) {
          // Navigate back to list after successful update
          navigate("/Owner/list-room");
        } else {
          // Reset form for new room
          setInputs({
            roomType: "",
            pricePerNight: 0,
            amenities: {
              "Free Wifi": false,
              "Free Breakfast": false,
              "Room Service": false,
              "Mountain View": false,
              "Pool Access": false,
            },
          });
          setImages({ 1: null, 2: null, 3: null, 4: null });
          setExistingImages([]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} room:`, error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error("Upload is taking longer than expected. Please try again with smaller images or fewer images.");
        setLoading(false);
        return;
      }
      
      if (error.response) {
        toast.error(error.response.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        toast.error("Cannot connect to server. Please make sure the backend server is running on port 3000.");
      } else {
        toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'add'} room`);
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <form onSubmit={onSubmitHandler}>
        <Title
          align="left"
          font="outfit"
          title={isEditMode ? "Edit Room" : "Add Room"}
          subtitle={isEditMode 
            ? "Update the room details, pricing, and amenities. You can replace images or keep existing ones." 
            : "Fill in the details carefully and accurate room details, pricing, and amenities to enhance the user booking experience."}
        />

        {/* Upload area for Images */}
        <p className="text-gray-800 mt-10">Images {isEditMode && <span className="text-sm text-gray-500">(Upload new images to replace existing ones)</span>}</p>
        <div className="grid grid-cols-2 sm:flex gap-4 my-2 flex-wrap">
          {Object.keys(images).map((key) => {
            const imageValue = images[key];
            let imageSrc = assets.uploadArea;
            
            // Show existing image URL or preview of new file
            if (imageValue) {
              if (imageValue instanceof File) {
                imageSrc = URL.createObjectURL(imageValue);
              } else if (typeof imageValue === 'string') {
                // Existing image URL
                imageSrc = imageValue;
              }
            }
            
            return (
              <label htmlFor={`roomImage${key}`} key={key} className="relative">
                <img
                  className="max-h-13 cursor-pointer opacity-80"
                  src={imageSrc}
                  alt=""
                />
                {isEditMode && imageValue && typeof imageValue === 'string' && (
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">Existing</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id={`roomImage${key}`}
                  hidden
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      setImages({ ...images, [key]: e.target.files[0] });
                    }
                  }}
                />
              </label>
            );
          })}
        </div>

        <div className="w-full flex max-sm:flex-col sm:gap-4 mt-4">
          <div className="flex-1 max-w-48">
            <p className="text-gray-800 mt-4">Room Type</p>
            <select
              value={inputs.roomType}
              onChange={(e) =>
                setInputs({ ...inputs, roomType: e.target.value })
              }
              className="border opacity-80 border-gray-300 mt-1 rounded p-2 w-full"
            >
              <option value="">Select Room Type</option>
              <option value="Single Bed">Single bed</option>
              <option value="Double Bed">Double bed</option>
              <option value="Luxury Room">Luxury Room</option>
              <option value="Family Suite">Family Suite</option>
            </select>
          </div>

          <div>
            <p className="mt-4 text-gray-800">
              Price <span className="text-xs">/night</span>
            </p>
            <input
              type="number"
              placeholder="0"
              className="border border-gray-300 mt-1 rounded p-2 w-24"
              value={inputs.pricePerNight}
              onChange={(e) =>
                setInputs({ ...inputs, pricePerNight: e.target.value })
              }
            />
          </div>
        </div>

        <p className="text-gray-800 mt-4">Amenities</p>
        <div className="flex flex-col flex-wrap mt-1 text-gray-400 max-w-sm">
          {Object.keys(inputs.amenities).map((amenity, index) => (
            <div key={index}>
              <input
                type="checkbox"
                id={`amenities${index + 1}`} // Use backticks for template literal
                checked={inputs.amenities[amenity]} // Correctly reference the checked value
                onChange={() =>
                  setInputs({
                    ...inputs,
                    amenities: {
                      ...inputs.amenities,
                      [amenity]: !inputs.amenities[amenity], // Toggle the checkbox value
                    },
                  })
                }
              />
              <label htmlFor={`amenities${index + 1}`}> {amenity}</label>
            </div>
          ))}
        </div>
        <button className="bg-blue-500 text-white px-8 py-2 rounded mt-8 cursor-pointer" disabled={loading || loadingRoom}>
          {loading 
            ? (isEditMode ? 'Updating...' : 'Adding...') 
            : (isEditMode ? 'Update Room' : 'Add Room')}
        </button>
        
        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate("/Owner/list-room")}
            className="bg-gray-400 text-white px-8 py-2 rounded mt-4 ml-4 cursor-pointer hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default AddRoom;
