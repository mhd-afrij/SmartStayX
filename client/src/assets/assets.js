import logo from './logo.png'
import searchIcon from './searchIcon.svg'
import userIcon from './userIcon.svg'
import calenderIcon from './calenderIcon.svg'
import locationIcon from './locationIcon.svg'
import starIconFilled from './starIconFilled.svg'
import arrowIcon from './arrowIcon.svg'
import starIconOutlined from './starIconOutlined.svg'
import instagramIcon from './instagramIcon.svg'
import facebookIcon from './facebookIcon.svg'
import twitterIcon from './twitterIcon.svg'
import linkendinIcon from './linkendinIcon.svg'
import freeWifiIcon from './freeWifiIcon.svg'
import freeBreakfastIcon from './freeBreakfastIcon.svg'
import roomServiceIcon from './roomServiceIcon.svg'
import mountainIcon from './mountainIcon.svg'
import poolIcon from './poolIcon.svg'
import homeIcon from './homeIcon.svg'
import closeIcon from './closeIcon.svg'
import locationFilledIcon from './locationFilledIcon.svg'
import heartIcon from './heartIcon.svg'
import badgeIcon from './badgeIcon.svg'
import paymentIcon from './payment.svg'
import menuIcon from './menuIcon.svg'
import closeMenu from './closeMenu.svg'
import guestsIcon from './guestsIcon.svg'
import roomImg1 from './roomImg1.png'
import roomImg2 from './roomImg2.png'
import roomImg3 from './roomImg3.png'
import roomImg4 from './roomImg4.png'
import regImage from './regImage.png'
import exclusiveOfferCardImg1 from "./exclusiveOfferCardImg1.png";
import exclusiveOfferCardImg2 from "./exclusiveOfferCardImg2.png";
import exclusiveOfferCardImg3 from "./exclusiveOfferCardImg3.png";
import addIcon from "./addIcon.svg";
import dashboardIcon from "./dashboardIcon.svg";
import listIcon from "./listIcon.svg";
import uploadArea from "./uploadArea.svg";
import totalBookingIcon from "./totalBookingIcon.svg";
import totalRevenueIcon from "./totalRevenueIcon.svg";


export const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%230d1728' width='400' height='300'/%3E%3Ctext fill='%23ffffff40' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export const assets = {
    logo,
    searchIcon,
    userIcon,
    calenderIcon,
    locationIcon,
    starIconFilled,
    arrowIcon,
    starIconOutlined,
    instagramIcon,
    facebookIcon,
    twitterIcon,
    linkendinIcon,
    freeWifiIcon,
    freeBreakfastIcon,
    roomServiceIcon,
    mountainIcon,
    poolIcon,
    closeIcon,
    homeIcon,
    locationFilledIcon,
    heartIcon,
    badgeIcon,
    menuIcon,
    closeMenu,
    guestsIcon,
    regImage,
    addIcon,
    dashboardIcon,
    listIcon,
    uploadArea,
    totalBookingIcon,
    totalRevenueIcon,
    paymentIcon,
}

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
    "Maldives": {
        languageCode: "en",
        language: "Dhivehi, English",
        currencyCode: "MVR",
        currency: "Maldivian Rufiyaa",
    },
    "Dubai": {
        languageCode: "ar",
        language: "Arabic, English",
        currencyCode: "AED",
        currency: "United Arab Emirates Dirham",
    },
    "Bali": {
        languageCode: "id",
        language: "Indonesian, English",
        currencyCode: "IDR",
        currency: "Indonesian Rupiah",
    },
    "Tokyo": {
        languageCode: "ja",
        language: "Japanese, English",
        currencyCode: "JPY",
        currency: "Japanese Yen",
    },
    "Switzerland": {
        languageCode: "de",
        language: "German, French, Italian, English",
        currencyCode: "CHF",
        currency: "Swiss Franc",
    },
    "Singapore": {
        languageCode: "en",
        language: "English, Malay, Mandarin, Tamil",
        currencyCode: "SGD",
        currency: "Singapore Dollar",
    },
    "New York": {
        languageCode: "en",
        language: "English",
        currencyCode: "USD",
        currency: "US Dollar",
    },
    "London": {
        languageCode: "en",
        language: "English",
        currencyCode: "GBP",
        currency: "British Pound Sterling",
    },
    "Paris": {
        languageCode: "fr",
        language: "French, English",
        currencyCode: "EUR",
        currency: "Euro",
    },
    "Sri Lanka": {
        languageCode: "si",
        language: "Sinhala, Tamil, English",
        currencyCode: "LKR",
        currency: "Sri Lankan Rupee",
    },
};

// Facility Icon
export const facilityIcons = {
    "Free Wifi": assets.freeWifiIcon,
    "Free Breakfast": assets.freeBreakfastIcon,
    "Room Service": assets.roomServiceIcon,
    "Mountain View": assets.mountainIcon,
    "Pool Access": assets.poolIcon,
};

// Testimonials Data
export const testimonials = [
    { id: 1, name: "Emma Rodriguez", address: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", rating: 5, review: "I've used many booking platforms before, but none compare to the personalized experience and attention to detail that SmartStayX provides." },
    { id: 2, name: "Liam Johnson", address: "New York, USA", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200", rating: 4, review: "SmartStayX exceeded my expectations. The booking process was seamless, and the hotels were absolutely top-notch. Highly recommended!" },
    { id: 3, name: "Sophia Lee", address: "Seoul, South Korea", image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=200", rating: 5, review: "Amazing service! I always find the best luxury accommodations through SmartStayX. Their recommendations never disappoint!" }
];

// Room Common Data
export const roomCommonData = [
    { icon: assets.homeIcon, title: "Clean & Safe Stay", description: "A well-maintained and hygienic space just for you." },
    { icon: assets.badgeIcon, title: "Enhanced Cleaning", description: "This host follows Staybnb's strict cleaning standards." },
    { icon: assets.locationFilledIcon, title: "Excellent Location", description: "90% of guests rated the location 5 stars." },
    { icon: assets.heartIcon, title: "Smooth Check-In", description: "100% of guests gave check-in a 5-star rating." },
];