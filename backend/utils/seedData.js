// seedData.js — Seed sample data for Packages Management, Enquiry Pipeline, and Dynamic Pricing
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TravelPackage from '../models/TravelPackage.js';
import Lead from '../models/Lead.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';

dotenv.config();

const connectDB = async () => {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) throw new Error('MONGODB_URI is not set in .env');
  await mongoose.connect(baseUri, { dbName: 'SmartStayX' });
  console.log('📦 Connected to MongoDB');
};

const seedPackages = async () => {
  const existing = await TravelPackage.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️  ${existing} packages already exist — skipping package seed`);
    return;
  }

  const packages = [
    {
      title: 'Sri Lanka Heritage Escape',
      description: 'Explore the cultural triangle of Sri Lanka with guided tours of ancient cities, temples, and tea plantations. Includes luxury accommodation and private transport.',
      destination: 'Sri Lanka',
      price: 2499,
      currency: 'USD',
      durationDays: 7,
      maxGuests: 6,
      image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
      tags: ['heritage', 'culture', 'luxury', 'guided-tour'],
      items: [
        { type: 'tour', title: 'Sigiriya Rock Fortress', description: 'Guided climb of the ancient rock fortress', day: 1 },
        { type: 'tour', title: 'Dambulla Cave Temple', description: 'Visit the golden cave temple complex', day: 2 },
        { type: 'tour', title: 'Kandy Temple of the Tooth', description: 'Sacred relic temple visit', day: 3 },
        { type: 'tour', title: 'Nuwara Eliya Tea Plantation', description: 'Tea tasting and plantation tour', day: 4 },
      ],
      transport: [
        { type: 'shuttle', from: 'Airport', to: 'Sigiriya', price: 80 },
        { type: 'shuttle', from: 'Kandy', to: 'Nuwara Eliya', price: 60 },
      ],
      isActive: true,
      createdBy: 'seed-script',
    },
    {
      title: 'Maldives Overwater Paradise',
      description: 'An all-inclusive 5-night stay in an overwater villa with private pool, snorkeling excursions, and sunset dolphin cruises.',
      destination: 'Maldives',
      price: 4599,
      currency: 'USD',
      durationDays: 5,
      maxGuests: 2,
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
      tags: ['beach', 'luxury', 'all-inclusive', 'romantic'],
      items: [
        { type: 'activity', title: 'Snorkeling at Coral Reef', description: 'Guided snorkeling with marine life', day: 1 },
        { type: 'activity', title: 'Sunset Dolphin Cruise', description: 'Evening cruise to spot dolphins', day: 2 },
        { type: 'dining', title: 'Private Beach Dinner', description: 'Candlelit dinner on the beach', day: 3 },
      ],
      isActive: true,
      createdBy: 'seed-script',
    },
    {
      title: 'Dubai Luxury Experience',
      description: 'Experience the ultimate luxury in Dubai with Burj Khalifa views, desert safari, yacht cruise, and world-class shopping.',
      destination: 'Dubai',
      price: 3899,
      currency: 'USD',
      durationDays: 4,
      maxGuests: 4,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      tags: ['luxury', 'city-break', 'shopping', 'desert'],
      items: [
        { type: 'tour', title: 'Burj Khalifa Sky Deck', description: 'Observation deck at the world\'s tallest building', day: 1 },
        { type: 'activity', title: 'Desert Safari & BBQ', description: 'Dune bashing, camel ride, and dinner under the stars', day: 2 },
        { type: 'activity', title: 'Yacht Cruise', description: 'Private yacht tour of Dubai Marina and Palm Jumeirah', day: 3 },
      ],
      isActive: true,
      createdBy: 'seed-script',
    },
    {
      title: 'Bali Wellness Retreat',
      description: 'Rejuvenate with a 6-day wellness retreat in Ubud featuring yoga, spa treatments, organic cuisine, and rice terrace hikes.',
      destination: 'Bali',
      price: 1899,
      currency: 'USD',
      durationDays: 6,
      maxGuests: 8,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
      tags: ['wellness', 'yoga', 'nature', 'organic'],
      items: [
        { type: 'activity', title: 'Daily Yoga & Meditation', description: 'Morning yoga overlooking rice paddies', day: 1 },
        { type: 'activity', title: 'Tegallalang Rice Terrace Hike', description: 'Guided walk through iconic rice terraces', day: 2 },
        { type: 'spa', title: 'Balinese Massage', description: 'Traditional 90-minute spa treatment', day: 3 },
        { type: 'tour', title: 'Ubud Monkey Forest', description: 'Visit the sacred monkey sanctuary', day: 4 },
      ],
      isActive: true,
      createdBy: 'seed-script',
    },
    {
      title: 'Paris Romantic Getaway',
      description: 'A 4-day romantic escape in the City of Love with Eiffel Tower dinner cruise, Louvre tour, and Montmartre strolls.',
      destination: 'Paris',
      price: 3299,
      currency: 'USD',
      durationDays: 4,
      maxGuests: 2,
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      tags: ['romantic', 'culture', 'food', 'city-break'],
      items: [
        { type: 'tour', title: 'Eiffel Tower Summit & Dinner Cruise', description: 'Skip-the-line Eiffel Tower and Seine river dinner', day: 1 },
        { type: 'tour', title: 'Louvre Museum Guided Tour', description: 'Private tour of the world\'s largest art museum', day: 2 },
        { type: 'activity', title: 'Montmartre & Sacré-Cœur Walk', description: 'Guided walking tour of artists\' quarter', day: 3 },
      ],
      isActive: true,
      createdBy: 'seed-script',
    },
  ];

  await TravelPackage.insertMany(packages);
  console.log(`✅ Seeded ${packages.length} travel packages`);
};

const seedLeads = async () => {
  const existing = await Lead.countDocuments();
  if (existing > 0) {
    console.log(`ℹ️  ${existing} leads already exist — skipping lead seed`);
    return;
  }

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const leads = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '+1-555-0101',
      company: 'Johnson Travels',
      source: 'website',
      stage: 'new',
      priority: 'high',
      interest: 'Sri Lanka Heritage Escape',
      budget: '$2,000 - $3,000',
      travelDates: 'Dec 15 - Dec 22',
      groupSize: 4,
      notes: ['Looking for custom itinerary options', 'Prefers guided tours'],
      lastContactAt: daysAgo(1),
    },
    {
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      phone: '+65-9123-4567',
      company: 'Chen Enterprises',
      source: 'referral',
      stage: 'contacted',
      priority: 'medium',
      interest: 'Bali Wellness Retreat',
      budget: '$1,500 - $2,500',
      travelDates: 'Feb 10 - Feb 16',
      groupSize: 2,
      notes: ['Referred by previous guest', 'Sent brochure via email'],
      lastContactAt: daysAgo(3),
    },
    {
      name: 'Emily Rodriguez',
      email: 'emily.r@example.com',
      phone: '+44-7700-900123',
      company: 'Rodriguez Media',
      source: 'social',
      stage: 'qualified',
      priority: 'high',
      interest: 'Maldives Overwater Paradise',
      budget: '$4,000 - $5,000',
      travelDates: 'Mar 20 - Mar 25',
      groupSize: 2,
      notes: ['Engaged couple — honeymoon booking', 'Very interested in overwater villa', 'Requested custom meal plan'],
      lastContactAt: daysAgo(5),
    },
    {
      name: 'David Kim',
      email: 'dkim@example.com',
      phone: '+82-10-1234-5678',
      company: 'KIM Consulting',
      source: 'website',
      stage: 'proposal',
      priority: 'medium',
      interest: 'Dubai Luxury Experience',
      budget: '$3,500 - $4,500',
      travelDates: 'Apr 5 - Apr 9',
      groupSize: 3,
      notes: ['Sent proposal with upgraded villa option', 'Awaiting approval from management'],
      lastContactAt: daysAgo(7),
    },
    {
      name: 'Sophie Martin',
      email: 'sophie.m@example.com',
      phone: '+33-6-12-34-56-78',
      company: 'Martin & Co',
      source: 'email',
      stage: 'negotiation',
      priority: 'urgent',
      interest: 'Paris Romantic Getaway',
      budget: '$3,000 - $4,000',
      travelDates: 'May 14 - May 18',
      groupSize: 2,
      notes: ['Negotiating group discount for 2 couples', 'Final price agreed pending confirmation'],
      lastContactAt: daysAgo(2),
    },
    {
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.ar@example.com',
      phone: '+971-50-123-4567',
      company: 'Al-Rashid Group',
      source: 'referral',
      stage: 'won',
      priority: 'high',
      interest: 'Dubai Luxury Experience',
      budget: '$5,000+',
      travelDates: 'Jun 1 - Jun 5',
      groupSize: 6,
      notes: ['Booked premium package', 'VIP upgrade requested — confirmed', 'Paid deposit in full'],
      lastContactAt: daysAgo(10),
    },
    {
      name: 'Lisa Thompson',
      email: 'lisa.t@example.com',
      phone: '+1-555-0202',
      company: 'Thompson Family Travel',
      source: 'website',
      stage: 'lost',
      priority: 'low',
      interest: 'Sri Lanka Heritage Escape',
      budget: '$1,000 - $1,500',
      travelDates: 'Jul 8 - Jul 15',
      groupSize: 4,
      lostReason: 'Budget constraints — chose cheaper alternative',
      notes: ['Concerned about pricing', 'Recommended budget-friendly options but decided to go with competitor'],
      lastContactAt: daysAgo(14),
    },
    {
      name: 'James Wilson',
      email: 'j.wilson@example.com',
      phone: '+1-555-0303',
      company: 'Wilson Adventures',
      source: 'phone',
      stage: 'new',
      priority: 'medium',
      interest: 'General inquiry about packages',
      budget: 'Open',
      travelDates: 'Flexible',
      groupSize: 8,
      notes: ['Corporate group booking inquiry', 'Interested in team building packages'],
      lastContactAt: daysAgo(0),
    },
    {
      name: 'Priya Sharma',
      email: 'priya.s@example.com',
      phone: '+91-98765-43210',
      company: 'Sharma Hospitality',
      source: 'walk_in',
      stage: 'contacted',
      priority: 'high',
      interest: 'Custom Sri Lanka Tour',
      budget: '$3,000 - $4,000',
      travelDates: 'Aug 12 - Aug 20',
      groupSize: 4,
      notes: ['Walked in during hotel tour', 'Very impressed with property', 'Wants custom multi-city itinerary'],
      lastContactAt: daysAgo(4),
    },
    {
      name: 'Thomas Mueller',
      email: 'tm@example.com',
      phone: '+49-170-1234567',
      company: 'Mueller Reisen',
      source: 'referral',
      stage: 'qualified',
      priority: 'medium',
      interest: 'Bali Wellness Retreat',
      budget: '$1,800 - $2,200',
      travelDates: 'Sep 5 - Sep 11',
      groupSize: 2,
      notes: ['Repeat referral from partner agency', 'Prefers eco-friendly accommodations', 'Dietary requirements: vegetarian'],
      lastContactAt: daysAgo(6),
    },
  ];

  await Lead.insertMany(leads);
  console.log(`✅ Seeded ${leads.length} leads/enquiries`);
};

const DEMO_OWNER_ID = 'demo-owner-id';

const seedHotelAndRoomInventory = async () => {
  const existingRooms = await Room.countDocuments();
  if (existingRooms > 0) {
    console.log(`ℹ️  ${existingRooms} rooms already exist — skipping room inventory seed`);
    return;
  }

  const hotels = await Hotel.find({ owner: DEMO_OWNER_ID });
  let inventoryHotels = hotels;

  if (inventoryHotels.length === 0) {
    inventoryHotels = await Hotel.insertMany([
      {
        name: 'Grand Ocean Resort',
        address: '42 Beachfront Avenue',
        contact: '+94-11-234-5678',
        owner: DEMO_OWNER_ID,
        city: 'Colombo',
        description: 'A luxury beachfront resort with ocean views, an infinity pool, and signature dining.',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
        pricingRules: {
          weekendSurcharge: 0.15,
          highOccupancyThreshold: 0.8,
          highOccupancySurcharge: 0.1,
          lastMinuteDiscount: 0.1,
          earlyBirdWindowDays: 14,
          earlyBirdDiscount: 0.12,
          repeatGuestDiscount: 0.08,
        },
      },
      {
        name: 'Mountain View Lodge',
        address: '78 Hilltop Road',
        contact: '+94-81-345-6789',
        owner: DEMO_OWNER_ID,
        city: 'Kandy',
        description: 'A boutique hill-country lodge with panoramic mountain views and wellness experiences.',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
        pricingRules: {
          weekendSurcharge: 0.1,
          highOccupancyThreshold: 0.75,
          highOccupancySurcharge: 0.08,
          lastMinuteDiscount: 0.15,
          earlyBirdWindowDays: 21,
          earlyBirdDiscount: 0.15,
          repeatGuestDiscount: 0.1,
        },
      },
      {
        name: 'Heritage City Hotel',
        address: '11 Fort Street',
        contact: '+94-11-555-1122',
        owner: DEMO_OWNER_ID,
        city: 'Galle',
        description: 'A refined city hotel near historic sites, shopping, and the sea promenade.',
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        pricingRules: {
          weekendSurcharge: 0.12,
          highOccupancyThreshold: 0.72,
          highOccupancySurcharge: 0.09,
          lastMinuteDiscount: 0.08,
          earlyBirdWindowDays: 18,
          earlyBirdDiscount: 0.1,
          repeatGuestDiscount: 0.06,
        },
      },
    ]);
    console.log(`✅ Created ${inventoryHotels.length} demo hotels for room inventory`);
  }

  const roomData = [
    // Grand Ocean Resort
    { hotel: inventoryHotels[0]._id, hotelName: inventoryHotels[0].name, hotelAddress: inventoryHotels[0].address, hotelCity: inventoryHotels[0].city, roomNumber: 'GOR-101', roomType: 'Deluxe Ocean View', pricePerNight: 250, amenities: ['King Bed', 'Ocean View', 'AC', 'Mini Bar', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'], isAvailable: true },
    { hotel: inventoryHotels[0]._id, hotelName: inventoryHotels[0].name, hotelAddress: inventoryHotels[0].address, hotelCity: inventoryHotels[0].city, roomNumber: 'GOR-102', roomType: 'Deluxe Ocean View', pricePerNight: 250, amenities: ['King Bed', 'Ocean View', 'AC', 'Mini Bar', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'], isAvailable: true },
    { hotel: inventoryHotels[0]._id, hotelName: inventoryHotels[0].name, hotelAddress: inventoryHotels[0].address, hotelCity: inventoryHotels[0].city, roomNumber: 'GOR-201', roomType: 'Premium Suite', pricePerNight: 450, amenities: ['King Bed', 'Ocean View', 'Living Room', 'Jacuzzi', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Balcony'], images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'], isAvailable: true },
    { hotel: inventoryHotels[0]._id, hotelName: inventoryHotels[0].name, hotelAddress: inventoryHotels[0].address, hotelCity: inventoryHotels[0].city, roomNumber: 'GOR-301', roomType: 'Presidential Penthouse', pricePerNight: 850, amenities: ['King Bed', 'Panoramic View', 'Living Room', 'Dining Area', 'Jacuzzi', 'Private Pool', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Balcony', 'Butler Service'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'], isAvailable: true },
    { hotel: inventoryHotels[0]._id, hotelName: inventoryHotels[0].name, hotelAddress: inventoryHotels[0].address, hotelCity: inventoryHotels[0].city, roomNumber: 'GOR-401', roomType: 'Standard Room', pricePerNight: 150, amenities: ['Queen Bed', 'City View', 'AC', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'], isAvailable: true },
    // Mountain View Lodge
    { hotel: inventoryHotels[1]._id, hotelName: inventoryHotels[1].name, hotelAddress: inventoryHotels[1].address, hotelCity: inventoryHotels[1].city, roomNumber: 'MVL-101', roomType: 'Mountain View Room', pricePerNight: 180, amenities: ['Queen Bed', 'Mountain View', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Tea Station'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'], isAvailable: true },
    { hotel: inventoryHotels[1]._id, hotelName: inventoryHotels[1].name, hotelAddress: inventoryHotels[1].address, hotelCity: inventoryHotels[1].city, roomNumber: 'MVL-102', roomType: 'Mountain View Room', pricePerNight: 180, amenities: ['Queen Bed', 'Mountain View', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Tea Station'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'], isAvailable: true },
    { hotel: inventoryHotels[1]._id, hotelName: inventoryHotels[1].name, hotelAddress: inventoryHotels[1].address, hotelCity: inventoryHotels[1].city, roomNumber: 'MVL-201', roomType: 'Garden Suite', pricePerNight: 320, amenities: ['King Bed', 'Garden View', 'Living Room', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Private Garden', 'Fireplace'], images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'], isAvailable: true },
    { hotel: inventoryHotels[1]._id, hotelName: inventoryHotels[1].name, hotelAddress: inventoryHotels[1].address, hotelCity: inventoryHotels[1].city, roomNumber: 'MVL-301', roomType: 'Family Suite', pricePerNight: 280, amenities: ['2 Queen Beds', 'Mountain View', 'Living Room', 'Kitchenette', 'AC', 'WiFi', 'TV', 'Balcony'], images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'], isAvailable: true },
    // Heritage City Hotel
    { hotel: inventoryHotels[2]._id, hotelName: inventoryHotels[2].name, hotelAddress: inventoryHotels[2].address, hotelCity: inventoryHotels[2].city, roomNumber: 'HCH-101', roomType: 'Heritage Standard', pricePerNight: 140, amenities: ['Queen Bed', 'City View', 'AC', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'], isAvailable: true },
    { hotel: inventoryHotels[2]._id, hotelName: inventoryHotels[2].name, hotelAddress: inventoryHotels[2].address, hotelCity: inventoryHotels[2].city, roomNumber: 'HCH-201', roomType: 'City Deluxe', pricePerNight: 210, amenities: ['King Bed', 'City View', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Desk'], images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800'], isAvailable: true },
    { hotel: inventoryHotels[2]._id, hotelName: inventoryHotels[2].name, hotelAddress: inventoryHotels[2].address, hotelCity: inventoryHotels[2].city, roomNumber: 'HCH-301', roomType: 'Executive Suite', pricePerNight: 330, amenities: ['King Bed', 'Lounge Area', 'Balcony', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Bathtub'], images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'], isAvailable: true },
  ];

  await Room.insertMany(roomData);
  console.log(`✅ Seeded ${roomData.length} hotel rooms`);
};

const seedPricingDemoData = async () => {
  // First check if we already have hotels (skip if demo is already seeded)
  const hotelCount = await Hotel.countDocuments({ owner: DEMO_OWNER_ID });
  if (hotelCount > 0) {
    console.log(`ℹ️  ${hotelCount} demo hotels already exist — skipping pricing demo seed`);
    return;
  }

  console.log('🏨 Creating demo hotels, rooms, and bookings for Dynamic Pricing...');

  // Create 2 demo hotels
  const hotels = await Hotel.insertMany([
    {
      name: 'Grand Ocean Resort',
      address: '42 Beachfront Avenue',
      contact: '+94-11-234-5678',
      owner: DEMO_OWNER_ID,
      city: 'Colombo',
      description: 'A luxury beachfront resort with stunning ocean views, infinity pool, and world-class dining. Perfect for both leisure and business travelers.',
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
      pricingRules: {
        weekendSurcharge: 0.15,
        highOccupancyThreshold: 0.8,
        highOccupancySurcharge: 0.10,
        lastMinuteDiscount: 0.10,
        earlyBirdWindowDays: 14,
        earlyBirdDiscount: 0.12,
        repeatGuestDiscount: 0.08,
      },
    },
    {
      name: 'Mountain View Lodge',
      address: '78 Hilltop Road',
      contact: '+94-81-345-6789',
      owner: DEMO_OWNER_ID,
      city: 'Kandy',
      description: 'Nestled in the lush hills of Kandy, this boutique lodge offers panoramic mountain views, organic cuisine, and serene wellness experiences.',
      currency: 'USD',
      image: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
      pricingRules: {
        weekendSurcharge: 0.10,
        highOccupancyThreshold: 0.75,
        highOccupancySurcharge: 0.08,
        lastMinuteDiscount: 0.15,
        earlyBirdWindowDays: 21,
        earlyBirdDiscount: 0.15,
        repeatGuestDiscount: 0.10,
      },
    },
  ]);
  console.log(`✅ Created ${hotels.length} demo hotels`);

  // Create rooms for each hotel
  const roomData = [
    // Grand Ocean Resort rooms
    { hotel: hotels[0]._id, hotelName: hotels[0].name, hotelCity: hotels[0].city, hotelAddress: hotels[0].address, roomNumber: 'GOR-101', roomType: 'Deluxe Ocean View', pricePerNight: 250, amenities: ['King Bed', 'Ocean View', 'AC', 'Mini Bar', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'] },
    { hotel: hotels[0]._id, hotelName: hotels[0].name, hotelCity: hotels[0].city, hotelAddress: hotels[0].address, roomNumber: 'GOR-102', roomType: 'Deluxe Ocean View', pricePerNight: 250, amenities: ['King Bed', 'Ocean View', 'AC', 'Mini Bar', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'] },
    { hotel: hotels[0]._id, hotelName: hotels[0].name, hotelCity: hotels[0].city, hotelAddress: hotels[0].address, roomNumber: 'GOR-201', roomType: 'Premium Suite', pricePerNight: 450, amenities: ['King Bed', 'Ocean View', 'Living Room', 'Jacuzzi', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Balcony'], images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'] },
    { hotel: hotels[0]._id, hotelName: hotels[0].name, hotelCity: hotels[0].city, hotelAddress: hotels[0].address, roomNumber: 'GOR-301', roomType: 'Presidential Penthouse', pricePerNight: 850, amenities: ['King Bed', 'Panoramic View', 'Living Room', 'Dining Area', 'Jacuzzi', 'Private Pool', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Balcony', 'Butler Service'], images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'] },
    { hotel: hotels[0]._id, hotelName: hotels[0].name, hotelCity: hotels[0].city, hotelAddress: hotels[0].address, roomNumber: 'GOR-401', roomType: 'Standard Room', pricePerNight: 150, amenities: ['Queen Bed', 'City View', 'AC', 'WiFi', 'TV'], images: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'] },
    // Mountain View Lodge rooms
    { hotel: hotels[1]._id, hotelName: hotels[1].name, hotelCity: hotels[1].city, hotelAddress: hotels[1].address, roomNumber: 'MVL-101', roomType: 'Mountain View Room', pricePerNight: 180, amenities: ['Queen Bed', 'Mountain View', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Tea Station'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'] },
    { hotel: hotels[1]._id, hotelName: hotels[1].name, hotelCity: hotels[1].city, hotelAddress: hotels[1].address, roomNumber: 'MVL-102', roomType: 'Mountain View Room', pricePerNight: 180, amenities: ['Queen Bed', 'Mountain View', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Tea Station'], images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'] },
    { hotel: hotels[1]._id, hotelName: hotels[1].name, hotelCity: hotels[1].city, hotelAddress: hotels[1].address, roomNumber: 'MVL-201', roomType: 'Garden Suite', pricePerNight: 320, amenities: ['King Bed', 'Garden View', 'Living Room', 'AC', 'Mini Bar', 'WiFi', 'TV', 'Private Garden', 'Fireplace'], images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'] },
    { hotel: hotels[1]._id, hotelName: hotels[1].name, hotelCity: hotels[1].city, hotelAddress: hotels[1].address, roomNumber: 'MVL-301', roomType: 'Family Suite', pricePerNight: 280, amenities: ['2 Queen Beds', 'Mountain View', 'Living Room', 'Kitchenette', 'AC', 'WiFi', 'TV', 'Balcony'], images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'] },
  ];

  const rooms = await Room.insertMany(roomData);
  console.log(`✅ Created ${rooms.length} demo rooms`);

  // Create historical bookings for pricing analysis
  const now = new Date();
  const statuses = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT];
  const bookings = [];

  rooms.forEach((room, idx) => {
    // 4-8 bookings per room with varied dates
    const numBookings = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numBookings; i++) {
      const daysAgo = 5 + Math.floor(Math.random() * 85);
      const stayLength = 1 + Math.floor(Math.random() * 5);
      const checkIn = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const checkOut = new Date(checkIn.getTime() + stayLength * 24 * 60 * 60 * 1000);
      const totalPrice = Math.round(room.pricePerNight * stayLength * (0.85 + Math.random() * 0.3));

      bookings.push({
        user: DEMO_OWNER_ID,
        room: room._id,
        hotel: room.hotel,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights: stayLength,
        totalPrice,
        guests: 1 + Math.floor(Math.random() * 3),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'Pay At Hotel',
        isPaid: Math.random() > 0.3,
      });
    }
  });

  await Booking.insertMany(bookings);
  console.log(`✅ Created ${bookings.length} historical bookings for pricing analysis`);

  // Log confidence level info
  const total = bookings.length;
  const confidence = total > 20 ? 'high 🔥' : total > 5 ? 'medium 📊' : 'low 📉';
  console.log(`   → ${total} bookings → confidence level: ${confidence}`);
};

const seed = async () => {
  try {
    await connectDB();
    console.log('\n🚀 Seeding data...\n');

    await seedPackages();
    await seedLeads();
    await seedHotelAndRoomInventory();
    await seedPricingDemoData();

    console.log('\n🎉 Seed complete! You can now view the data in the dashboard.');
    console.log('   → Packages Management: /Owner/packages');
    console.log('   → Enquiry Pipeline: /Owner/enquiries');
    console.log('   → Dynamic Pricing: /Owner/pricing — select a hotel and click "Analyse"');
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Disconnected from MongoDB\n');
  }
};

seed();
