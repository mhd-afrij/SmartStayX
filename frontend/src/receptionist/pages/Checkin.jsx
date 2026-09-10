import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, CreditCard, FileText, KeyRound, LogIn, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const paymentMethods = ["Pay At Hotel", "Cash", "Card", "Online"];

const Checkin = () => {
  const { axios, getToken } = useAppContext();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("bookingId") || "");
  const [documentType, setDocumentType] = useState("NIC");
  const [documentNumber, setDocumentNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pay At Hotel");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [keyCardCode, setKeyCardCode] = useState("");

  const loadReservations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/receptionist/reservations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setReservations((data.reservations || []).filter((r) => ["confirmed", "reservation"].includes(r.status)));
      } else {
        toast.error(data.message || "Failed to load reservations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReservations(); }, []);

  const selected = reservations.find((r) => r._id === selectedId);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reservations;
    return reservations.filter((r) =>
      (r.guestName || "").toLowerCase().includes(q) ||
      (r.roomNumber || "").toLowerCase().includes(q) ||
      (r.hotel || "").toLowerCase().includes(q)
    );
  }, [reservations, search]);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedId) return toast.error("Select a reservation first");
    setSubmitting(true);
    setKeyCardCode("");
    try {
      const { data } = await axios.post("/api/receptionist/checkin", {
        bookingId: selectedId,
        documentType,
        documentNumber,
        paymentMethod,
      }, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success("Check-in completed");
        setKeyCardCode(data.keyCardCode || "");
        await loadReservations();
      } else {
        toast.error(data.message || "Failed to check in guest");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to check in guest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Check-in</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">Verify guest details, collect payment, and issue a key card.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] dark:border-[#303631] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" />
              <h2 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Ready Arrivals</h2>
            </div>
            <div className="relative w-56 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="luxury-input w-full h-auto py-2 pl-9 pr-3 text-xs" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" /><span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading reservations...</span></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No confirmed arrivals found.</div>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-[#303631]">
              {filtered.map((r) => (
                <button key={r._id} onClick={() => setSelectedId(r._id)} className={`w-full text-left p-4 transition-colors ${selectedId === r._id ? "bg-[#EFEAE1] dark:bg-[#222823]" : "hover:bg-black/[0.02] dark:hover:bg-white/5"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-[#E8EDE6]">{r.guestName}</p>
                      <p className="text-xs text-slate-500 dark:text-[#A9AEA7] mt-1">{r.hotel} · {r.roomNumber ? `Room ${r.roomNumber}` : r.roomType || "Room pending"}</p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-[#A9AEA7]">{new Date(r.checkInDate).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" /><h2 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Guest Verification</h2></div>
          <div className="rounded-xl bg-[#EFEEE8] dark:bg-[#222823] p-3 text-sm text-slate-600 dark:text-[#A9AEA7] min-h-20">{selected ? `${selected.guestName} at ${selected.hotel}` : "Select a reservation"}</div>
          <label className="block"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Document type</span><select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="luxury-select mt-1 h-auto py-2 px-3 text-sm"><option>NIC</option><option>Passport</option><option>Driver License</option></select></label>
          <label className="block"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Document number</span><input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="luxury-input mt-1 h-auto py-2 px-3 text-sm" placeholder="Verification ID" /></label>
          <label className="block"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Payment</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="luxury-select mt-1 h-auto py-2 px-3 text-sm">{paymentMethods.map((m) => <option key={m}>{m}</option>)}</select></label>
          <button disabled={submitting || !selectedId} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#183B35] text-[#F2EFE8] text-sm font-medium disabled:opacity-50"><KeyRound className="w-4 h-4" />Complete Check-in</button>
          {keyCardCode && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2"><FileText className="w-4 h-4" />Key card code: <span className="font-semibold">{keyCardCode}</span></div>}
        </form>
      </div>
    </motion.div>
  );
};

export default Checkin;