import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { destinationLocaleConfig } from "../assets/assets";
import { User, Mail, Phone, Coins, Globe, Calendar, Save, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CURRENCIES = Object.values(destinationLocaleConfig).reduce((acc, cfg) => {
  const key = cfg.currencyCode;
  if (!acc.find((c) => c.code === key)) acc.push({ code: key, name: cfg.currency });
  return acc;
}, []).sort((a, b) => a.code.localeCompare(b.code));

const Profile = () => {
  const { axios } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    country: "",
    preferredLanguage: "en",
    preferredCurrency: "USD",
  });

  useEffect(() => {
    document.title = "Profile — SmartStayX";
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/user");
        if (data.success) {
          setProfile({
            name: data.user?.name || "",
            email: data.user?.email || "",
            phone: data.profile?.phone || "",
            dateOfBirth: data.profile?.dateOfBirth ? data.profile.dateOfBirth.split("T")[0] : "",
            country: data.profile?.country || "",
            preferredLanguage: data.profile?.preferredLanguage || "en",
            preferredCurrency: data.profile?.preferredCurrency || "USD",
          });
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(
        "/api/user/profile",
        {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          country: profile.country,
          preferredLanguage: profile.preferredLanguage,
          preferredCurrency: profile.preferredCurrency,
        },
      );
      if (data.success) {
        toast.success("Profile updated");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-start justify-center">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin mt-20" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-60" />
      <div className="relative mx-auto max-w-2xl px-4 md:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-[#2563EB]/15 to-[#2563EB]/5 border border-[#2563EB]/20 flex items-center justify-center">
            <User className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h1 className="text-2xl font-playfair text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your personal information and preferences</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card overflow-hidden p-6 md:p-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="luxury-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="luxury-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="luxury-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    className="luxury-input booking-date-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    placeholder="United States"
                    className="luxury-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Preferred Currency</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={profile.preferredCurrency}
                    onChange={(e) => setProfile({ ...profile, preferredCurrency: e.target.value })}
                    className="luxury-select pl-10"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <div className="mb-4 rounded-2xl border border-black/[0.06] bg-[#f4f2ef] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Password security</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your password from your secure account settings.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-black/[0.08] px-4 py-2 text-xs uppercase tracking-[0.16em] text-slate-600">
                  <ShieldCheck className="w-4 h-4" />
                  Change Password via your account settings
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="gold-button w-full flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-[0.18em] disabled:opacity-70"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
