// invoiceService.js — Invoice generation, PDF creation, and download service
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";

class InvoiceService {
  async generateInvoice(bookingId) {
    const booking = await Booking.findById(bookingId)
      .populate("room", "roomType roomNumber pricePerNight amenities")
      .populate("hotel", "name address city contact email")
      .populate("user", "name email username")
      .lean();

    if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });

    const invoiceNumber = `INV-${booking._id.toString().slice(-8).toUpperCase()}-${new Date(booking.createdAt).getFullYear()}`;

    return {
      invoiceNumber,
      invoiceDate: booking.createdAt,
      dueDate: booking.checkInDate,
      hotel: {
        name: booking.hotel?.name || "StayX Hotel",
        address: booking.hotel?.address || "",
        city: booking.hotel?.city || "",
        email: booking.hotel?.email || "",
      },
      guest: {
        name: booking.user?.name || booking.guestDisplayName || "Guest",
        email: booking.user?.email || booking.guestEmail || "",
      },
      booking: {
        id: booking._id,
        roomType: booking.room?.roomType || "",
        roomNumber: booking.room?.roomNumber || booking.roomNumber || "",
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nights: booking.nights,
        guests: booking.guests,
      },
      pricing: {
        basePricePerNight: booking.basePricePerNight || 0,
        dynamicPricePerNight: booking.dynamicPricePerNight || 0,
        nights: booking.nights || 0,
        subtotal: (booking.dynamicPricePerNight || 0) * (booking.nights || 0),
        totalPrice: booking.totalPrice || 0,
        isPaid: booking.isPaid,
        paymentMethod: booking.paymentMethod || "N/A",
        status: booking.status,
      },
      adjustments: [],
      status: booking.isPaid ? "paid" : "unpaid",
    };
  }

  generateHtmlInvoice(data) {
    const { invoiceNumber, invoiceDate, hotel, guest, booking, pricing } = data;
    const formatDate = (d) => new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .hotel-info h1 { margin: 0; font-size: 28px; color: #1a73e8; }
  .hotel-info p { margin: 4px 0; color: #666; }
  .invoice-info { text-align: right; }
  .invoice-info h2 { margin: 0; font-size: 24px; color: #333; }
  .invoice-info p { margin: 4px 0; color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
  td { padding: 12px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #333; }
  .paid-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  .paid { background: #e8f5e9; color: #2e7d32; }
  .unpaid { background: #fff3e0; color: #e65100; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
  .guest-details { margin-bottom: 20px; }
  .guest-details h3 { margin-bottom: 8px; color: #555; }
</style></head><body>
  <div class="header">
    <div class="hotel-info">
      <h1>${hotel.name}</h1>
      <p>${hotel.address}${hotel.city ? `, ${hotel.city}` : ""}</p>
      <p>${hotel.email || ""}</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Date:</strong> ${formatDate(invoiceDate)}</p>
      <p><strong>Status:</strong> <span class="paid-badge ${pricing.isPaid ? "paid" : "unpaid"}">${pricing.isPaid ? "PAID" : "UNPAID"}</span></p>
    </div>
  </div>
  <div class="guest-details">
    <h3>Guest Details</h3>
    <p><strong>Name:</strong> ${guest.name}</p>
    <p><strong>Email:</strong> ${guest.email}</p>
  </div>
  <table>
    <tr><th>Room</th><th>Type</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Rate/Night</th><th>Total</th></tr>
    <tr>
      <td>${booking.roomNumber}</td>
      <td>${booking.roomType}</td>
      <td>${formatDate(booking.checkIn)}</td>
      <td>${formatDate(booking.checkOut)}</td>
      <td>${booking.nights}</td>
      <td>${formatCurrency(pricing.dynamicPricePerNight)}</td>
      <td>${formatCurrency(pricing.subtotal)}</td>
    </tr>
    <tr class="total-row"><td colspan="6" style="text-align:right">Total Amount:</td><td>${formatCurrency(pricing.totalPrice)}</td></tr>
  </table>
  <p><strong>Payment Method:</strong> ${pricing.paymentMethod}</p>
  <p><strong>Guests:</strong> ${booking.guests}</p>
  <div class="footer">
    <p>Thank you for choosing ${hotel.name}!</p>
    <p>This is a computer-generated invoice.</p>
  </div>
</body></html>`;
  }

  generateCsvReport(data, type) {
    if (type === "bookings") {
      const headers = "Booking ID,Hotel,Room,Check In,Check Out,Nights,Guests,Total,Status,Payment,Date\n";
      const rows = data.map((b) =>
        `"${b._id}","${b.hotel?.name || ""}","${b.room?.roomNumber || b.roomNumber || ""}","${new Date(b.checkInDate).toISOString().slice(0, 10)}","${new Date(b.checkOutDate).toISOString().slice(0, 10)}",${b.nights || 0},${b.guests || 0},${b.totalPrice || 0},"${b.status}","${b.paymentMethod || ""}","${new Date(b.createdAt).toISOString()}"`
      ).join("\n");
      return headers + rows;
    }

    if (type === "revenue") {
      const headers = "Period,Bookings,Revenue\n";
      const rows = data.map((d) => `"${d.period || d._id}",${d.bookings || 0},${d.revenue || 0}`).join("\n");
      return headers + rows;
    }

    return "Unsupported report type";
  }
}

export default new InvoiceService();
