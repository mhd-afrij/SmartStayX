import { useEffect, useState, useCallback } from "react"
import Title from "../../components/Title"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"

const ROLES = ["Housekeeping", "Maintenance", "Room Service", "Front Desk"]

const StaffManagement = () => {
  const { user, getToken, axios, selectedHotelId } = useAppContext()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", role: "Housekeeping" })

  const fetchStaff = useCallback(async () => {
    try {
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

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff member?")) return
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

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(120deg,_#0f172a_0%,_#1d4ed8_55%,_#22d3ee_110%)] p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">Workforce</p>
            <Title align="left" font="outfit" title="Staff Management" subtitle="Add, edit, remove, and toggle availability for your service staff." />
          </div>
          <button onClick={openAdd} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow hover:bg-blue-50 transition">
            + Add Staff
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Staff", value: stats.total, color: "slate" },
          { label: "Available", value: stats.available, color: "emerald" },
          { label: "Busy", value: stats.busy, color: "rose" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-${s.color}-200 bg-${s.color}-50/60 p-3 text-center`}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold text-${s.color}-700`}>{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-white glass-dark">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Name</th>
                  <th className="py-3 px-4 text-left font-semibold">Role</th>
                  <th className="py-3 px-4 text-left font-semibold">Workload</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {staff.map((s) => (
                  <tr key={s._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4">{s.role}</td>
                    <td className="py-3 px-4">{s.workload || 0} active</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${s.isAvailable ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
                        {s.isAvailable ? "Available" : "Busy"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => handleToggle(s._id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition" title="Toggle availability">
                          {s.isAvailable ? "Set Busy" : "Set Available"}
                        </button>
                        <button onClick={() => openEdit(s)} className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-500">No staff yet. Click "Add Staff" to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">{editing ? "Edit Staff" : "Add Staff"}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-indigo-500"
                  placeholder="Staff name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-indigo-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition">{editing ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
