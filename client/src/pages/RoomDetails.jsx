import { useEffect, useState } from "react";
import { assets, facilityIcons, roomCommonData,  } from "../assets/assets";
import { useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const RoomDetails = () => {
  const { id } = useParams()
  const {rooms,axios,getToken,navigate} = useAppContext();
  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null)
  const[checkInDate, setCheckInDate] = useState("")
  const[checkOutDate, setCheckOutDate] = useState("")
  const[guests, setGuests] = useState(1)

  const[isAvailable,setIsAvailable]=useState(false);
  //check is availability of the room
  const checkAvailability = async () => {
    try {
      //check is check in date is greater than check out data
      if(checkInDate >=checkOutDate){
        toast.error("Check in date should be less than  check out date");
        return;
      }
      const {data} = await axios.post("/api/bookings/check-availability",{
        room:id,
        checkInDate,
        checkOutDate,
      });

      if(data.success){
        if(data.isAvailable){
          setIsAvailable(true);
          toast.success("Room is available");
        }else{
          setIsAvailable(false);
          toast.error("Room is not available");
        }
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  // onSubmithandler function to check avilablity & book the room
  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      if(!isAvailable){
        
        return checkAvailability();
      }else{
        const {data} = await axios.post("/api/bookings/book",{
          room:id,
          checkInDate,
          checkOutDate,
          guests,paymentMethod:"Pay At Hotel"
        },{
          headers:{
            Authorization:`Bearer ${await getToken()}`
          }
        });
        if(data.success){
          toast.success(data.message);
          navigate("/my-bookings")
          scrollTo(0,0)

        }else{
          toast.error(data.message)
        }
      }
      
  
    } catch (error) {
      toast.error(error.message)
    }
  };












  useEffect(() => {
    // Find the room based on the id from URL params
    if (id && rooms.length > 0) {
      const foundRoom = rooms.find((room) => room._id === id);
      if (foundRoom) {
        setRoom(foundRoom);
        setMainImage(foundRoom.images[0]);
      }
    }
  }, [id, rooms]); 

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
      {/* Room Details */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
        <h1 className="text-3xl md:text-4xl font-playfair">
          {room.hotel.name}
          <span className="font-inter text-sm">{room.roomType}</span>
        </h1>
        <p className="text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full">
          20% OFF
        </p>
      </div>

      {/* Room Rating */}
      <div className="flex items-center gap-1 mt-2">
        <StarRating />
        <p className="ml-2">200+ reviews</p>
      </div>

      {/* Room Address */}
      <div className="flex items-center gap-1 text-gray-600 mt-2">
        <img src={assets.locationIcon} alt="location-icon" />
        <span>{room.hotel.address}</span>
      </div>

      {/* Room Images */}
      <div className="flex flex-col lg:flex-row mt-4 gap-4">
        <div className="lg:w-2/3 w-full">
          <img
            src={mainImage}
            alt="Room"
            className="w-full h-96 object-cover rounded-xl transition-all duration-300"
          />
        </div>
        <div className="lg:w-1/3 w-full">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {room?.images.length > 1 &&
              room.images.map((image, index) => (
                <img
                  onClick={() => setMainImage(image)}
                  key={index}
                  src={image}
                  alt="Room Image"
                  className={`w-full h-28 lg:h-24 object-cover rounded-xl cursor-pointer shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    mainImage === image ? "outline-2 outline outline-orange-500 scale-105" : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Room Highlights */}
      <div className="flex flex-col md:flex-row md:justify-between mt-10">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-playfair">
            Experience Luxury like Never Before{" "}
          </h1>
          <div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
            {room.amenities.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 mt-4 rounded-lg bg-gray-100"
              >
                <img src={facilityIcons[item]} alt={item} className="w-5 h-5" />
                <p className="text-xs">{item}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Room Pricing */}
        <p className="text-2xl font-medium">${room.pricePerNight}/night</p>
      </div>

      {/* Check-In / Check-Out Form */}
      <form onSubmit={onSubmitHandler}
        className="flex flex-col md:flex-row items-start md:items-center
        justify-between bg-white shadow-[0px 0px 20px_rgba(0,0,0,0.15)] p-6 rounded-xl
        mx-auto mt-16 max-w-6xl"
      >
        <div className="flex flex-col flex-wrap md:flex-row items-start md:items-center gap-4 md:gap-10 text-gray-500">
          <div className="flex flex-col">
            <label htmlFor="checkInDate" className="font-medium">
              Check In{" "}
            </label>
            <input onChange={(e)=>setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} value={checkInDate}
              type="date"
              id="checkInDate"
              placeholder="Check-in"
              className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
              required
            />
          </div>

          <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
          <div className="flex flex-col">
            <label htmlFor="checkOutDate" className="font-medium">
              Check out{" "}
            </label>
            <input onChange={(e)=>setCheckOutDate(e.target.value)} min={checkInDate || undefined} disabled={!checkInDate}
              type="date"
              id="checkOutDate"
              placeholder="Check-out"
              className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
              value={checkOutDate}
              required
            />
          </div>

          <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>

          <div className="flex flex-col">
            <label htmlFor="guests" className="font-medium">
              Guests{" "}
            </label>
            <input onChange={(e)=>setGuests(e.target.value)} value={guests}
              type="number"
              id="guests"
              placeholder="1"
              className="max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white rounded-md max-md:w-full max-md:mt-6 md:px-25 py-3 md:py-4 text-base cursor-pointer font-medium"
        >
          {isAvailable ? "Book Now":"Check Availability"}
        </button>
      </form>

      {/* Common Specifications */}
      <div className="mt-25 space-y-4">
        {roomCommonData.map((spec, index) => (
          <div key={index} className="flex items-start gap-2">
            <img src={spec.icon} alt={`${spec.title}-icon`} className="w-6.5" />
            <div>
              <p className="text-base">{spec.title}</p>
              <p className="text-gray-500">{spec.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500">
        <p>
          Guests will be allocated on the ground floor according to
          availability. You get a comfortable Two bedroom apartment with a true
          city feeling. The price quoted is for two guests; please mark the number of guests to get the exact price for groups.
        </p>
      </div>

      {/* Hosted by */}
      <div className="flex flex-col items-start gap-4">
        <div className="flex gap-4">
          {room.hotel.owner?.image ? (
            <img
              src={room.hotel.owner.image}
              alt="Host"
              className="h-14 w-14 md:h-18 md:w-18 rounded-full"
            />
          ) : (
            <div className="h-14 w-14 md:h-18 md:w-18 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-xl">{room.hotel.name?.charAt(0) || 'H'}</span>
            </div>
          )}
          <div>
            <p className="text-lg md:text-xl">Hosted by {room.hotel.name}</p>
            <div className="flex items-center mt-1">
              <StarRating />
              <p className="ml-2">200+ reviews</p>
            </div>
          </div>
        </div>
        <button className="px-6 py-2.5 mt-4 rounded text-white bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer font-medium">
          Contact Now
        </button>
      </div>
    </div>
  );
};

export default RoomDetails;