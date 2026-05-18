import { useState } from "react";
import { motion } from "framer-motion";
import { FaCamera, FaSave, FaTimes, FaUserGraduate } from "react-icons/fa";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import { useAuth } from "../../context/AuthContext";

const ProfileSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Please keep profile images under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await updateProfile({ name, avatar_url: avatar });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={avatar} name={name || user?.email} className="h-24 w-24 ring-8 ring-brand-100" textClassName="text-xl" />
          <div>
            <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">{user?.role} profile</p>
            <h1 className="mt-3 text-3xl font-extrabold text-slate-950">Your DoubtBridge Identity</h1>
            <p className="mt-2 text-sm text-slate-500">This avatar appears in navbar, dashboards, chat, bookings, reviews, and live classrooms.</p>
          </div>
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2" hover={false}>
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Display name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-brand-100 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Profile picture</span>
              <div className="mt-2 flex flex-col gap-3 rounded-3xl border border-brand-100 bg-brand-50/50 p-4 sm:flex-row sm:items-center">
                <Avatar src={avatar} name={name || user?.name} className="h-16 w-16 ring-4 ring-white" textClassName="text-sm" />
                <input type="file" accept="image/*" onChange={onImageChange} className="flex-1 text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-bold file:text-white" />
                {avatar ? (
                  <button type="button" onClick={() => setAvatar("")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
                    <FaTimes /> Remove
                  </button>
                ) : null}
              </div>
            </label>

            <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:opacity-60">
              <FaSave /> {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <div className="rounded-[28px] bg-gradient-to-br from-brand-100 to-white p-5 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] bg-white text-5xl text-brand-600 shadow-card">
              <FaUserGraduate />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">Default cute avatar</h2>
            <p className="mt-2 text-sm text-slate-500">No image? DoubtBridge creates a clean initials avatar with a lavender glow automatically.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
