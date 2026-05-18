import { motion } from "framer-motion";
import { FaBookOpen, FaCalendarCheck, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";
import GlassCard from "../common/GlassCard";
import StatusDot from "../common/StatusDot";

const TeacherCard = ({ teacher, profilePathBase = "/teachers", ctaLabel = "Book Session" }) => {
  const fifteenMinPrice = teacher?.pricing?.min15 || teacher?.price_15 || 99;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="h-full"
    >
      <GlassCard className="h-full p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar src={teacher?.avatarUrl} name={teacher?.name || "Teacher"} className="h-14 w-14" textClassName="text-sm" />
            <div>
              <p className="text-lg font-bold text-slate-900">{teacher.name}</p>
              <p className="text-sm text-brand-700">{teacher.subjects?.join(", ") || "General"}</p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                  <FaStar />
                  {Number(teacher.rating || 0).toFixed(1)}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-slate-600">
                  {teacher.experience || 0}+ yrs
                </span>
              </div>
            </div>
          </div>
          <StatusDot status={teacher.availability} />
        </div>

        <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm text-slate-700 shadow-inner">
          <p className="line-clamp-3">{teacher.bio || "Focused doubt-solving mentor for exam and assignment support."}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Starts from</p>
            <p className="text-lg font-bold text-brand-700">Rs. {fifteenMinPrice} / 15 min</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {teacher.ratingCount || 0} reviews
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            to={`${profilePathBase}/${teacher.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white/70 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-white"
          >
            <FaBookOpen className="text-xs" />
            View Profile
          </Link>
          <Link
            to={`/student/booking/${teacher.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
          >
            <FaCalendarCheck className="text-xs" />
            {ctaLabel}
          </Link>
        </div>

        <div className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-xs text-slate-600">
          Available: <span className="font-semibold capitalize text-slate-700">{teacher.availability || "offline"}</span>
          {teacher.qualifications ? <span className="ml-2">| {teacher.qualifications}</span> : null}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default TeacherCard;
