import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { LogOut, Plus, Receipt, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const paymentMethods = ["unpaid", "Cash", "Card", "Online"];

const Checkout = () => {
  const { axios, getToken, formatPrice } = useAppContext();
  const [searchParams] = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get("bookingId") || "");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("unpaid");
  const [note, setNote] = useState("");
  const [charges, setCharges] = useState([{ description: "", amount: "" }]);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/receptionist/reservations", { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) setReservations((data.reservations || []).filter((r) => r.status === "checked_in"));
      else toast.error(data.message || "Failed to load reservations");
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
    return reservations.filter((r) => (r.guestName || "").toLowerCase().includes(q) || (r.roomNumber || "").toLowerCase().includes(q) || (r.hotel || "").toLowerCase().includes(q));
  }, [reservations, search]);

  const updateCharge = (index, field, value) => setCharges((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addCharge = () => setCharges((items) => [...items, { description: "", amount: "" }]);
  const removeCharge = (index) => setCharges((items) => items.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedId) return toast.error("Select a checked-in guest first");
    setSubmitting(true);
    setBill(null);
    try {
      const extraCharges = charges.map((c) => ({ description: c.description.trim(), amount: Number(c.amount) })).filter((c) => c.description && c.amount > 0);
      const { data } = await axios.post("/api/receptionist/checkout", { bookingId: selectedId, extraCharges, paymentMethod, note }, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success("Checkout completed");
        setBill(data.bill || null);
        await loadReservations();
      } else {
        toast.error(data.message || "Failed to check out guest");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to check out guest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Check-out</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">Finalize charges, collect payment, and move the room to cleaning.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] dark:border-[#303631] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><LogOut className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" /><h2 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">In-house Guests</h2></div>
            <div className="relative w-56 max-w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="luxury-input w-full h-auto py-2 pl-9 pr-3 text-xs" /></div>
          </div>
          {loading ? <div className="p-8 flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" /><span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading guests...</span></div> : filtered.length === 0 ? <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No checked-in guests found.</div> : (
            <div className="divide-y divide-black/[0.06] dark:divide-[#303631]">{filtered.map((r) => <button key={r._id} onClick={() => setSelectedId(r._id)} className={`w-full text-left p-4 transition-colors ${selectedId === r._id ? "bg-[#EFEAE1] dark:bg-[#222823]" : "hover:bg-black/[0.02] dark:hover:bg-white/5"}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-800 dark:text-[#E8EDE6]">{r.guestName}</p><p className="text-xs text-slate-500 dark:text-[#A9AEA7] mt-1">{r.hotel} · {r.roomNumber ? `Room ${r.roomNumber}` : r.roomType || "Room"}</p></div><span className="text-xs font-space text-slate-700 dark:text-[#E8EDE6]">{formatPrice(r.totalPrice)}</span></div></button>)}</div>
          )}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2"><Receipt className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" /><h2 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Bill Summary</h2></div>
          <div className="rounded-xl bg-[#EFEEE8] dark:bg-[#222823] p-3 text-sm text-slate-600 dark:text-[#A9AEA7] min-h-20">{selected ? `${selected.guestName} · ${formatPrice(selected.totalPrice)} base stay` : "Select a guest"}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Extra charges</span><button type="button" onClick={addCharge} className="p-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631]"><Plus className="w-3.5 h-3.5" /></button></div>
            {charges.map((charge, index) => <div key={index} className="grid grid-cols-[1fr_90px_32px] gap-2"><input value={charge.description} onChange={(e) => updateCharge(index, "description", e.target.value)} className="luxury-input h-auto py-2 px-3 text-xs" placeholder="Description" /><input value={charge.amount} onChange={(e) => updateCharge(index, "amount", e.target.value)} className="luxury-input h-auto py-2 px-3 text-xs" placeholder="0" type="number" min="0" /><button type="button" onClick={() => removeCharge(index)} className="rounded-lg border border-red-200 text-red-600 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button></div>)}
          </div>
          <label className="block"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Payment</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="luxury-select mt-1 h-auto py-2 px-3 text-sm">{paymentMethods.map((m) => <option key={m} value={m}>{m === "unpaid" ? "Keep unpaid" : m}</option>)}</select></label>
          <label className="block"><span className="text-xs text-slate-500 dark:text-[#A9AEA7]">Note</span><textarea value={note} onChange={(e) => setNote(e.target.value)} className="luxury-input mt-1 h-20 py-2 px-3 text-sm resize-none" placeholder="Optional checkout note" /></label>
          <button disabled={submitting || !selectedId} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#183B35] text-[#F2EFE8] text-sm font-medium disabled:opacity-50"><LogOut className="w-4 h-4" />Complete Check-out</button>
          {bill && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">Grand total: <span className="font-semibold">{formatPrice(bill.grandTotal)}</span></div>}
        </form>
      </div>
    </motion.div>
  );
};

export default Checkout;