// TestimonialsManagement — Owner panel for managing guest testimonials and visibility
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, Award } from "lucide-react"
import StatusBadge from "../../components/dashboard/shared/StatusBadge"

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

  const fetchTestimonials = useCallback(async () => {
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
  }, [user, axios, getToken])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Testimonials</h1>
        <p className="text-sm text-white/40 mt-1">Manage guest feedback visibility for your storefront.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Total Testimonials</p>
          <p className="mt-2 text-3xl font-bold text-white">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Visible</p>
          <p className="mt-2 text-3xl font-bold text-[#22C55E]">{visibleCount}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Hidden</p>
          <p className="mt-2 text-3xl font-bold text-[#EF4444]">{rows.length - visibleCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Guest</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Location</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Rating</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Review</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-[0.15em]">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item._id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors align-top">
                  <td className="py-3 px-4 text-white/80 font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-white/60">{item.address}</td>
                  <td className="py-3 px-4 text-white/80">{item.rating}/5</td>
                  <td className="py-3 px-4 text-white/60 max-w-md">{item.review}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.isVisible ? "visible" : "hidden"} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.06] text-white/50 hover:text-[#D4A85F] hover:border-[#D4A85F]/20 hover:bg-[#D4A85F]/10 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleVisibility(item)}
                        className="p-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-[#F59E0B] hover:border-[#F59E0B]/20 hover:bg-[#F59E0B]/10 transition-all"
                        title={item.isVisible ? "Hide" : "Show"}
                      >
                        {item.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <p className="text-sm text-white/40 p-4 border-t border-white/[0.06]">Loading testimonials...</p>}

        {editingId !== null && (
          <div className="m-5 rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Edit Testimonial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60">Guest Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Location</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Rating (1-5)</label>
                <input
                  type="number" min="1" max="5"
                  value={form.rating}
                  onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Review</label>
                <textarea
                  rows="4"
                  value={form.review}
                  onChange={(e) => setForm((prev) => ({ ...prev, review: e.target.value }))}
                  className="luxury-input mt-1 resize-none"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TestimonialsManagement
