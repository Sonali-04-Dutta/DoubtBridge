import { useEffect, useState } from "react";
import { FaCalendarCheck, FaClock, FaGraduationCap, FaLanguage, FaStar } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import StatusDot from "../../components/common/StatusDot";
import { canBookTeacherStatus, teacherStatusMessage } from "../../components/teacher/TeacherStatusBadge";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";

const TeacherProfilePage = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/teachers/${id}`);
        setTeacher(data.teacher || null);
        setReviews(data.reviews || []);
      } catch (_error) {
        setError("Teacher profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (!teacher?.userId) return undefined;
    connectSocket();
    const onStatus = (payload) => {
      if (String(payload?.userId) !== String(teacher.userId)) return;
      setTeacher((prev) => prev ? { ...prev, status: payload.status, availability: payload.status } : prev);
    };
    socket.on("teacher:status-updated", onStatus);
    socket.on("teacher:presence", onStatus);
    return () => {
      socket.off("teacher:status-updated", onStatus);
      socket.off("teacher:presence", onStatus);
    };
  }, [teacher?.userId]);

  if (loading) return <div className="py-16 text-center text-slate-600">Loading teacher profile...</div>;
  if (error || !teacher) return <div className="rounded-2xl bg-rose-50 px-4 py-8 text-center text-rose-600">{error || "Teacher not found."}</div>;
  const teacherStatus = teacher.status || teacher.availability || "offline";
  const canBook = canBookTeacherStatus(teacherStatus);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <GlassCard className="overflow-hidden p-0" hover={false}>
          <div className="bg-gradient-to-r from-brand-700/85 via-brand-600/80 to-brand-500/75 px-6 py-8 text-white md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={teacher.avatarUrl} name={teacher.name} className="h-20 w-20 border-white/40" textClassName="text-lg" />
                <div>
                  <h1 className="text-3xl font-extrabold">{teacher.name}</h1>
                  <p className="mt-1 text-sm text-white/90">{teacher.subjects?.join(", ") || "General"}</p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1">
                      <FaStar className="text-amber-300" />
                      {Number(teacher.rating || 0).toFixed(1)} ({teacher.ratingCount || 0} reviews)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1">
                      <FaClock />
                      {teacher.experience || 0}+ years
                    </span>
                  </div>
                </div>
              </div>
              <StatusDot status={teacherStatus} />
            </div>
          </div>

          <div className="space-y-4 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {teacher.bio || "Passionate teacher focused on clarity-first explanations and practical problem solving."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaGraduationCap className="text-brand-600" />
                  {teacher.qualifications || "Not specified yet"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaLanguage className="text-brand-600" />
                  {teacher.languages?.length ? teacher.languages.join(", ") : "Not specified"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Subjects</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {teacher.subjects?.length ? (
                  teacher.subjects.map((subject) => (
                    <span key={subject} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
                      {subject}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No subjects added yet.</span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-slate-900">Student Reviews</h3>
          <div className="mt-4 space-y-3">
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-white/70 bg-white/75 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={review.student_name} className="h-10 w-10" textClassName="text-xs" />
                    <p className="text-sm font-semibold text-slate-900">
                      {review.student_name} | {review.rating}/5
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{review.review || "Great session"}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">No reviews yet. Be the first student to review.</p>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-slate-900">Session Pricing</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
              <span>15 minutes</span>
              <span className="font-bold text-brand-700">Rs. {teacher.pricing?.min15}</span>
            </p>
            <p className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
              <span>30 minutes</span>
              <span className="font-bold text-brand-700">Rs. {teacher.pricing?.min30}</span>
            </p>
            <p className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
              <span>45 minutes</span>
              <span className="font-bold text-brand-700">Rs. {teacher.pricing?.min45}</span>
            </p>
            <p className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
              <span>60 minutes</span>
              <span className="font-bold text-brand-700">Rs. {teacher.pricing?.min60}</span>
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-brand-50 px-3 py-3 text-xs text-brand-800">
            <p className="font-semibold">Availability</p>
            <p className="mt-1 capitalize">{teacherStatus.replaceAll("_", " ")}</p>
            {!canBook ? <p className="mt-2 font-semibold text-brand-700">{teacherStatusMessage(teacherStatus)}</p> : null}
          </div>

          <Link
            to={`/student/booking/${teacher.id}`}
            onClick={(event) => {
              if (!canBook) event.preventDefault();
            }}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-glow transition ${canBook ? "bg-brand-600 hover:bg-brand-700" : "bg-slate-400"}`}
          >
            <FaCalendarCheck />
            Book Session
          </Link>
        </GlassCard>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
