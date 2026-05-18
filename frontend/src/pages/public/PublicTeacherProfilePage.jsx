import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaCalendarCheck, FaClock, FaComments, FaGraduationCap, FaLanguage, FaStar } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import GlassCard from "../../components/common/GlassCard";
import PageLoader from "../../components/common/PageLoader";
import StatusDot from "../../components/common/StatusDot";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const PublicTeacherProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bookingPath = useMemo(() => {
    if (user?.role === "student") {
      return `/student/booking/${id}`;
    }
    return "/login";
  }, [id, user?.role]);

  const askPath = useMemo(() => {
    if (user?.role === "student") {
      return `/messages?teacherId=${id}`;
    }
    return "/login";
  }, [id, user?.role]);

  useEffect(() => {
    const fetchTeacher = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/teachers/${id}`);
        setTeacher(data.teacher || null);
        setReviews(data.reviews || []);
      } catch (_error) {
        setError("We couldn't find this mentor profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  if (loading) return <PageLoader message="Loading mentor profile..." />;
  if (error || !teacher) {
    return (
      <EmptyState
        title="Mentor Not Found"
        description={error || "This profile may have been updated or removed."}
        action={
          <Link to="/mentors" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow">
            Back to Mentors
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <GlassCard className="overflow-hidden p-0" hover={false}>
          <div className="bg-gradient-to-r from-brand-700/85 via-brand-600/80 to-brand-500/75 px-6 py-8 text-white md:px-8">
            <Link to="/mentors" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <FaArrowLeft />
              Back to mentors
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={teacher.avatarUrl} name={teacher.name} className="h-20 w-20 border-white/40" textClassName="text-lg" />
                <div>
                  <h1 className="text-3xl font-extrabold">{teacher.name}</h1>
                  <p className="mt-1 text-sm text-white/90">{teacher.subjects?.join(", ") || "General mentoring"}</p>
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
              <StatusDot status={teacher.availability} />
            </div>
          </div>

          <div className="space-y-4 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Teaching Snapshot</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {teacher.bio || "Concept-focused mentor with practical, step-by-step doubt solving style."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaGraduationCap className="text-brand-600" />
                  {teacher.qualifications || "Will be updated soon"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FaLanguage className="text-brand-600" />
                  {teacher.languages?.length ? teacher.languages.join(", ") : "English"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Subjects Covered</h3>
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
          <h3 className="text-xl font-bold text-slate-900">Recent Student Feedback</h3>
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
                  <p className="mt-1 text-sm text-slate-600">{review.review || "Great session!"}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">
                No public feedback yet. You can be the first to share a review after your session.
              </p>
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
              <span>60 minutes</span>
              <span className="font-bold text-brand-700">Rs. {teacher.pricing?.min60}</span>
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-brand-50 px-3 py-3 text-xs text-brand-800">
            <p className="font-semibold">Live Availability</p>
            <p className="mt-1 capitalize">{teacher.availability || "offline"}</p>
          </div>

          <Link
            to={askPath}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-4 py-3 text-sm font-bold text-brand-700 transition hover:bg-white"
          >
            <FaComments />
            {user?.role === "student" ? "Ask Before Booking" : "Login to Ask"}
          </Link>
          <p className="mt-2 text-center text-xs text-brand-700">6 free messages per mentor before payment</p>

          <Link
            to={bookingPath}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-brand-700"
          >
            <FaCalendarCheck />
            {user?.role === "student" ? "Book Session Now" : "Login to Book"}
          </Link>
        </GlassCard>
      </div>
    </div>
  );
};

export default PublicTeacherProfilePage;
