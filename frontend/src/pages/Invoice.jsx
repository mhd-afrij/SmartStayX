import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { FileText, Download, Loader2, ArrowLeft, Building2, Calendar, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

const Invoice = () => {
  const { bookingId } = useParams();
  const { axios, getToken, formatPrice, navigate } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    document.title = "Invoice — SmartStayX";
    const load = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await axios.get(`/api/invoice/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setInvoice(data.invoice || data);
        } else {
          toast.error(data.message || "Invoice not found");
        }
      } catch {
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const handleDownload = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/invoice/booking/${bookingId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${bookingId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEEE8] dark:bg-[#111412] pt-32 flex items-start justify-center">
        <Loader2 className="w-6 h-6 text-[#183B35] dark:text-[#8FB8A8] animate-spin mt-20" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#EFEEE8] dark:bg-[#111412] pt-32 flex flex-col items-center gap-4 px-4">
        <FileText className="w-12 h-12 text-slate-300 dark:text-[#A9AEA7]" />
        <p className="text-slate-500 dark:text-[#A9AEA7] text-sm">Invoice not found</p>
        <button onClick={() => navigate("/my-bookings")} className="gold-button px-6 py-2.5 text-sm">Back to Bookings</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#EFEEE8] dark:bg-[#111412] pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-60" />
      <div className="relative mx-auto max-w-2xl px-4 md:px-8">
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center gap-2 text-xs text-slate-400 dark:text-[#A9AEA7] hover:text-slate-600 dark:hover:text-[#A9AEA7] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Bookings
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#183B35]/10 border border-[#183B35]/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#183B35] dark:text-[#8FB8A8]" />
                </div>
                <div>
                  <h1 className="text-xl font-playfair text-slate-900 dark:text-[#F2EFE8]">Invoice</h1>
                  <p className="text-xs text-slate-400 dark:text-[#A9AEA7]">{invoice.invoiceNumber || `#${bookingId?.slice(-8)}`}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 text-[10px] font-medium rounded-full border ${
                  invoice.status === "paid"
                    ? "border-green-200 dark:border-green-500/25 bg-green-50 text-green-700 dark:text-green-300"
                    : "border-[#A67C52]/45 dark:border-[#303631]/45 bg-[#EFEEE8] dark:bg-[#222823] text-amber-700 dark:text-amber-300"
                }`}>
                  {(invoice.status || "pending").toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-[#EFEEE8] dark:bg-[#222823]">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#A9AEA7] uppercase tracking-[0.12em] mb-1">Hotel</p>
                <p className="text-sm text-slate-900 dark:text-[#F2EFE8] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
                  {invoice.hotel?.name || invoice.hotelName || "Hotel"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#A9AEA7] uppercase tracking-[0.12em] mb-1">Room</p>
                <p className="text-sm text-slate-900 dark:text-[#F2EFE8]">{invoice.room?.roomType || invoice.roomType || "Room"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#A9AEA7] uppercase tracking-[0.12em] mb-1">Check-in</p>
                <p className="text-sm text-slate-900 dark:text-[#F2EFE8] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
                  {invoice.checkInDate ? new Date(invoice.checkInDate).toDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-[#A9AEA7] uppercase tracking-[0.12em] mb-1">Check-out</p>
                <p className="text-sm text-slate-900 dark:text-[#F2EFE8] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
                  {invoice.checkOutDate ? new Date(invoice.checkOutDate).toDateString() : "—"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-[#EFEEE8] dark:bg-[#222823] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-[#A9AEA7]">Room Charges</span>
                <span className="text-slate-900 dark:text-[#F2EFE8]">{formatPrice(invoice.roomCharges || invoice.totalPrice || 0)}</span>
              </div>
              {invoice.taxes > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-[#A9AEA7]">Taxes & Fees</span>
                  <span className="text-slate-900 dark:text-[#F2EFE8]">{formatPrice(invoice.taxes || 0)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-[#A9AEA7]">Discount</span>
                  <span className="text-green-600 dark:text-green-300">-{formatPrice(invoice.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-3 border-t border-black/[0.06] dark:border-[#303631]">
                <span className="text-slate-900 dark:text-[#F2EFE8]">Total</span>
                <span className="text-[#183B35] dark:text-[#8FB8A8]">{formatPrice(invoice.total || invoice.totalPrice || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-[#A9AEA7] p-3 rounded-xl bg-[#EFEEE8] dark:bg-[#222823]">
              <CreditCard className="w-3.5 h-3.5" />
              {invoice.paymentMethod ? `Paid via ${invoice.paymentMethod}` : invoice.status === "paid" ? "Paid" : "Payment pending"}
            </div>

            <button
              onClick={handleDownload}
              className="gold-button w-full flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-[0.18em]"
            >
              <Download className="w-4 h-4" />
              Download Invoice PDF
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Invoice;
