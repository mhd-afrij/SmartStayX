// TestimonialsManagement — Owner panel for managing guest testimonials and visibility
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAppContext } from "../../context/AppContext"
import { toast } from "react-hot-toast"
import { createColumnHelper } from "@tanstack/react-table"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import StatusBadge from "../../components/dashboard/shared/StatusBadge"
import ConfirmModal from "../../components/dashboard/ConfirmModal"
import DataTable from "../../components/ui/DataTable"

const columnHelper = createColumnHelper()

// TestimonialsManagement — Owner panel for viewing, editing visibility, and updating guest testimonials
const TestimonialsManagement = () => {
  const { axios, getToken, user } = useAppContext()
  const [rows, setRows] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: "", address: "", rating: 5, review: "" })
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [deletingId, setDeletingId] = useState(null)

  const visibleCount = useMemo(() => rows.filter((item) => item.isVisible).length, [rows])

  // toggleVisibility — Toggles a testimonial's visible/hidden status
  const toggleVisibility = async (item) => {
    setTogglingId(item._id)
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
    } finally {
      setTogglingId(null)
    }
  }

  // startEdit — Populates the edit form with testimonial data
  const startEdit = (item) => {
    setEditingId(item._id)
    setForm({ name: item.name, address: item.address, rating: item.rating, review: item.review })
  }

  // cancelEdit — Clears the edit form and exits editing mode
  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", address: "", rating: 5, review: "" })
  }

  // saveEdit — Saves changes to a testimonial (name, address, rating, review)
  const saveEdit = async () => {
    if (!editingId) return
    setSavingEdit(true)
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
    } finally {
      setSavingEdit(false)
    }
  }

  // handleDelete — Opens the delete confirmation modal
  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id })
  }

  // handleDeleteConfirmed — Deletes the testimonial after modal confirmation
  const handleDeleteConfirmed = async () => {
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    if (!id) return
    setDeletingId(id)
    try {
      const token = await getToken()
      const { data } = await axios.delete(`/api/testimonials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setRows((prev) => prev.filter((item) => item._id !== id))
        toast.success("Testimonial deleted")
      } else {
        toast.error(data.message || "Failed to delete testimonial")
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete testimonial")
    } finally {
      setDeletingId(null)
    }
  }

  // fetchTestimonials — Loads all testimonials for the owner
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

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Guest",
      cell: (info) => <span className="text-slate-900 font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("address", {
      header: "Location",
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor("rating", {
      header: "Rating",
      cell: (info) => <span className="text-slate-900">{info.getValue()}/5</span>,
    }),
    columnHelper.accessor("review", {
      header: "Review",
      enableSorting: false,
      cell: (info) => <span className="text-slate-600 max-w-md block">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => (row.isVisible ? "visible" : "hidden"), {
      id: "status",
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(item)}
              className="text-xs px-3 py-1.5 rounded-lg border border-black/[0.08] text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB]/30 hover:bg-[#2563EB]/10 transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => toggleVisibility(item)}
              disabled={togglingId === item._id}
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all disabled:opacity-40"
              title={item.isVisible ? "Hide" : "Show"}
            >
              {togglingId === item._id ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              ) : item.isVisible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => handleDelete(item._id)}
              disabled={deletingId === item._id}
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
    }),
  ], [togglingId, deletingId])

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Testimonials</h1>
        <p className="text-sm text-slate-400 mt-1">Manage guest feedback visibility for your storefront.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="luxury-card p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Total Testimonials</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{rows.length}</p>
        </div>
        <div className="luxury-card p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Visible</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{visibleCount}</p>
        </div>
        <div className="luxury-card p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Hidden</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{rows.length - visibleCount}</p>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder="Search testimonials..."
        pageSize={10}
        emptyTitle="No testimonials yet"
        emptyDescription="Guest testimonials will appear here once submitted."
      />

      {editingId !== null && (
        <div className="luxury-card overflow-hidden">
          <div className="m-5 luxury-card-soft p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Edit Testimonial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Guest Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Location</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Rating (1-5)</label>
                <input
                  type="number" min="1" max="5"
                  value={form.rating}
                  onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="luxury-input mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Review</label>
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
                disabled={savingEdit}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={cancelEdit}
                className="ghost-button px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </div>
  )
}

export default TestimonialsManagement
