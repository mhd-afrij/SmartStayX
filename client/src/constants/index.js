export const ROOM_TYPES = [
  { value: "standard", label: "Standard", description: "Basic amenities, comfortable stay" },
  { value: "deluxe", label: "Deluxe", description: "Upgraded amenities, extra comfort" },
  { value: "suite", label: "Suite", description: "Spacious with separate living area" },
  { value: "family", label: "Family", description: "Large rooms for families" },
  { value: "executive", label: "Executive", description: "Business amenities, work space" },
  { value: "penthouse", label: "Penthouse", description: "Luxury top-floor accommodation" },
];

export const PRICE_RANGES = [
  { min: 0, max: 100, label: "Budget" },
  { min: 100, max: 200, label: "Economy" },
  { min: 200, max: 300, label: "Mid-Range" },
  { min: 300, max: 400, label: "Upscale" },
  { min: 400, max: 500, label: "Luxury" },
];

export const AMENITIES = {
  wifi: { label: "Free WiFi", icon: "wifi" },
  parking: { label: "Free Parking", icon: "parking" },
  pool: { label: "Swimming Pool", icon: "pool" },
  gym: { label: "Fitness Center", icon: "gym" },
  spa: { label: "Spa", icon: "spa" },
  restaurant: { label: "Restaurant", icon: "restaurant" },
  roomService: { label: "Room Service", icon: "roomService" },
  AC: { label: "Air Conditioning", icon: "ac" },
  laundry: { label: "Laundry", icon: "laundry" },
  beachAccess: { label: "Beach Access", icon: "beach" },
  airportTransfer: { label: "Airport Transfer", icon: "transfer" },
  petFriendly: { label: "Pet Friendly", icon: "pet" },
};

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
};

export const USER_ROLES = {
  USER: "user",
  HOTEL_OWNER: "hotelOwner",
  ADMIN: "admin",
};

export const DATE_FORMATS = {
  short: "MMM DD, YYYY",
  long: "MMMM DD, YYYY",
  datetime: "MMM DD, YYYY HH:mm",
  time: "HH:mm",
};

export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

export const IMAGE_CONFIG = {
  maxSize: 5242880,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxWidth: 1920,
  maxHeight: 1080,
};

export const VALIDATION_RULES = {
  roomName: { minLength: 2, maxLength: 100 },
  description: { minLength: 10, maxLength: 1000 },
  price: { min: 0, max: 100000 },
  guestCapacity: { min: 1, max: 20 },
};

export const FILTER_OPTIONS = {
  sortBy: [
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Rating" },
    { value: "newest", label: "Newest" },
  ],
};

export const HOTEL_CATEGORIES = [
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "hostel", label: "Hostel" },
];

export const EXPERIENCE_TYPES = [
  { value: "adventure", label: "Adventure" },
  { value: "cultural", label: "Cultural" },
  { value: "culinary", label: "Culinary" },
  { value: "wellness", label: "Wellness" },
  { value: "nature", label: "Nature" },
  { value: "nightlife", label: "Nightlife" },
];

export const getAmenityLabel = (key) => AMENITIES[key]?.label || key;
export const getRoomTypeLabel = (value) => ROOM_TYPES.find(t => t.value === value)?.label || value;
export const getPriceRangeLabel = (min, max) => PRICE_RANGES.find(p => p.min === min && p.max === max)?.label || `$${min}-${max}`;