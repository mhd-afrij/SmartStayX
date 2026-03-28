import ServiceRequest from "../models/ServiceRequest.js";
import Staff from "../models/Staff.js";
import Booking from "../models/Booking.js";

// API to request service (Guest)
export const requestService = async (req, res) => {
    try {
        const { serviceType, requestDetails, roomId, hotelId } = req.body;
        const guestId = req.user._id;

        // Verify active booking
        const activeBooking = await Booking.findOne({
            user: guestId,
            room: roomId,
            hotel: hotelId,
            status: "confirmed"
        });

        if (!activeBooking) {
            return res.json({ success: false, message: "No active booking found for this room/hotel." });
        }

        // --- Automated Staff Assignment Algorithm ---
        // 1. Map serviceType to Staff Role
        const roleMap = {
            "Housekeeping": "Housekeeping",
            "Maintenance": "Maintenance",
            "Room Service": "Room Service",
            "Other": "Front Desk"
        };
        const requiredRole = roleMap[serviceType] || "Front Desk";

        // 2. Find available staff with "Least Busy" logic
        const availableStaff = await Staff.find({
            hotel: hotelId,
            role: requiredRole,
            isAvailable: true
        });

        // 3. Sort by workload (number of assigned requests)
        availableStaff.sort((a, b) => a.assignedRequests.length - b.assignedRequests.length);

        const assignedStaff = availableStaff.length > 0 ? availableStaff[0] : null;

        const newRequest = await ServiceRequest.create({
            guest: guestId,
            hotel: hotelId,
            room: roomId,
            serviceType,
            requestDetails,
            status: assignedStaff ? "assigned" : "pending",
            staffAssigned: assignedStaff ? assignedStaff._id : null
        });

        // Update staff workload if assigned
        if (assignedStaff) {
            assignedStaff.assignedRequests.push(newRequest._id);
            await assignedStaff.save();
        }

        res.json({ 
            success: true, 
            message: assignedStaff ? `Request assigned to ${assignedStaff.name}` : "Request received and pending assignment.",
            requestId: newRequest._id
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to mark service as completed
export const updateServiceStatus = async (req, res) => {
    try {
        const { requestId, status } = req.body; // status: completed or cancelled
        
        const request = await ServiceRequest.findById(requestId);
        if (!request) return res.json({ success: false, message: "Request not found" });

        if (status === "completed") {
            request.status = "completed";
            request.completedAt = new Date();
            
            // Performance tracking: Calculate delay if it took > 60 mins
            const durationMs = request.completedAt - request.requestedAt;
            const durationMin = Math.floor(durationMs / 60000);
            if (durationMin > 60) {
                request.delayMinutes = durationMin - 60;
            }
            
            // Free up the staff member
            if (request.staffAssigned) {
                await Staff.findByIdAndUpdate(request.staffAssigned, {
                    $pull: { assignedRequests: request._id }
                });
            }
        } else if (status === "cancelled") {
            request.status = "cancelled";
            if (request.staffAssigned) {
                await Staff.findByIdAndUpdate(request.staffAssigned, {
                    $pull: { assignedRequests: request._id }
                });
            }
        }

        await request.save();
        res.json({ success: true, message: `Service marked as ${status}` });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API to get service history for owner dashboard
export const getHotelServiceHistory = async (req, res) => {
    try {
        const { hotelId } = req.query;
        // Verify owner permissions here normally

        const history = await ServiceRequest.find({ hotel: hotelId })
            .populate("staffAssigned room guest")
            .sort({ createdAt: -1 });

        res.json({ success: true, history });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Staff CRUD for Owners
export const addStaff = async (req, res) => {
    try {
        const { name, role, hotelId } = req.body;
        const staff = await Staff.create({ name, role, hotel: hotelId });
        res.json({ success: true, staff });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
