import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaCalendarCheck, FaChartLine, FaCoins, FaComments, FaFire, FaUserEdit } from "react-icons/fa";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState("offline");
  const [introUnread, setIntroUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);

  const loadBookings = async () => {
    const [bookingsRes, profileRes, notificationRes, notificationsRes] = await Promise.all([
      api.get("/bookings/my"),
      api.get("/teachers/profile").catch(() => ({ data: { teacher: { availability: "offline" } } })),
      api.get("/notifications/unread-count").catch(() => ({ data: { unreadCount: 0 } })),
      api.get("/notifications/my", { params: { limit: 60 } }).catch(() => ({ data: { notifications: [] } }))
    ]);
    setBookings(bookingsRes.data.bookings);
    setAvailability(profileRes.data.teacher?.availability || "offline");
    const notifications = notificationsRes.data.notifications || [];
    setIntroUnread(notifications.filter((item) => !item.isRead && item.type === "message").length);
    setNotificationUnread(notificationRes.data.unreadCount || 0);
  };

  useEffect(() => { loadBookings().catch(() => {}); }, []);
  useEffect(() => {
    connectSocket();
    const activityEvents = ["mousemove", "keydown", "click", "touchstart"];
    let lastActivity = Date.now();
    let awaySent = false;

    const reportActivity = () => {
      lastActivity = Date.now();
      if (awaySent) {
        awaySent = false;
        socket.emit("presence:activity");
      }
    };
    activityEvents.forEach((eventName) => window.addEventListener(eventName, reportActivity, { passive: true }));
    const heartbeat = setInterval(() => {
      if (Date.now() - lastActivity > 10 * 60 * 1000) {
        if (!awaySent) {
          awaySent = true;
          socket.emit("presence:away");
        }
      } else {
        socket.emit("presence:activity");
      }
    }, 30000);

    const onStatus = (payload) => {
      if (String(payload?.userId) === String(user?.id)) {
        setAvailability(payload.status || payload.availability || "offline");
      }
    };
    socket.on("teacher:status-updated", onStatus);
    return () => {
      clearInterval(heartbeat);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, reportActivity));
      socket.off("teacher:status-updated", onStatus);
    };
  }, [user?.id]);

  const updateAvailability = async (next) => {
    setAvailability(next);
    const { data } = await api.patch("/teachers/availability", { availability: next });
    const savedStatus = data.availability || next;
    setAvailability(savedStatus);
    connectSocket();
    socket.emit("presence:update", { status: savedStatus });
  };

  const earnings = useMemo(() => bookings.filter((b) => ["paid", "completed"].includes(b.status)).reduce((sum, b) => sum + Number(b.amount || 0), 0), [bookings]);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar_url} name={user?.name} className="h-12 w-12" textClassName="text-sm" />
          <div>
            <p className="text-sm font-bold text-brand-600">Good to see you, mentor</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user?.name || "Teacher"}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">Manage bookings, earnings, availability, and learner momentum.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-card">
          Status
          <TeacherStatusBadge status={availability} />
          <select
            value={availability}
            onChange={(event) => updateAvailability(event.target.value)}
            className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm font-bold capitalize text-brand-700 outline-none"
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
        </label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-brand-50/90 p-4 dark:bg-brand-500/10"><p className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-100"><FaFire /> Teaching streak</p><p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{Math.max(1, bookings.filter((b) => b.status === "completed").length + 1)} days</p></div>
        <div className="rounded-3xl bg-emerald-50/90 p-4 dark:bg-emerald-500/10"><p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-100"><FaChartLine /> Growth</p><p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{bookings.length * 8}%</p></div>
        <div className="rounded-3xl bg-amber-50/90 p-4 dark:bg-amber-500/10"><p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-100"><FaCalendarCheck /> Calendar</p><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">Upcoming sessions and requests stay synced here.</p></div>
      </div>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5"><p className="flex items-center gap-2 text-sm text-slate-500"><FaCalendarCheck /> Total Requests</p><p className="mt-1 text-2xl font-bold text-brand-700">{bookings.length}</p></GlassCard>
        <GlassCard className="p-5"><p className="flex items-center gap-2 text-sm text-slate-500"><FaBell /> Pending</p><p className="mt-1 text-2xl font-bold text-brand-700">{bookings.filter((b) => b.status === "pending").length}</p></GlassCard>
        <GlassCard className="p-5"><p className="flex items-center gap-2 text-sm text-slate-500"><FaCoins /> Earnings</p><p className="mt-1 text-2xl font-bold text-brand-700">Rs. {earnings}</p></GlassCard>
      </section>
      <section className="grid gap-3 md:grid-cols-6">
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card transition hover:-translate-y-1 dark:bg-white/10 dark:text-brand-100" to="/teacher/profile"><FaUserEdit className="mx-auto mb-2" />Profile Setup</Link>
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card transition hover:-translate-y-1 dark:bg-white/10 dark:text-brand-100" to="/teacher/requests"><FaCalendarCheck className="mx-auto mb-2" />Booking Requests</Link>
        <Link className="relative rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/messages">
          <FaComments className="mx-auto mb-2" />Messages
          {introUnread > 0 ? (
            <span className="absolute right-3 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {introUnread}
            </span>
          ) : null}
        </Link>
        <Link className="relative rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/notifications">
          <FaBell className="mx-auto mb-2" />Notifications
          {notificationUnread > 0 ? (
            <span className="absolute right-3 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {notificationUnread}
            </span>
          ) : null}
        </Link>
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/teacher/earnings">Earnings</Link>
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/teacher/history">Session History</Link>
      </section>
    </div>
  );
};

export default TeacherDashboard;
