import { useState } from "react";
import { motion } from "framer-motion";
import { FaCamera, FaSave, FaTimes, FaUserGraduate } from "react-icons/fa";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import { useAuth } from "../../context/AuthContext";

const avatarPalettes = [
  ["#7b35f0", "#ec4899", "#fde68a"],
  ["#0ea5e9", "#8b5cf6", "#bbf7d0"],
  ["#f97316", "#ef4444", "#fef3c7"],
  ["#14b8a6", "#6366f1", "#fce7f3"],
  ["#84cc16", "#06b6d4", "#ede9fe"]
];

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "DB";

const generateCuteAvatar = (name = "") => {
  const palette = avatarPalettes[Math.floor(Math.random() * avatarPalettes.length)];
  const seed = Math.floor(Math.random() * 100000);
  const initials = getInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="bg" x1="24" y1="18" x2="214" y2="226" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette[0]}"/>
          <stop offset="0.62" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#4c1d95" flood-opacity=".22"/>
        </filter>
      </defs>
      <rect width="240" height="240" rx="78" fill="url(#bg)"/>
      <circle cx="${48 + (seed % 38)}" cy="54" r="34" fill="#ffffff" opacity=".22"/>
      <circle cx="${168 + (seed % 22)}" cy="${52 + (seed % 18)}" r="18" fill="#ffffff" opacity=".2"/>
      <path d="M31 180c30-34 62-51 97-51s61 17 81 51c-20 25-50 38-90 38s-69-13-88-38Z" fill="#fff" opacity=".24"/>
      <g filter="url(#soft)">
        <circle cx="120" cy="106" r="58" fill="#fff" opacity=".92"/>
        <circle cx="98" cy="101" r="8" fill="#32154f"/>
        <circle cx="142" cy="101" r="8" fill="#32154f"/>
        <path d="M98 129c14 13 30 13 44 0" fill="none" stroke="#32154f" stroke-width="8" stroke-linecap="round"/>
        <circle cx="77" cy="120" r="12" fill="#fb7185" opacity=".45"/>
        <circle cx="163" cy="120" r="12" fill="#fb7185" opacity=".45"/>
      </g>
      <text x="120" y="210" text-anchor="middle" font-family="Sora, Arial, sans-serif" font-size="32" font-weight="800" fill="#fff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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

  const onGenerateAvatar = () => {
    setAvatar(generateCuteAvatar(name || user?.name || user?.email));
    toast.success("Cute avatar generated. Save your profile to keep it.");
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
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur-xl sm:rounded-[32px] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={avatar} name={name || user?.email} className="h-24 w-24 ring-8 ring-brand-100" textClassName="text-xl" />
          <div>
            <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">{user?.role} profile</p>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-950 sm:text-3xl">Your DoubtBridge Identity</h1>
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
                <input type="file" accept="image/*" onChange={onImageChange} className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-2xl file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:font-bold file:text-white" />
                {avatar ? (
                  <button type="button" onClick={() => setAvatar("")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow-sm">
                    <FaTimes /> Remove
                  </button>
                ) : null}
              </div>
            </label>

            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto">
              <FaSave /> {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6" hover={false}>
          <button type="button" onClick={onGenerateAvatar} className="group w-full rounded-[28px] bg-gradient-to-br from-brand-100 to-white p-5 text-center transition hover:-translate-y-1 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-brand-100">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] bg-white text-5xl text-brand-600 shadow-card">
              <FaUserGraduate />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">Default cute avatar</h2>
            <p className="mt-2 text-sm text-slate-500">Click to generate a playful profile avatar, then save your profile.</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-glow transition group-hover:bg-brand-700">
              <FaCamera /> Generate avatar
            </span>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
