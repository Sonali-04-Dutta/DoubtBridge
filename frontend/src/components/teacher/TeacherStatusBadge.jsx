const STATUS_META = {
  online: { label: "Online", dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50" },
  offline: { label: "Offline", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  busy: { label: "Busy", dot: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  in_session: { label: "In Session", dot: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50" },
  away: { label: "Away", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  not_accepting_sessions: { label: "Not Accepting", dot: "bg-slate-500", text: "text-slate-700", bg: "bg-slate-100" }
};

export const teacherStatusMessage = (status) => {
  const map = {
    in_session: "Teacher is currently in another live class",
    busy: "Teacher is busy right now",
    away: "Teacher is taking a short break",
    not_accepting_sessions: "Teacher is not accepting sessions right now",
    offline: "Teacher is offline right now"
  };
  return map[status] || "";
};

export const canBookTeacherStatus = (status) => status === "online";

const TeacherStatusBadge = ({ status = "offline", compact = false }) => {
  const meta = STATUS_META[status] || STATUS_META.offline;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${meta.bg} ${meta.text}`}>
      <span className="relative flex h-2.5 w-2.5">
        {status === "online" || status === "in_session" ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-50`} />
        ) : null}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dot} shadow-[0_0_12px_currentColor]`} />
      </span>
      {compact ? meta.label : `● ${meta.label}`}
    </span>
  );
};

export default TeacherStatusBadge;
