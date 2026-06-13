// ServiceManagement — Owner panel for managing guest room service requests
import { useEffect, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"
import { ConciergeBell, CheckCircle, XCircle } from "lucide-react"
import ConfirmModal from "../../components/dashboard/ConfirmModal"

const SERVICE_TYPES = ["Housekeeping", "Maintenance", "Room Service", "Other"]
const STATUS_OPTIONS = ["pending", "assigned", "completed", "cancelled"]

const ServiceManagement = () => {
  const { user, getToken, axios, selectedHotelId } = useAppContext()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "", status: "" })

  const requestConfirm = (id, title, message, status) => {
    setConfirmState({ open: true, id, title, message, status })
  }

  const handleConfirmed = () => {
    const { id, status } = confirmState
    setConfirmState({ open: false, id: null, title: "", message: "", status: "" })
    if (id && status) executeStatusUpdate(id, status)
  }

  const fetchRequests = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`/api/services/history?hotelId=${selectedHotelId || "all"}`, {
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
  }, [axios, getToken, selectedHotelId])

  useEffect(() => {
    if (user) fetchRequests()
  }, [user, fetchRequests])

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

  const formatDate = (v) => (v ? new Date(v).toLocaleString() : "-")

  const statusBadge = (status) => {
    const map = {
      pending: "bg-amber-900/30 text-amber-400 border-amber-700/30",
      assigned: "bg-blue-900/30 text-blue-400 border-blue-700/30",
      completed: "bg-emerald-900/30 text-emerald-400 border-emerald-700/30",
      cancelled: "bg-rose-900/30 text-rose-400 border-rose-700/30",
    }
    return map[status] || ""
  }

  const statCards = [
    { label: "Total", value: stats.total, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30", textColor: "text-slate-300" },
    { label: "Pending", value: stats.pending, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30", textColor: "text-amber-400" },
    { label: "Assigned", value: stats.assigned, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", textColor: "text-blue-400" },
    { label: "Completed", value: stats.completed, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30", textColor: "text-emerald-400" },
    { label: "Cancelled", value: stats.cancelled, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30", textColor: "text-rose-400" },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Service Requests</h1>
        <p className="text-sm text-white/40 mt-1">View, filter, and manage all guest service requests across your properties.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className={`luxury-card p-4 bg-gradient-to-br ${s.color}`}>
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="luxury-card overflow-hidden">
        <div className="p-4 border-b border-white/8 flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="luxury-select text-sm min-w-[8rem]"
          >
            <option value="all" className="bg-[#0d1728]">All Types</option>
            {SERVICE_TYPES.map((t) => <option key={t} value={t} className="bg-[#0d1728]">{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="luxury-select text-sm min-w-[8rem]"
          >
            <option value="all" className="bg-[#0d1728]">All Statuses</option>
            {STATUS_OPTIONS.map((t) => (
              <option key={t} value={t} className="bg-[#0d1728]">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <span className="text-xs text-white/40 ml-auto">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" />
            <p className="mt-3 text-sm text-white/40">Loading requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/50 text-xs uppercase tracking-[0.15em]">
                  <th className="py-4 px-5 text-left font-medium">Type</th>
                  <th className="py-4 px-5 text-left font-medium">Details</th>
                  <th className="py-4 px-5 text-left font-medium">Room</th>
                  <th className="py-4 px-5 text-left font-medium">Staff</th>
                  <th className="py-4 px-5 text-left font-medium">Requested</th>
                  <th className="py-4 px-5 text-left font-medium">Status</th>
                  <th className="py-4 px-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-medium text-white">{r.serviceType}</span>
                    </td>
                    <td className="py-4 px-5 max-w-[200px]">
                      <span className="text-white/60 truncate block">{r.requestDetails || "-"}</span>
                    </td>
                    <td className="py-4 px-5 text-white/70">{r.room?.roomType || "N/A"}</td>
                    <td className="py-4 px-5">
                      <span className="text-white/70">{r.staffAssigned?.name || "Unassigned"}</span>
                    </td>
                    <td className="py-4 px-5 text-xs text-white/40">{formatDate(r.createdAt)}</td>
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
                              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-emerald-400 transition-colors disabled:opacity-40"
                              title="Mark completed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r._id, "cancelled")}
                              disabled={processingId === r._id}
                              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-rose-400 transition-colors disabled:opacity-40"
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
                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-rose-400 transition-colors disabled:opacity-40"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === "completed" && (
                          <span className="text-xs text-emerald-400/60 italic flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                        {r.status === "cancelled" && (
                          <span className="text-xs text-rose-400/60 italic flex items-center gap-1">
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
                      <ConciergeBell className="w-10 h-10 mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">No service requests found.</p>
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
