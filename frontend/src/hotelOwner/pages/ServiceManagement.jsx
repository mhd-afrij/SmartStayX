// ServiceManagement — Owner panel for managing guest room service requests
import { useEffect, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"
import { ConciergeBell, CheckCircle, XCircle, Building2, ChevronDown } from "lucide-react"
import ConfirmModal from "../../components/dashboard/ConfirmModal"

// SERVICE_TYPES — Supported room service categories
const SERVICE_TYPES = ["Housekeeping", "Maintenance", "Room Service", "Other"]
// STATUS_OPTIONS — Possible service request lifecycle statuses
const STATUS_OPTIONS = ["pending", "assigned", "completed", "cancelled"]

// ServiceManagement — Owner panel for managing guest room service requests with status updates
const ServiceManagement = () => {
  const { user, getToken, axios, dashboardData } = useAppContext()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterHotel, setFilterHotel] = useState("all")
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "", status: "" })
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    if (dashboardData?.allHotels) {
      setHotels(dashboardData.allHotels)
    }
  }, [dashboardData])

  // requestConfirm — Opens a confirmation modal before status change
  const requestConfirm = (id, title, message, status) => {
    setConfirmState({ open: true, id, title, message, status })
  }

  // handleConfirmed — Executes the status update after modal confirmation
  const handleConfirmed = () => {
    const { id, status } = confirmState
    setConfirmState({ open: false, id: null, title: "", message: "", status: "" })
    if (id && status) executeStatusUpdate(id, status)
  }

  // fetchRequests — Loads service request history for the selected hotel
  const fetchRequests = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`/api/services/history?hotelId=${filterHotel || "all"}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setRequests(data.history || [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [axios, getToken, filterHotel])

  useEffect(() => {
    if (user) fetchRequests()
  }, [user, fetchRequests])

  // executeStatusUpdate — Sends a status update for a service request
  const executeStatusUpdate = async (requestId, status) => {
    setProcessingId(requestId)
    try {
      const { data } = await axios.post(
        "/api/services/update-status",
        { requestId, status },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchRequests()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  // handleUpdateStatus — Opens a confirmation dialog before updating request status
  const handleUpdateStatus = (requestId, status) => {
    requestConfirm(requestId, "Update Status", `Mark this request as "${status}"?`, status)
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterType !== "all" && r.serviceType !== filterType) return false
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      return true
    })
  }, [requests, filterType, filterStatus])

  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((r) => r.status === "pending").length
    const assigned = requests.filter((r) => r.status === "assigned").length
    const completed = requests.filter((r) => r.status === "completed").length
    const cancelled = requests.filter((r) => r.status === "cancelled").length
    return { total, pending, assigned, completed, cancelled }
  }, [requests])

  // formatDate — Formats a date value to a locale string or dash if empty
  const formatDate = (v) => (v ? new Date(v).toLocaleString() : "-")

  // statusBadge — Returns Tailwind class string for a given status badge style
  const statusBadge = (status) => {
    const map = {
      pending: "bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300 border-[#B9B4CE]/45 dark:border-[#3D4660]/45",
      assigned: "bg-[#EFEDF7] dark:bg-[#1B2436] text-[#B58A2E] dark:text-[#E6C075] border-[#B9B4CE]/45 dark:border-[#3D4660]/45",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    }
    return map[status] || ""
  }

  const statCards = [
    { label: "Total", value: stats.total, color: "bg-[#f4f2ef] dark:bg-[#10131D] border-black/[0.06] dark:border-[#232737]", textColor: "text-slate-700 dark:text-[#C1D2D6]" },
    { label: "Pending", value: stats.pending, color: "bg-[#F4F2F9] dark:bg-[#1B2436] border-amber-100 dark:border-amber-500/25", textColor: "text-amber-700 dark:text-amber-300" },
    { label: "Assigned", value: stats.assigned, color: "bg-[#EFEDF7] dark:bg-[#1B2436] border-[#E5E1F0]", textColor: "text-[#B58A2E] dark:text-[#E6C075]" },
    { label: "Completed", value: stats.completed, color: "bg-emerald-50 border-emerald-100", textColor: "text-emerald-700" },
    { label: "Cancelled", value: stats.cancelled, color: "bg-rose-50 border-rose-100", textColor: "text-rose-700" },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#E9F1F2] tracking-tight">Service Requests</h1>
        <p className="text-sm text-slate-400 dark:text-[#6B828A] mt-1">View, filter, and manage all guest service requests across your properties.</p>
      </div>

      <div className="flex items-center justify-between">
        <div />
        {hotels.length > 1 && (
          <div className="relative">
            <select
              value={filterHotel}
              onChange={(e) => setFilterHotel(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#161925] text-slate-600 dark:text-[#9FB2B8] outline-none focus:border-[#D4A853]/60 transition-colors cursor-pointer"
            >
              <option value="all">All Properties</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#6B828A] pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#6B828A] pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-[#8299A0]">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="luxury-card overflow-hidden">
        <div className="p-4 border-b border-black/[0.06] dark:border-[#232737] flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="luxury-select text-sm min-w-[8rem]"
          >
            <option value="all">All Types</option>
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="luxury-select text-sm min-w-[8rem]"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 dark:text-[#6B828A] ml-auto">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-[#D4A853] border-t-transparent" />
            <p className="mt-3 text-sm text-slate-400 dark:text-[#6B828A]">Loading requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-[#232737] bg-[#f4f2ef] dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0] text-xs uppercase tracking-[0.15em]">
                  <th className="py-4 px-5 text-left font-medium">Type</th>
                  <th className="py-4 px-5 text-left font-medium">Details</th>
                  <th className="py-4 px-5 text-left font-medium">Room</th>
                  <th className="py-4 px-5 text-left font-medium">Requested</th>
                  <th className="py-4 px-5 text-left font-medium">Status</th>
                  <th className="py-4 px-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-medium text-slate-900 dark:text-[#E9F1F2]">{r.serviceType}</span>
                    </td>
                    <td className="py-4 px-5 max-w-[200px]">
                      <span className="text-slate-600 dark:text-[#9FB2B8] truncate block">{r.requestDetails || "-"}</span>
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-[#9FB2B8]">
                      {r.roomNumber || r.room?.roomNumber ? `Room ${r.roomNumber || r.room?.roomNumber}` : ""}
                      {r.room?.roomType ? (r.roomNumber || r.room?.roomNumber ? ` — ${r.room.roomType}` : r.room.roomType) : (!r.roomNumber && !r.room?.roomNumber ? "N/A" : "")}
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400 dark:text-[#6B828A]">{formatDate(r.createdAt)}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "assigned" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(r._id, "completed")}
                              disabled={processingId === r._id}
                              className="p-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 text-slate-400 dark:text-[#6B828A] hover:text-emerald-600 transition-colors disabled:opacity-40"
                              title="Mark completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r._id, "cancelled")}
                              disabled={processingId === r._id}
                              className="p-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 text-slate-400 dark:text-[#6B828A] hover:text-rose-600 transition-colors disabled:opacity-40"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {r.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(r._id, "cancelled")}
                            disabled={processingId === r._id}
                            className="p-2 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 text-slate-400 dark:text-[#6B828A] hover:text-rose-600 transition-colors disabled:opacity-40"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === "completed" && (
                          <span className="text-xs text-emerald-600/80 italic flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                        {r.status === "cancelled" && (
                          <span className="text-xs text-rose-600/80 italic flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Closed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <ConciergeBell className="w-10 h-10 mx-auto text-slate-300 dark:text-[#4E646B] mb-3" />
                      <p className="text-slate-400 dark:text-[#6B828A]">No service requests found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, id: null, title: "", message: "", status: "" })}
      />
    </motion.div>
  )
}

export default ServiceManagement
