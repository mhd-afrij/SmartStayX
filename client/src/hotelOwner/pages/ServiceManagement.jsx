import { useEffect, useState, useMemo, useCallback } from "react"
import Title from "../../components/Title"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"

const SERVICE_TYPES = ["Housekeeping", "Maintenance", "Room Service", "Other"]
const STATUS_OPTIONS = ["pending", "assigned", "completed", "cancelled"]

const ServiceManagement = () => {
  const { user, getToken, axios, selectedHotelId } = useAppContext()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

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

  const handleUpdateStatus = async (requestId, status) => {
    if (!window.confirm(`Mark this request as "${status}"?`)) return
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
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      assigned: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    }
    return map[status] || ""
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(120deg,_#0f172a_0%,_#1d4ed8_55%,_#22d3ee_110%)] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative z-10">
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">Guest Services</p>
          <Title align="left" font="outfit" title="Service Requests" subtitle="View, filter, and manage all guest service requests across your properties." />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "slate" },
          { label: "Pending", value: stats.pending, color: "amber" },
          { label: "Assigned", value: stats.assigned, color: "blue" },
          { label: "Completed", value: stats.completed, color: "emerald" },
          { label: "Cancelled", value: stats.cancelled, color: "rose" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-${s.color}-200 bg-${s.color}-50/60 p-3 text-center`}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <option value="all">All Types</option>
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <span className="self-center text-xs text-slate-500">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="text-white glass-dark">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Type</th>
                  <th className="py-3 px-4 text-left font-semibold">Details</th>
                  <th className="py-3 px-4 text-left font-semibold">Room</th>
                  <th className="py-3 px-4 text-left font-semibold">Staff</th>
                  <th className="py-3 px-4 text-left font-semibold">Requested</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium">{r.serviceType}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate">{r.requestDetails || "-"}</td>
                    <td className="py-3 px-4">{r.room?.roomType || "N/A"}</td>
                    <td className="py-3 px-4">{r.staffAssigned?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-xs">{formatDate(r.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {r.status === "assigned" && (
                          <>
                            <button onClick={() => handleUpdateStatus(r._id, "completed")} disabled={processingId === r._id} className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                              Complete
                            </button>
                            <button onClick={() => handleUpdateStatus(r._id, "cancelled")} disabled={processingId === r._id} className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                              Cancel
                            </button>
                          </>
                        )}
                        {r.status === "pending" && (
                          <button onClick={() => handleUpdateStatus(r._id, "cancelled")} disabled={processingId === r._id} className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                            Cancel
                          </button>
                        )}
                        {r.status === "completed" && <span className="text-xs text-slate-400 italic">Done</span>}
                        {r.status === "cancelled" && <span className="text-xs text-slate-400 italic">Closed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-slate-500">No service requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default ServiceManagement
