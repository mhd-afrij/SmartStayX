import { useEffect, useMemo, useState } from "react"
import Title from "../../components/Title"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"

const TestimonialsManagement = () => {
  const { axios, getToken, user } = useAppContext()
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: "", address: "", rating: 5, review: "" })
  const [loading, setLoading] = useState(false)

  const visibleCount = useMemo(() => rows.filter((item) => item.isVisible).length, [rows])

  const toggleVisibility = async (item) => {
    try {
      const token = await getToken()
      const nextVisibility = !item.isVisible
      const { data } = await axios.patch(
        `/api/testimonials/${item._id}/visibility`,
        { isVisible: nextVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setRows((prev) => prev.map((row) => row._id === item._id ? { ...row, isVisible: nextVisibility } : row))
      } else {
        toast.error(data.message || "Failed to update visibility")
      }
    } catch (error) {
      toast.error(error.message || "Failed to update visibility")
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setForm({ name: item.name, address: item.address, rating: item.rating, review: item.review })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", address: "", rating: 5, review: "" })
  }

  const saveEdit = async () => {
    if (!editingId) return
    const safeRating = Math.min(5, Math.max(1, Number(form.rating) || 1))
    try {
      const token = await getToken()
      const payload = { name: form.name.trim(), address: form.address.trim(), rating: safeRating, review: form.review.trim() }
      const { data } = await axios.put(`/api/testimonials/${editingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setRows((prev) =>
          prev.map((item) =>
            item._id === editingId ? { ...item, name: payload.name || item.name, address: payload.address || item.address, rating: payload.rating, review: payload.review || item.review } : item
          )
        )
        toast.success("Testimonial updated")
        cancelEdit()
      } else {
        toast.error(data.message || "Failed to update testimonial")
      }
    } catch (error) {
      toast.error(error.message || "Failed to update testimonial")
    }
  }

  useEffect(() => {
    const fetchTestimonials = async () => {
      if (!user) return
      setLoading(true)
      try {
        const token = await getToken()
        const { data } = await axios.get("/api/testimonials/owner", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          setRows(data.testimonials || [])
        } else {
          toast.error(data.message || "Failed to load testimonials")
        }
      } catch (error) {
        toast.error(error.message || "Failed to load testimonials")
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [user, axios, getToken])

  return (
    <div className="space-y-6">
      <Title align="left" font="outfit" title="Testimonials" subtitle="Manage guest feedback visibility for your storefront." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 perspective-1000 tilt-card">
          <p className="text-slate-500 text-sm">Total Testimonials</p>
          <p className="text-2xl font-semibold gradient-text">{rows.length}</p>
        </div>
        <div className="glass border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 perspective-1000 tilt-card">
          <p className="text-slate-500 text-sm">Visible</p>
          <p className="text-2xl font-semibold gradient-text-warm">{visibleCount}</p>
        </div>
        <div className="glass border border-slate-200 rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 perspective-1000 tilt-card">
          <p className="text-slate-500 text-sm">Hidden</p>
          <p className="text-2xl font-semibold gradient-text">{rows.length - visibleCount}</p>
        </div>
      </div>

      <div className="glass border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="glass-dark text-white/90">
              <tr>
                <th className="py-3 px-4 text-left">Guest</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Rating</th>
                <th className="py-3 px-4 text-left">Review</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {rows.map((item) => (
                <tr key={item._id} className="border-t border-slate-100 align-top hover:bg-white/50 transition-all duration-200 perspective-1000 cursor-default">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4">{item.address}</td>
                  <td className="py-3 px-4">{item.rating}/5</td>
                  <td className="py-3 px-4 max-w-md">{item.review}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full backdrop-blur-sm border ${item.isVisible ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-200/80 text-slate-700 border-slate-300"}`}>
                      {item.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(item)} className="text-xs px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all duration-200">Edit</button>
                      <button onClick={() => toggleVisibility(item)} className="text-xs px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 hover:scale-105 transition-all duration-200">
                        {item.isVisible ? "Hide" : "Show"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <p className="text-sm text-slate-500 mt-4">Loading testimonials...</p>}

        {editingId !== null && (
          <div className="mt-5 glass border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Edit Testimonial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600">Guest Name</label>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Location</label>
                <input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Rating (1-5)</label>
                <input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-600">Review</label>
                <textarea rows="4" value={form.review} onChange={(e) => setForm((prev) => ({ ...prev, review: e.target.value }))} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={saveEdit} className="text-xs px-4 py-2 rounded-md bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 hover:shadow-lg hover:scale-105 transition-all duration-200">Save Changes</button>
              <button onClick={cancelEdit} className="text-xs px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 hover:scale-105 transition-all duration-200">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestimonialsManagement
