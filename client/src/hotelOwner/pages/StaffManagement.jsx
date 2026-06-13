// StaffManagement — Owner panel for managing hotel staff accounts and permissions
import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"
import { Users, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import ConfirmModal from "../../components/dashboard/ConfirmModal"

const ROLES = ["Housekeeping", "Maintenance", "Room Service", "Front Desk"]

const StaffManagement = () => {
  const { user, getToken, axios, selectedHotelId, setSelectedHotelId } = useAppContext()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", role: "Housekeeping" })
  const [hotels, setHotels] = useState([])
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "" })

  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message })
  }

  const handleConfirmed = () => {
    const { id } = confirmState
    setConfirmState({ open: false, id: null, title: "", message: "" })
    if (id) executeDelete(id)
  }

  const fetchOwnerHotels = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        const list = data.hotels || []
        setHotels(list)
        if (list.length === 1 && selectedHotelId === "all") {
          setSelectedHotelId(list[0]._id)
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to load hotels")
    }
  }, [axios, getToken, selectedHotelId, setSelectedHotelId])

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.get(`/api/services/staff?hotelId=${selectedHotelId || "all"}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setStaff(data.staff || [])
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
    fetchOwnerHotels()
  }, [fetchOwnerHotels])

  useEffect(() => {
    if (user) fetchStaff()
  }, [user, fetchStaff])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", role: "Housekeeping" })
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, role: s.role })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required")
    if (!selectedHotelId || selectedHotelId === "all") return toast.error("Please select a specific hotel before adding staff")
    try {
      const token = await getToken()
      if (editing) {
        const { data } = await axios.put(`/api/services/staff/${editing._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          toast.success("Staff updated")
        } else {
          return toast.error(data.message)
        }
      } else {
        const { data } = await axios.post("/api/services/add-staff", { ...form, hotelId: selectedHotelId }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          toast.success("Staff added")
        } else {
          return toast.error(data.message)
        }
      }
      setShowModal(false)
      fetchStaff()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const executeDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/services/staff/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      if (data.success) {
        toast.success(data.message)
        fetchStaff()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = (id) => {
    requestConfirm(id, "Remove Staff", "Remove this staff member?")
  }

  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(`/api/services/staff/${id}/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      if (data.success) {
        toast.success("Availability toggled")
        fetchStaff()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const stats = {
    total: staff.length,
    available: staff.filter((s) => s.isAvailable).length,
    busy: staff.filter((s) => !s.isAvailable).length,
  }

  const statCards = [
    { label: "Total Staff", value: stats.total, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", textColor: "text-blue-400" },
    { label: "Available", value: stats.available, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30", textColor: "text-emerald-400" },
    { label: "Busy", value: stats.busy, color: "from-rose-500/20 to-rose-600/10 border-rose-500/30", textColor: "text-rose-400" },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Staff Management</h1>
          <p className="text-sm text-white/40 mt-1">Add, edit, remove, and toggle availability for your service staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            disabled={!selectedHotelId || selectedHotelId === "all"}
            className="gold-button px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!selectedHotelId || selectedHotelId === "all" ? "Select a specific hotel from the top bar first" : ""}
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <div key={s.label} className={`luxury-card p-5 bg-gradient-to-br ${s.color}`}>
            <p className="text-xs uppercase tracking-[0.15em] text-white/50">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="luxury-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" />
            <p className="mt-3 text-sm text-white/40">Loading staff...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/50 text-xs uppercase tracking-[0.15em]">
                  <th className="py-4 px-5 text-left font-medium">Name</th>
                  <th className="py-4 px-5 text-left font-medium">Role</th>
                  <th className="py-4 px-5 text-left font-medium">Workload</th>
                  <th className="py-4 px-5 text-left font-medium">Status</th>
                  <th className="py-4 px-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staff.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#F5D08A]/10 flex items-center justify-center text-xs font-bold text-[#F5D08A]">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-white/70">{s.role}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-white/50">{s.workload || 0} active</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                        s.isAvailable
                          ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/30"
                          : "bg-rose-900/30 text-rose-400 border-rose-700/30"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isAvailable ? "bg-emerald-400" : "bg-rose-400"}`} />
                        {s.isAvailable ? "Available" : "Busy"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(s._id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
                          title="Toggle availability"
                        >
                          {s.isAvailable ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-[#D4A85F] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Users className="w-10 h-10 mx-auto text-white/20 mb-3" />
                      <p className="text-white/40">No staff yet.</p>
                      <button
                        onClick={openAdd}
                        disabled={!selectedHotelId || selectedHotelId === "all"}
                        className="gold-button mt-4 px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!selectedHotelId || selectedHotelId === "all" ? "Select a specific hotel from the top bar first" : ""}
                      >
                        Add your first staff member
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-4"
          >
            <div className="luxury-card p-6">
              <h3 className="text-lg font-playfair text-white">{editing ? "Edit Staff" : "Add Staff"}</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="luxury-input"
                    placeholder="Staff name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="luxury-select"
                  >
                    {ROLES.map((r) => <option key={r} value={r} className="bg-[#0d1728]">{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="ghost-button px-5 py-2.5 text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} className="gold-button px-5 py-2.5 text-sm">
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, id: null, title: "", message: "" })}
      />
    </motion.div>
  )
}

export default StaffManagement
