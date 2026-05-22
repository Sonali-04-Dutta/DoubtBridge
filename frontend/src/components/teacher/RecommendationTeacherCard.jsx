import { motion } from "framer-motion";
import { FaCalendarCheck, FaClock, FaGlobe, FaLightbulb, FaRupeeSign, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import GlassCard from "../common/GlassCard";
import TeacherStatusBadge, { canBookTeacherStatus, teacherStatusMessage } from "./TeacherStatusBadge";

const RecommendationTeacherCard = ({ teacher, liveStatus }) => {
  const reasons = teacher?.ai?.reasons || [];
  const status = liveStatus || teacher.status || teacher.availability || "offline";
  const canBook = canBookTeacherStatus(status);
  const matchPercentage = teacher?.ai?.matchPercentage || Math.min(99, Math.round(Number(teacher?.ai?.score || 0)));
  const price = teacher?.pricePerSession || teacher?.pricing?.min30 || teacher?.pricing?.min15 || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="h-full">
      <GlassCard className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
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
          <div className="shrink-0 rounded-2xl bg-brand-600 px-3 py-2 text-center text-white shadow-glow">
            <p className="text-lg font-extrabold leading-none">{matchPercentage}%</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/80">Match</p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
          {matchPercentage}% Match
          {reasons[1] ? ` • ${reasons[1]}` : ""}
          {teacher.languages?.[0] ? ` • ${teacher.languages[0]} Available` : ""}
        </p>
        {teacher?.ai?.outOfBudget ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
            Teacher found, but out of your budget. Session starts at Rs. {teacher.ai.mentorPrice || price}.
          </p>
        ) : null}

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

        <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <p className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
            <FaRupeeSign className="text-brand-600" />
            <span className="font-bold text-slate-800">Rs. {price}</span>
          </p>
          <p className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
            <FaClock className="text-brand-600" />
            <span className="font-bold text-slate-800">{teacher.yearsExperience || teacher.experience || 0} yrs</span>
          </p>
          <p className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 sm:col-span-2">
            <FaGlobe className="text-brand-600" />
            <span className="truncate font-bold text-slate-800">{teacher.languages?.join(", ") || "Language not added"}</span>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(teacher.topics || []).slice(0, 3).map((topic) => (
            <span key={topic} className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-slate-600">
              {topic}
            </span>
          ))}
          {(teacher.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              {tag}
            </span>
          ))}
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
