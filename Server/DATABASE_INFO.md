# Database Connection Details

## MongoDB Connection Information

### Connection String
```
mongodb+srv://stayx:stayx123@cluster0.5xyvwpc.mongodb.net/SmartStayX
```

**Note:** The connection string is stored in `Server/.env` file as `MONGODB_URI`

### Database Name
**`SmartStayX`**

The database name is appended to the connection string in `Server/configs/db.js`:
```javascript
await mongoose.connect(`${process.env.MONGODB_URI}/SmartStayX`);
```

### Connection Configuration
- **Location:** `Server/configs/db.js`
- **Connection Method:** Mongoose (MongoDB ODM)
- **Connection Type:** MongoDB Atlas (Cloud)
- **Cluster:** cluster0.5xyvwpc.mongodb.net

---

## Collections (Tables) in Database

### 1. **users** Collection
**Model:** `User` (`Server/models/User.js`)

**Schema Fields:**
- `_id` (String, required) - User ID from Clerk
- `name` (String, required) - User's full name
- `username` (String, required) - Username
- `email` (String, required) - Email address
- `image` (String, required) - Profile image URL
- `role` (String, enum: ["user", "hotelOwner"], default: "user")
- `recentSearchedCities` (Array of Strings)
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

---

### 2. **hotels** Collection
**Model:** `Hotel` (`Server/models/Hotel.js`)

**Schema Fields:**
- `_id` (ObjectId, auto-generated)
- `name` (String, required) - Hotel name
- `address` (String, required) - Hotel address
- `contact` (String, required) - Contact information
- `owner` (String, required, ref: "User") - Owner's user ID
- `city` (String, required) - City location
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

---

### 3. **rooms** Collection
**Model:** `Room` (`Server/models/Room.js`)

**Schema Fields:**
- `_id` (ObjectId, auto-generated)
- `hotel` (String, required, ref: "Hotel") - Hotel ID
- `roomType` (String, required) - Type of room
- `pricePerNight` (Number, required) - Price per night
- `amenities` (Array, required) - List of amenities
- `images` (Array of Strings) - Room images
- `isAvailable` (Boolean, default: true) - Availability status
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

---

### 4. **bookings** Collection
**Model:** `Booking` (`Server/models/Booking.js`)

**Schema Fields:**
- `_id` (ObjectId, auto-generated)
- `user` (String, required, ref: "User") - User ID
- `room` (String, required, ref: "room") - Room ID
- `hotel` (String, required, ref: "Hotel") - Hotel ID
- `checkInDate` (Date, required) - Check-in date
- `checkOutDate` (Date, required) - Check-out date
- `totalPrice` (Number, required) - Total booking price
- `guests` (Number, required) - Number of guests
- `status` (String, enum: ["pending", "confirmed", "cancelled"], default: "pending")
- `paymentMethod` (String, required, default: "Pay At Hotel")
- `isPaid` (Boolean, default: false) - Payment status
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

---

## Connection Status

To check if the database is connected:

1. **Start the server:**
   ```bash
   cd Server
   npm run server
   ```

2. **Look for these console messages:**
   - ✅ `Database Connected`
   - ✅ `Database connected successfully`

3. **If connection fails, you'll see:**
   - ❌ `Error connecting to the database [error details]`

---

## Database Relationships

```
User (1) ──< (many) Hotel
Hotel (1) ──< (many) Room
User (1) ──< (many) Booking
Room (1) ──< (many) Booking
Hotel (1) ──< (many) Booking
```

---

## Environment Variables Required

Make sure your `Server/.env` file contains:

```env
MONGODB_URI=mongodb+srv://stayx:stayx123@cluster0.5xyvwpc.mongodb.net
PORT=3000
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

---

## Testing Connection

You can test the connection by:

1. **Starting the server** - Connection is attempted automatically
2. **Making an API call** - Any API endpoint that uses the database
3. **Checking MongoDB Atlas Dashboard** - View collections and documents

---

## Security Note

⚠️ **Important:** The connection string contains credentials. Make sure:
- `.env` file is in `.gitignore`
- Never commit credentials to version control
- Use environment variables in production

