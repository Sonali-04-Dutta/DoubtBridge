import { useEffect, useMemo, useState } from "react";
import {
  FaBookOpen,
  FaAward,
  FaChalkboardTeacher,
  FaClock,
  FaGlobe,
  FaGraduationCap,
  FaLayerGroup,
  FaPenNib,
  FaRupeeSign,
  FaUpload,
  FaUser,
  FaTimes
} from "react-icons/fa";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import StatusDot from "../../components/common/StatusDot";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const inputClass = "w-full rounded-xl border border-brand-200 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-200/60";
const helperClass = "mt-1 text-xs text-slate-500";

const availabilityOptions = [
  { label: "Available", value: "online" },
  { label: "Busy", value: "busy" },
  { label: "Taking Break", value: "away" },
  { label: "Not Accepting", value: "not_accepting_sessions" }
];

const defaultForm = {
  bio: "",
  subjects: "",
  qualifications: "",
  certificates: "",
  experience: 0,
  languages: "",
  category: "STEM",
  price15: 99,
  price30: 179,
  price45: 259,
  price60: 329,
  profileImage: ""
};

const TeacherProfileSetupPage = () => {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [availability, setAvailability] = useState("offline");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toast, setToast] = useState({ visible: false, text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError("");

      try {
        const { data } = await api.get("/teacher/profile");
        const teacher = data.teacher;
        setForm({
          bio: teacher?.bio || "",
          subjects: teacher?.subjects?.join(", ") || "",
          qualifications: teacher?.qualifications || "",
          certificates: teacher?.certificates?.join(", ") || "",
          experience: Number(teacher?.experience || 0),
          languages: teacher?.languages?.join(", ") || "",
          category: teacher?.category || "STEM",
          price15: Number(teacher?.pricing?.min15 ?? 99),
          price30: Number(teacher?.pricing?.min30 ?? 179),
          price45: Number(teacher?.pricing?.min45 ?? 259),
          price60: Number(teacher?.pricing?.min60 ?? 329),
          profileImage: teacher?.profileImage || teacher?.avatarUrl || ""
        });
        setAvailability(teacher?.availability || "offline");
      } catch (_err) {
        setError("Could not load your existing profile data.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast({ visible: false, text: "" }), 2600);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const parsedSubjects = useMemo(
    () => form.subjects.split(",").map((item) => item.trim()).filter(Boolean),
    [form.subjects]
  );

  const parsedLanguages = useMemo(
    () => form.languages.split(",").map((item) => item.trim()).filter(Boolean),
    [form.languages]
  );

  const displayName = user?.name || "Your Name";
  const previewImage = form.profileImage || user?.avatar_url || "";

  const onImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setError("Image is too large. Please upload an image up to 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, profileImage: String(reader.result || "") }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await api.put("/teacher/profile", {
        ...form,
        subjects: parsedSubjects,
        certificates: form.certificates,
        languages: parsedLanguages,
        availability
      });
      await refreshProfile();
      window.dispatchEvent(new Event("teacher-profile-updated"));
      setMessage("Profile updated successfully.");
      setToast({ visible: true, text: "Profile saved successfully" });
    } catch (_err) {
      setError("Profile update failed. Please check your entries and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast.visible ? (
        <div className="fixed right-5 top-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-card">
          {toast.text}
        </div>
      ) : null}

      <header className="rounded-3xl border border-white/60 bg-white/70 px-6 py-6 shadow-card backdrop-blur-xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Teacher Profile Setup</h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Edit your profile anytime so students always see your latest teaching details.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <form onSubmit={submit} className="space-y-6 xl:col-span-2">
          <GlassCard className="p-5 md:p-6" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <FaUser className="text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaUpload className="text-brand-600" />
                  Profile Image
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-brand-200 bg-white/90 p-3">
                  <Avatar src={previewImage} name={displayName} className="h-14 w-14" textClassName="text-sm" />
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={onImageChange} className="w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:font-semibold file:text-brand-700" />
                    <p className={helperClass}>Upload JPG, PNG, or WEBP up to 1.5 MB.</p>
                  </div>
                  {form.profileImage ? (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, profileImage: "" }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                      aria-label="Remove profile image"
                    >
                      <FaTimes />
                    </button>
                  ) : null}
                </div>
              </label>

              <label className="md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaPenNib className="text-brand-600" />
                  Bio
                </span>
                <textarea
                  rows={4}
                  className={`${inputClass} mt-2 resize-none`}
                  placeholder="Tell students about your teaching style and experience"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
                <p className={helperClass}>Share your strengths, teaching method, and what students can expect from your sessions.</p>
              </label>

              <label>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaLayerGroup className="text-brand-600" />
                  Category
                </span>
                <input
                  className={`${inputClass} mt-2`}
                  placeholder="STEM, Commerce, Coding"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                />
                <p className={helperClass}>Pick the main area students use to discover you.</p>
              </label>

              <label className="md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaAward className="text-brand-600" />
                  Certificates
                </span>
                <input
                  className={`${inputClass} mt-2`}
                  placeholder="Paste certificate links separated by commas"
                  value={form.certificates}
                  onChange={(event) => setForm({ ...form, certificates: event.target.value })}
                />
                <p className={helperClass}>Add certificate links or document URLs for admin approval review.</p>
              </label>

              <label>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaClock className="text-brand-600" />
                  Experience (Years)
                </span>
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-2`}
                  placeholder="3"
                  value={form.experience}
                  onChange={(event) => setForm({ ...form, experience: Number(event.target.value) })}
                />
                <p className={helperClass}>Students trust profiles with clear teaching experience.</p>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-5 md:p-6" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <FaChalkboardTeacher className="text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900">Teaching Details</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaBookOpen className="text-brand-600" />
                  Subjects
                </span>
                <input
                  className={`${inputClass} mt-2`}
                  placeholder="Math, Physics, Chemistry"
                  value={form.subjects}
                  onChange={(event) => setForm({ ...form, subjects: event.target.value })}
                />
                <p className={helperClass}>Separate each subject with a comma so students can search you easily.</p>
              </label>

              <label>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaGraduationCap className="text-brand-600" />
                  Qualifications
                </span>
                <input
                  className={`${inputClass} mt-2`}
                  placeholder="B.Tech, M.Sc Mathematics"
                  value={form.qualifications}
                  onChange={(event) => setForm({ ...form, qualifications: event.target.value })}
                />
                <p className={helperClass}>Include degrees or certifications that build student confidence.</p>
              </label>

              <label className="md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaGlobe className="text-brand-600" />
                  Languages
                </span>
                <input
                  className={`${inputClass} mt-2`}
                  placeholder="English, Bengali, Hindi"
                  value={form.languages}
                  onChange={(event) => setForm({ ...form, languages: event.target.value })}
                />
                <p className={helperClass}>Add every language in which you can teach comfortably.</p>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-5 md:p-6" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <FaRupeeSign className="text-brand-600" />
              <h2 className="text-xl font-bold text-slate-900">Pricing</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-slate-700">15 min session price (Rs.)</span>
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-2`}
                  placeholder="99"
                  value={form.price15}
                  onChange={(event) => setForm({ ...form, price15: Number(event.target.value) })}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">30 min session price (Rs.)</span>
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-2`}
                  placeholder="179"
                  value={form.price30}
                  onChange={(event) => setForm({ ...form, price30: Number(event.target.value) })}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">45 min session price (Rs.)</span>
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-2`}
                  placeholder="259"
                  value={form.price45}
                  onChange={(event) => setForm({ ...form, price45: Number(event.target.value) })}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">1 hour session price (Rs.)</span>
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} mt-2`}
                  placeholder="329"
                  value={form.price60}
                  onChange={(event) => setForm({ ...form, price60: Number(event.target.value) })}
                />
                <p className={helperClass}>Keep pricing balanced to encourage first-time student bookings.</p>
              </label>
            </div>
          </GlassCard>

          <GlassCard className="p-5 md:p-6" hover={false}>
            <div className="mb-4 flex items-center gap-2">
              <StatusDot status={availability} />
              <h2 className="text-xl font-bold text-slate-900">Availability</h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              {availabilityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAvailability(option.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                    availability === option.value
                      ? "border-brand-400 bg-brand-100 text-brand-800 shadow-glow"
                      : "border-brand-200 bg-white/80 text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className={helperClass}>Choose how students should see your current teaching availability.</p>
          </GlassCard>

          <button
            disabled={saving || loadingProfile}
            className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {loadingProfile ? <p className="text-sm text-slate-500">Loading your saved profile...</p> : null}
          {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </form>

        <aside className="xl:sticky xl:top-24 xl:h-fit">
          <GlassCard className="overflow-hidden p-0" hover={false}>
            <div className="bg-gradient-to-r from-brand-700/85 via-brand-600/80 to-brand-500/75 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">Live Preview</p>
              <h3 className="mt-1 text-xl font-bold">How Students See You</h3>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar src={previewImage} name={displayName} className="h-14 w-14 border-white/70" textClassName="text-sm" />
                <div>
                  <p className="text-lg font-bold text-slate-900">{displayName}</p>
                  <p className="text-sm text-brand-700">{parsedSubjects.join(", ") || "Subjects not added"}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/75 p-3 text-sm text-slate-700">
                <p className="line-clamp-4">{form.bio || "Tell students about your teaching style and experience"}</p>
              </div>

              <div className="grid gap-2 text-sm text-slate-700">
                <p className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
                  <span>15 min</span>
                  <span className="font-bold text-brand-700">Rs. {form.price15 || 0}</span>
                </p>
                <p className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
                  <span>30 min</span>
                  <span className="font-bold text-brand-700">Rs. {form.price30 || 0}</span>
                </p>
                <p className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
                  <span>45 min</span>
                  <span className="font-bold text-brand-700">Rs. {form.price45 || 0}</span>
                </p>
                <p className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2">
                  <span>1 hour</span>
                  <span className="font-bold text-brand-700">Rs. {form.price60 || 0}</span>
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <StatusDot status={availability} />
              </div>

              <div className="rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Qualifications</p>
                <p className="mt-1">{form.qualifications || "Add qualifications"}</p>
              </div>

              <div className="rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Languages</p>
                <p className="mt-1">{parsedLanguages.join(", ") || "Add languages"}</p>
              </div>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
};

export default TeacherProfileSetupPage;
