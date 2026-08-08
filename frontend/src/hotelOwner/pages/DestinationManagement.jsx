// DestinationManagement — Owner panel for managing travel destinations and their metadata
import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Globe,
  Thermometer,
  Building2,
  MapPin,
  Star,
  Search,
} from "lucide-react";

// emptyForm — Default empty destination form state
const emptyForm = {
  name: "",
  description: "",
  hotelCount: "",
  temperature: "",
  country: "",
  featured: false,
  image: null,
};

// DestinationManagement — Create, edit, delete, and list travel destinations with CRUD table
const DestinationManagement = () => {
  const { axios, getToken, user } = useAppContext();

  const [destinations, setDestinations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  // safeUrl — Returns the URL only if it starts with http or blob
  const safeUrl = (url) =>
    url && (url.startsWith("http") || url.startsWith("blob:")) ? url : "";

  // fetchDestinations — Loads all destinations from the API
  const fetchDestinations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/destinations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setDestinations(data.destinations || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, [user, axios, getToken]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  // resetForm — Clears the form and exits editing mode
  const resetForm = () => {
    setForm(emptyForm);
    setPreview("");
    setEditingId(null);
    setShowForm(false);
  };

  // startCreate — Opens the form for creating a new destination
  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  // startEdit — Populates the form with destination data for editing
  const startEdit = (dest) => {
    setEditingId(dest._id);
    setForm({
      name: dest.name || "",
      description: dest.description || "",
      hotelCount: dest.hotelCount || "",
      temperature: dest.temperature || "",
      country: dest.country || "",
      featured: dest.featured || false,
      image: null,
    });
    setPreview(safeUrl(dest.image) || "");
    setShowForm(true);
  };

  // handleImageChange — Updates destination image preview on file selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    setPreview(safeUrl(URL.createObjectURL(file)));
  };

  // handleSubmit — Creates or updates a destination via API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Destination name is required");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("description", form.description);
      payload.append("hotelCount", form.hotelCount);
      payload.append("temperature", form.temperature);
      payload.append("country", form.country);
      payload.append("featured", form.featured);
      if (form.image) payload.append("image", form.image);

      let response;
      if (editingId) {
        response = await axios.put(`/api/destinations/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post("/api/destinations", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message || "Destination saved");
        resetForm();
        await fetchDestinations();
      } else {
        toast.error(data.message || "Failed to save destination");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  // handleDelete — Opens confirm modal before deleting a destination
  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  // handleDeleteConfirmed — Executes the actual deletion after confirmation
  const handleDeleteConfirmed = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ open: false, id: null });
    if (!id) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/api/destinations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Destination deleted");
        await fetchDestinations();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Destination Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create and manage travel destinations featured on your platform.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="gold-button flex items-center gap-2 px-4 py-2.5 text-xs"
        >
          <Plus className="w-4 h-4" />
          Add Destination
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:border-[#2563EB]/40 transition-colors"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="luxury-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {editingId ? "Edit Destination" : "New Destination"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1.5">Destination Image</p>
                <label
                  htmlFor="dest-image"
                  className="block border border-dashed border-black/[0.1] rounded-xl p-2 cursor-pointer hover:bg-black/[0.02] transition"
                >
                  <img
                    src={preview || "https://placehold.co/400x300?text=No+Image"}
                    alt="preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </label>
                <input
                  id="dest-image"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1.5">Destination Name</p>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="luxury-input text-sm"
                    required
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1.5">Country</p>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                      className="luxury-input text-sm pl-8"
                      placeholder="e.g. Maldives"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1.5">Hotel Count</p>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      value={form.hotelCount}
                      onChange={(e) => setForm((prev) => ({ ...prev, hotelCount: e.target.value }))}
                      className="luxury-input text-sm pl-8"
                      placeholder="e.g. 32 resorts"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1.5">Temperature</p>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      value={form.temperature}
                      onChange={(e) => setForm((prev) => ({ ...prev, temperature: e.target.value }))}
                      className="luxury-input text-sm pl-8"
                      placeholder="e.g. 29°C"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500 mb-1.5">Description</p>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="luxury-input text-sm h-24 resize-none"
                  placeholder="Describe the destination..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-black/[0.1] bg-white text-[#2563EB] focus:ring-[#2563EB]/30"
                />
                <Star className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-sm text-slate-600">Featured destination</span>
              </label>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="gold-button px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Destination" : "Create Destination"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="ghost-button px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {(() => {
        const filteredDestinations = destinations.filter((d) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
        });
        return (
      <div className="luxury-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#f4f2ef]">
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Image</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Country</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Details</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Featured</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDestinations.map((dest) => (
                <tr
                  key={dest._id}
                  className="border-t border-black/[0.06] hover:bg-black/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <img
                      src={dest.image || "https://placehold.co/60x40?text=No+Img"}
                      alt={dest.name}
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-medium">{dest.name}</td>
                  <td className="py-3 px-4 text-slate-600">{dest.country}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="text-xs">{dest.hotelCount}</span>
                    {dest.temperature && (
                      <span className="text-xs ml-2 text-slate-400">| {dest.temperature}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {dest.featured ? (
                      <span className="text-[#2563EB] text-xs">Featured</span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(dest)}
                        className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-[#2563EB] hover:border-[#2563EB]/30 hover:bg-[#2563EB]/10 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dest._id)}
                        disabled={deletingId === dest._id}
                        className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40 disabled:pointer-events-none"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="w-5 h-5 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
            <span className="ml-3 text-sm text-slate-400">Loading destinations...</span>
          </div>
        )}

        {!loading && filteredDestinations.length === 0 && (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm">No destinations yet. Create your first one!</p>
          </div>
        )}
      </div>
        )})()}

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Destination"
        message="Are you sure you want to delete this destination?"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </motion.div>
  );
};

export default DestinationManagement;
