import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { connectSocket, socket } from "../lib/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const iconByType = {
  approved: "\u2705",
  rejected: "\u274c",
  pending: "\u23f3",
  message: "\ud83d\udcac",
  booking: "\ud83d\udcda",
  payment_success: "\ud83d\udcb0",
  payment_failed: "\u26a0\ufe0f",
  payment: "\ud83d\udcb0",
  refund: "\u21a9"
};

const normalizeType = (item = {}) => {
  const raw = String(item.type || item.status || "").toLowerCase();
  if (raw.includes("approve")) return "approved";
  if (raw.includes("reject")) return "rejected";
  if (raw.includes("pending")) return "pending";
  if (raw.includes("message")) return "message";
  if (raw.includes("booking") || raw.includes("session")) return "booking";
  if (raw.includes("refund")) return "refund";
  if (raw.includes("fail")) return "payment_failed";
  if (raw.includes("payment") || raw.includes("success")) return "payment_success";
  return raw || "message";
};

const normalizeNotification = (item) => {
  const type = normalizeType(item);
  return {
    id: item.id || item._id || `${type}-${Date.now()}-${Math.random()}`,
    type,
    icon: item.icon || iconByType[type] || "\ud83d\udcac",
    title: item.title || "DoubtBridge update",
    message: item.message || "You have a new platform update.",
    timestamp: item.createdAt || item.timestamp || new Date().toISOString(),
    isRead: Boolean(item.isRead || item.read),
    actionUrl: item.actionUrl
  };
};

const toastToneByType = {
  payment_success: {
    icon: FaCheckCircle,
    badge: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    border: "border-emerald-100"
  },
  payment_failed: {
    icon: FaExclamationTriangle,
    badge: "bg-rose-50 text-rose-600 ring-rose-100",
    border: "border-rose-100"
  },
  message: {
    icon: FaInfoCircle,
    badge: "bg-brand-50 text-brand-700 ring-brand-100",
    border: "border-brand-100"
  },
  default: {
    icon: FaBell,
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    border: "border-white/70"
  }
};

const playFallbackTone = (success = true) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    gain.connect(ctx.destination);
    [success ? 660 : 220, success ? 880 : 160].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = success ? "sine" : "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.16);
      oscillator.connect(gain);
      oscillator.start(ctx.currentTime + index * 0.16);
      oscillator.stop(ctx.currentTime + index * 0.16 + 0.22);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch (_error) {}
};

const playSound = (src, success = true) => {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.volume = 0.72;
  audio.play().catch(() => playFallbackTone(success));
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("doubtbridge-theme") === "dark");
  const lastIdRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("doubtbridge-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const unreadMessages = useMemo(() => notifications.filter((item) => !item.isRead && item.type === "message").length, [notifications]);

  const addNotification = useCallback((incoming, { popup = true } = {}) => {
    const next = normalizeNotification(incoming);
    if (lastIdRef.current === next.id) return;
    lastIdRef.current = next.id;
    setNotifications((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 80));

    if (next.type === "payment_success") playSound("/sounds/success.mp3", true);
    if (next.type === "payment_failed") playSound("/sounds/fail.mp3", false);
    if (popup) {
      const tone = toastToneByType[next.type] || toastToneByType.default;
      const ToastIcon = tone.icon;
      toast.custom(
        (t) => (
          <div className={`${t.visible ? "animate-[paymentTrustIn_220ms_ease-out]" : "animate-[paymentTrustOut_160ms_ease-in]"} w-[min(390px,calc(100vw-24px))] rounded-2xl border ${tone.border} bg-white/95 p-4 text-slate-900 shadow-card ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-white`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${tone.badge}`}>
                <ToastIcon />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-extrabold leading-5">{next.title}</p>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-full px-2 text-lg leading-5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Dismiss alert"
                  >
                    x
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-300">{next.message}</p>
                {next.actionUrl ? (
                  <a
                    href={next.actionUrl}
                    onClick={() => toast.dismiss(t.id)}
                    className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ),
        { duration: 3600 }
      );
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get("/notifications/my", { params: { limit: 80 } });
    setNotifications((data.notifications || []).map(normalizeNotification));
  }, [user]);

  useEffect(() => {
    loadNotifications().catch(() => {});
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return undefined;
    connectSocket();
    socket.emit("join:user", { userId: user.id });

    const onNotification = (payload) => addNotification(payload);
    const onBooking = (payload) => addNotification({ type: "booking", title: "New booking", message: "A new booking needs attention.", ...payload });
    const onPaymentSuccess = (payload) => addNotification({ type: "payment_success", title: "Payment received", message: "Payment completed successfully.", ...payload });
    const onPaymentFailed = (payload) => addNotification({ type: "payment_failed", title: "Payment failed", message: "A payment attempt did not complete.", ...payload });
    const onRefund = (payload) => addNotification({ type: "refund", title: "Refund update", message: "Refund status changed.", ...payload });

    socket.on("notification:new", onNotification);
    socket.on("booking:created", onBooking);
    socket.on("payment:success", onPaymentSuccess);
    socket.on("payment:failed", onPaymentFailed);
    socket.on("payment:refund", onRefund);
    socket.on("refund:updated", onRefund);
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("booking:created", onBooking);
      socket.off("payment:success", onPaymentSuccess);
      socket.off("payment:failed", onPaymentFailed);
      socket.off("payment:refund", onRefund);
      socket.off("refund:updated", onRefund);
    };
  }, [addNotification, user?.id]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    await api.patch(`/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await api.patch("/notifications/read-all").catch(() => {});
  }, []);

  const value = {
    notifications,
    unreadCount,
    unreadMessages,
    addNotification,
    loadNotifications,
    markRead,
    markAllRead,
    darkMode,
    toggleDarkMode: () => setDarkMode((prev) => !prev)
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
};
