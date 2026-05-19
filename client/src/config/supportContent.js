import { config } from "./ConfigManager";

export const SUPPORT_EMAIL = config.get("business.supportEmail");

export const CHATBOT_LOCAL_RESPONSES = {
  booking: "To book a room, browse our available properties, select your dates, and click 'Book Now'. You'll need to be logged in to complete the booking.",
  cancel: "You can cancel your bookings from 'My Bookings' page up to 48 hours before check-in for a full refund.",
  payment: "We accept all major credit cards, debit cards, and online payment methods. Payments are processed securely.",
  rooms: "We offer various room types including Standard Rooms, Deluxe Rooms, and Premium Suites. Each comes with unique amenities.",
  amenities: "Our properties feature amenities like Free WiFi, Free Breakfast, Room Service, Pool Access, and more. Check individual property pages for specific details.",
  location: "You can search for rooms by city or location using our search feature on the homepage.",
  price: "Room prices vary based on location, room type, and season. Use our filter options to find properties within your budget.",
  owner: "Are you a hotel owner? Click 'Register as Hotel Owner' to list your properties and manage bookings.",
  contact: `For support, please visit our contact page or email us at ${SUPPORT_EMAIL}`,
  experience: "Check out our 'Experience' page to discover amazing activities and adventures at your destination!",
  account: "You can manage your account settings, view bookings, and update your profile from your user dashboard.",
};
