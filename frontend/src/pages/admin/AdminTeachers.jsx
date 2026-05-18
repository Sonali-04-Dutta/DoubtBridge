import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaAward, FaBan, FaCheck, FaClock, FaEnvelope, FaRupeeSign, FaTimes } from "react-icons/fa";
import AdminLayout from "../../components/admin/AdminLayout";
import Avatar from "../../components/common/Avatar";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { statusPill } from "./adminHelpers";

const TeacherApplicationCard = ({ teacher, feedback, onFeedback, onAction }) => {
  const profile = teacher.profile || {};
  const approval = profile.approvalStatus || (teacher.isVerifiedTeacher ? "approved" : "pending");

  return (
    <motion.article
      layout
      whileHover={{ y: -5 }}
      className="rounded-[30px] border border-white/80 bg-white/70 p-5 shadow-[0_18px_45px_rgba(100,40,200,.12)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Avatar src={teacher.avatar_url || profile.profileImage} name={teacher.name} className="h-16 w-16 ring-4 ring-brand-100" textClassName="text-sm" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-950">{teacher.name}</h3>
              {statusPill(approval)}
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><FaEnvelope className="text-brand-400" /> {teacher.email}</p>
            <p className="mt-2 text-sm font-semibold text-brand-700">{profile.category || "General"} • {profile.experience || 0} years experience</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:min-w-[360px]">
          {[15, 30, 45, 60].map((slot) => (
            <div key={slot} className="rounded-2xl bg-brand-50 px-3 py-2">
              <p className="text-[11px] font-bold text-brand-400">{slot} min</p>
              <p className="font-extrabold text-brand-700"><FaRupeeSign className="mr-0.5 inline text-xs" />{profile[`price_${slot}`] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl bg-white/75 p-4 xl:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Bio</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{profile.bio || "Teacher has not added a bio yet."}</p>
        </section>
        <section className="rounded-3xl bg-white/75 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Expertise</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(profile.subjects?.length ? profile.subjects : ["Not added"]).map((subject) => (
              <span key={subject} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">{subject}</span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl bg-white/75 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-500"><FaAward /> Qualifications</p>
          <p className="mt-2 text-sm text-slate-600">{profile.qualifications || "Not added"}</p>
        </div>
        <div className="rounded-3xl bg-white/75 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Languages</p>
          <p className="mt-2 text-sm text-slate-600">{profile.languages?.join(", ") || "Not added"}</p>
        </div>
        <div className="rounded-3xl bg-white/75 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Certificates</p>
          {profile.certificates?.length ? (
            <div className="mt-2 space-y-1">
              {profile.certificates.map((certificate, index) => (
                <a key={certificate} href={certificate} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-brand-700 hover:underline">
                  Certificate {index + 1}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No certificates uploaded.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-brand-100 bg-brand-50/70 p-4">
        <label className="text-xs font-bold uppercase tracking-wide text-brand-500">Feedback reason</label>
        <textarea
          value={feedback || ""}
          onChange={(event) => onFeedback(teacher.id, event.target.value)}
          rows={2}
          className="mt-2 w-full resize-none rounded-2xl border border-brand-100 bg-white/85 px-4 py-3 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          placeholder="Add a note for rejection or suspension..."
        />
        {profile.adminFeedback ? <p className="mt-2 text-xs font-semibold text-slate-500">Last feedback: {profile.adminFeedback}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => onAction(teacher, "approve")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5">
          <FaCheck /> Approve
        </button>
        <button onClick={() => onAction(teacher, "reject")} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-100 transition hover:-translate-y-0.5">
          <FaTimes /> Reject
        </button>
        <button onClick={() => onAction(teacher, "suspend")} className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-100 transition hover:-translate-y-0.5">
          <FaBan /> Suspend
        </button>
      </div>
    </motion.article>
  );
};

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [feedbackById, setFeedbackById] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/admin/teachers");
    setTeachers(data.teachers);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    pending: teachers.filter((teacher) => (teacher.profile?.approvalStatus || "pending") === "pending").length,
    approved: teachers.filter((teacher) => teacher.profile?.approvalStatus === "approved" || teacher.isVerifiedTeacher).length,
    rejected: teachers.filter((teacher) => teacher.profile?.approvalStatus === "rejected").length
  }), [teachers]);

  const mutate = async (teacher, action) => {
    try {
      const reason = feedbackById[teacher.id] || "";
      await api.patch(`/admin/teacher/${teacher.id}/${action}`, { reason });
      toast.success(action === "approve" ? "Teacher approved" : action === "reject" ? "Teacher rejected" : "Teacher suspended");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <AdminLayout title="Teacher Applications" subtitle="Review mentor applications with confidence before they go live.">
      {loading ? <PageLoader message="Loading teacher applications..." /> : (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Pending", counts.pending, FaClock],
              ["Approved", counts.approved, FaCheck],
              ["Rejected", counts.rejected, FaTimes]
            ].map(([label, count, Icon]) => (
              <div key={label} className="rounded-[26px] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur-xl">
                <Icon className="text-2xl text-brand-500" />
                <p className="mt-3 text-sm font-bold text-slate-500">{label}</p>
                <p className="text-3xl font-extrabold text-slate-950">{count}</p>
              </div>
            ))}
          </div>

          {teachers.length ? (
            <div className="grid gap-5">
              {teachers.map((teacher) => (
                <TeacherApplicationCard
                  key={teacher.id}
                  teacher={teacher}
                  feedback={feedbackById[teacher.id]}
                  onFeedback={(id, value) => setFeedbackById((prev) => ({ ...prev, [id]: value }))}
                  onAction={mutate}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-10 text-center shadow-card backdrop-blur-xl">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] bg-brand-50 text-5xl">✎</div>
              <h3 className="mt-4 text-xl font-extrabold text-slate-950">No teacher applications yet</h3>
              <p className="mt-2 text-sm text-slate-500">New mentor profiles will appear here for review.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTeachers;
