import { motion } from "framer-motion";
import { FaCalendarCheck, FaLightbulb, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import GlassCard from "../common/GlassCard";
import TeacherStatusBadge, { canBookTeacherStatus, teacherStatusMessage } from "./TeacherStatusBadge";

const RecommendationTeacherCard = ({ teacher, liveStatus }) => {
  const reasons = teacher?.ai?.reasons || [];
  const status = liveStatus || teacher.status || teacher.availability || "offline";
  const canBook = canBookTeacherStatus(status);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="h-full">
      <GlassCard className="h-full p-5">
        <div className="flex items-start gap-3">
          <Avatar src={teacher.avatarUrl} name={teacher.name} className="h-14 w-14" textClassName="text-sm" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">{teacher.name}</p>
            <p className="truncate text-sm text-brand-700">{teacher.subjects?.join(", ") || "General mentoring"}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
              <FaStar />
              {Number(teacher.rating || 0).toFixed(1)}
            </p>
            <div className="mt-2">
              <TeacherStatusBadge status={status} />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/70 p-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700">
            <FaLightbulb />
            Why this mentor
          </p>
          <div className="mt-2 space-y-1">
            {reasons.length ? (
              reasons.map((reason) => (
                <p key={reason} className="text-xs text-slate-700">
                  {reason}
                </p>
              ))
            ) : (
              <p className="text-xs text-slate-700">Strong overall fit for your learning request.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <p>AI Match Score</p>
          <p className="font-bold text-brand-700">{teacher?.ai?.score || 0}</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to={`/mentors/${teacher.id}`}
            className="rounded-xl border border-brand-200 bg-white/80 px-3 py-2 text-center text-xs font-semibold text-brand-700 transition hover:bg-white"
          >
            View Profile
          </Link>
          <Link
            to={`/student/booking/${teacher.id}`}
            onClick={(event) => {
              if (!canBook) event.preventDefault();
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-glow transition ${canBook ? "bg-brand-600 hover:bg-brand-700" : "bg-slate-400"}`}
          >
            <FaCalendarCheck />
            Book Session
          </Link>
        </div>
        {!canBook ? <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">{teacherStatusMessage(status)}</p> : null}
      </GlassCard>
    </motion.div>
  );
};

export default RecommendationTeacherCard;
