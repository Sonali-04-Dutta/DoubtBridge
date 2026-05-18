import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaBell, FaCheckDouble, FaShieldAlt, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import GlassCard from "../../components/common/GlassCard";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { useNotifications } from "../../context/NotificationContext";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationStore = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => Math.max(notificationStore.unreadCount, notifications.filter((item) => !item.isRead).length),
    [notificationStore.unreadCount, notifications]
  );

  const formatTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const { data } = await api.get("/notifications/my");
      setNotifications(data.notifications || []);
    } catch (requestError) {
      if (!silent) {
        setError(requestError.response?.data?.message || "Could not load notifications.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
    } catch (_error) {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (_error) {
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => loadNotifications({ silent: true }), 8000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <PageLoader message="Loading notifications..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Notifications unavailable"
        description={error}
        action={
          <button
            type="button"
            onClick={() => loadNotifications()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
              <FaBell />
              Notifications
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Activity Updates</h1>
            <p className="mt-1 text-sm text-slate-600">{unreadCount} unread notifications</p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            <FaCheckDouble />
            Mark all read
          </button>
        </div>
      </motion.div>

      <GlassCard className="p-4" hover={false}>
        <div className="space-y-3">
          {notifications.length ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition ${
                  item.isRead
                    ? "border-white/70 bg-white/70"
                    : item.type === "payment"
                      ? "border-amber-200 bg-gradient-to-br from-white/90 via-amber-50/80 to-brand-50/70 shadow-[0_16px_45px_rgba(217,158,54,0.16)]"
                      : "border-brand-200 bg-brand-50/80"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.type === "payment" ? "bg-gradient-to-br from-amber-400 to-brand-600 text-white" : "bg-brand-100 text-brand-700"}`}>
                      {item.type === "payment" ? <FaShieldAlt /> : <FaBell />}
                    </span>
                    <div>
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                      {item.title}
                      {item.type === "payment" ? <FaStar className="text-amber-400" /> : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                    <p className="mt-2 text-xs font-semibold text-brand-700">{formatTime(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="rounded-lg border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700"
                      >
                        Mark read
                      </button>
                    ) : null}
                    {item.actionUrl ? (
                      <Link to={item.actionUrl} className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                        Open
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-white/75 px-3 py-3 text-sm text-slate-600">
              No notifications yet. New messages, bookings, payments, and session reminders will appear here.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default NotificationsPage;
