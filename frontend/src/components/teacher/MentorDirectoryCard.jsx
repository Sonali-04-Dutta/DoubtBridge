import { motion } from "framer-motion";
import { FaCalendarCheck, FaComments, FaUserCircle } from "react-icons/fa";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import Avatar from "../common/Avatar";
import GlassCard from "../common/GlassCard";
import TeacherStatusBadge, { canBookTeacherStatus, teacherStatusMessage } from "./TeacherStatusBadge";

const MentorDirectoryCard = ({ teacher, liveStatus }) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState(liveStatus || teacher.status || teacher.availability || "offline");
  const [savingStatus, setSavingStatus] = useState(false);
  const hasStudentAccess = user?.role === "student";
  const isOwnTeacherCard = user?.role === "teacher" && String(user?.id) === String(teacher.userId);
  const canStudentContact = canBookTeacherStatus(availability);

  const updateAvailability = async (nextStatus) => {
    setAvailability(nextStatus);
    setSavingStatus(true);
    try {
      const { data } = await api.patch("/teachers/availability", { availability: nextStatus });
      const savedStatus = data.availability || nextStatus;
      setAvailability(savedStatus);
      connectSocket();
      socket.emit("presence:update", { status: savedStatus });
      toast.success(data.message || `Status changed to ${savedStatus}.`);
    } catch (error) {
      setAvailability(teacher.availability || "offline");
      toast.error(error.response?.data?.message || "Could not update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const guardAvailability = (event) => {
    if (!canStudentContact) {
      event.preventDefault();
      toast.error(teacherStatusMessage(availability) || "This teacher is not available right now. Please try later.");
    }
  };

  useEffect(() => {
    if (liveStatus) setAvailability(liveStatus);
  }, [liveStatus]);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="h-full">
      <GlassCard className="h-full p-5" hover>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={teacher.avatarUrl} name={teacher.name} className="h-14 w-14" textClassName="text-sm" />
            <div>
              <p className="text-lg font-bold text-slate-900">{teacher.name}</p>
              <p className="text-sm text-brand-700">{teacher.subjects?.join(", ") || "General mentoring"}</p>
              <p className="mt-1 text-xs text-slate-500">{teacher.experience || 0}+ years experience</p>
            </div>
          </div>
          {isOwnTeacherCard ? (
            <select
              value={availability}
              onChange={(event) => updateAvailability(event.target.value)}
              disabled={savingStatus}
              className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-xs font-bold capitalize text-brand-700 outline-none disabled:opacity-60"
              aria-label="Change teacher availability"
            >
              {[
                ["online", "Available"],
                ["busy", "Busy"],
                ["away", "Taking Break"],
                ["not_accepting_sessions", "Not Accepting Sessions"]
              ].map(([state, label]) => (
                <option key={state} value={state}>{label}</option>
              ))}
            </select>
          ) : (
            <TeacherStatusBadge status={availability} />
          )}
        </div>

        <p className="mt-4 line-clamp-3 rounded-2xl bg-white/70 p-3 text-sm text-slate-600">
          {teacher.bio || "Personalized, clarity-first mentoring for student progress and confidence."}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Starts at Rs. {teacher.pricing?.min15} / 15 min</p>
          <p className="text-xs font-semibold text-brand-700">{teacher.rating?.toFixed?.(1) || Number(teacher.rating || 0).toFixed(1)} rating</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Link
            to={`/mentors/${teacher.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-white"
          >
            <FaUserCircle />
            Profile
          </Link>
          <Link
            to={hasStudentAccess ? `/messages?teacherId=${teacher.id}` : "/login"}
            onClick={hasStudentAccess ? guardAvailability : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-white"
          >
            <FaComments />
            Ask Before Booking
          </Link>
          <Link
            to={hasStudentAccess ? `/student/booking/${teacher.id}` : "/login"}
            onClick={hasStudentAccess ? guardAvailability : undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-glow transition ${
              canStudentContact ? "bg-brand-600 hover:bg-brand-700" : "bg-slate-400"
            }`}
          >
            <FaCalendarCheck />
            Book Session
          </Link>
        </div>

        <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {canStudentContact ? "6 free student messages per mentor before payment." : teacherStatusMessage(availability)}
        </p>
      </GlassCard>
    </motion.div>
  );
};

export default MentorDirectoryCard;
