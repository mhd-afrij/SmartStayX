import logoUrl from "./logo.png";

export const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%230d1728' width='400' height='300'/%3E%3Ctext fill='%23ffffff40' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export const assets = {
  logo: logoUrl,
  regImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
  roomImg1: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop",
  roomImg2: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop",
  roomImg3: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop",
  roomImg4: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
  exclusiveOfferCardImg1: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop",
  exclusiveOfferCardImg2: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop",
  exclusiveOfferCardImg3: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
};

export const cities = [
  "Maldives",
  "Dubai",
  "Bali",
  "Tokyo",
  "Switzerland",
  "New York",
  "Singapore",
  "Paris",
  "Sri Lanka",
];

export const destinationLocaleConfig = {
  "Maldives": { languageCode: "en", language: "Dhivehi, English", currencyCode: "MVR", currency: "Maldivian Rufiyaa" },
  "Dubai": { languageCode: "ar", language: "Arabic, English", currencyCode: "AED", currency: "United Arab Emirates Dirham" },
  "Bali": { languageCode: "id", language: "Indonesian, English", currencyCode: "IDR", currency: "Indonesian Rupiah" },
  "Tokyo": { languageCode: "ja", language: "Japanese, English", currencyCode: "JPY", currency: "Japanese Yen" },
  "Switzerland": { languageCode: "de", language: "German, French, Italian, English", currencyCode: "CHF", currency: "Swiss Franc" },
  "Singapore": { languageCode: "en", language: "English, Malay, Mandarin, Tamil", currencyCode: "SGD", currency: "Singapore Dollar" },
  "New York": { languageCode: "en", language: "English", currencyCode: "USD", currency: "US Dollar" },
  "London": { languageCode: "en", language: "English", currencyCode: "GBP", currency: "British Pound Sterling" },
  "Paris": { languageCode: "fr", language: "French, English", currencyCode: "EUR", currency: "Euro" },
  "Sri Lanka": { languageCode: "si", language: "Sinhala, Tamil, English", currencyCode: "LKR", currency: "Sri Lankan Rupee" },
};

export const testimonials = [
  { id: 1, name: "Emma Rodriguez", address: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", rating: 5, review: "I've used many booking platforms before, but none compare to the personalized experience and attention to detail that SmartStayX provides." },
  { id: 2, name: "Liam Johnson", address: "New York, USA", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", rating: 4, review: "SmartStayX exceeded my expectations. The booking process was seamless, and the hotels were absolutely top-notch. Highly recommended!" },
  { id: 3, name: "Sophia Lee", address: "Seoul, South Korea", image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=200", rating: 5, review: "Amazing service! I always find the best luxury accommodations through SmartStayX. Their recommendations never disappoint!" },
];

export const roomCommonData = [
  { title: "Clean & Safe Stay", description: "A well-maintained and hygienic space just for you." },
  { title: "Enhanced Cleaning", description: "This host follows Staybnb's strict cleaning standards." },
  { title: "Excellent Location", description: "90% of guests rated the location 5 stars." },
  { title: "Smooth Check-In", description: "100% of guests gave check-in a 5-star rating." },
];
