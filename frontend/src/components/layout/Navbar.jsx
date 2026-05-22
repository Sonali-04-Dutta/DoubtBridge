import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../../assets/logo.png";
import { FaBars, FaBell, FaBookOpen, FaChevronDown, FaComments, FaDoorOpen, FaTimes, FaUserCircle } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { api } from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import { showPaymentSuccessToast, showRefundToast } from "../../utils/paymentAlerts";

const linkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-white/60"}`;

const Navbar = () => {
  const { user, logout, refreshProfile } = useAuth();
  const { unreadMessages, unreadCount: realtimeUnread } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const menuRef = useRef(null);
  const lastNotificationIdRef = useRef(null);
  const teacherRingTimeoutRef = useRef(null);

  const dashboardLink = useMemo(() => {
    if (!user) return "/";
    return user.role === "student" ? "/student" : user.role === "teacher" ? "/teacher" : "/admin";
  }, [user]);

  useEffect(() => {
    const onTeacherProfileUpdated = () => {
      refreshProfile().catch(() => {});
    };

    window.addEventListener("teacher-profile-updated", onTeacherProfileUpdated);
    return () => window.removeEventListener("teacher-profile-updated", onTeacherProfileUpdated);
  }, [refreshProfile]);

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadUnread = async () => {
      try {
        const { data } = await api.get("/notifications/unread-count");
        setUnreadNotifications(data.unreadCount || 0);
      } catch (_error) {}
    };

    loadUnread();
    const timer = setInterval(loadUnread, 9000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    setUnreadNotifications(realtimeUnread);
  }, [realtimeUnread]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const playTeacherRing = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioContext = new AudioContext();
        const ringDurationSeconds = 15;
        const ringOnce = (offset) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + offset);
          gain.gain.setValueAtTime(0.0001, audioContext.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + offset + 0.42);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(audioContext.currentTime + offset);
          oscillator.stop(audioContext.currentTime + offset + 0.45);
        };

        for (let offset = 0; offset < ringDurationSeconds; offset += 0.75) {
          ringOnce(offset);
        }

        if (teacherRingTimeoutRef.current) {
          clearTimeout(teacherRingTimeoutRef.current);
        }

        teacherRingTimeoutRef.current = setTimeout(() => {
          audioContext.close().catch(() => {});
          teacherRingTimeoutRef.current = null;
        }, (ringDurationSeconds + 1) * 1000);
      } catch (_error) {}
    };

    connectSocket();
    socket.emit("join:user", { userId: user.id });

    const onNotification = (notification) => {
      if (!notification?.id || lastNotificationIdRef.current === notification.id) return;
      lastNotificationIdRef.current = notification.id;
      setUnreadNotifications((count) => count + 1);

      const isPaidSessionAlert =
        user.role === "teacher" &&
        (notification.actionUrl?.startsWith("/session/") || notification.actionUrl?.startsWith("/live-class/")) &&
        ["booking", "payment", "session"].includes(notification.type);

      if (isPaidSessionAlert) {
        playTeacherRing();
        toast.success(notification.title || "Student paid. Join the session now.");
      }
    };
    const onPaidBooking = (booking) => {
      if (user.role !== "teacher") return;
      toast.success("New paid booking received.");
      if (booking?.bookingId) {
        setUnreadNotifications((count) => count + 1);
      }
    };
    const onPaymentSuccess = (payload) => {
      if (user.role === "teacher") {
        playTeacherRing();
      }
      showPaymentSuccessToast(payload);
      setUnreadNotifications((count) => count + 1);
    };
    const onPaymentRefund = (payload) => {
      showRefundToast(payload);
      setUnreadNotifications((count) => count + 1);
      window.dispatchEvent(new CustomEvent("booking-payment-updated", { detail: payload }));
    };
    const onTeacherNoShow = (payload) => {
      window.dispatchEvent(new CustomEvent("booking-payment-updated", { detail: payload }));
    };

                socket.on("notification:new", onNotification);
    socket.on("booking:created", onPaidBooking);
    socket.on("payment:success", onPaymentSuccess);
    socket.on("payment:refund", onPaymentRefund);
    socket.on("teacher:no_show", onTeacherNoShow);
    return () => {
      socket.off("notification:new", onNotification);
      socket.off("booking:created", onPaidBooking);
      socket.off("payment:success", onPaymentSuccess);
      socket.off("payment:refund", onPaymentRefund);
      socket.off("teacher:no_show", onTeacherNoShow);
      if (teacherRingTimeoutRef.current) {
        clearTimeout(teacherRingTimeoutRef.current);
        teacherRingTimeoutRef.current = null;
      }
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role !== "teacher") return undefined;

    let active = true;

    const connectTeacherPresence = async () => {
      try {
        await api.get("/teachers/profile");
        const status = "online";
        if (!active) return;
        connectSocket();
        socket.emit("presence:update", { status });
      } catch (_error) {}
    };

    connectTeacherPresence();

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [user]);

  const setTeacherOffline = () => {
    if (user?.role === "teacher") {
      socket.disconnect();
    }
  };

  const handleLogout = () => {
    setTeacherOffline();
    logout();
    setIsProfileOpen(false);
    setIsMobileOpen(false);
    toast.success("Logged out. See you soon!");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-purple-100 bg-[#f7f2ff]/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link
  to="/"
  className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-brand-700"
>
  
  <img
  src={logo}
  alt="logo"
  className="
    h-14 w-14
    rounded-2xl
    bg-[#f3ecff]
    p-1
    object-contain
    mix-blend-multiply
    transition-all
    duration-300
    hover:scale-110
    hover:rotate-3
    hover:shadow-[0_0_20px_rgba(168,85,247,0.45)]
    animate-[floatLogo_3s_ease-in-out_infinite]
  "
/>
  <span className="bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
  DoubtBridge
</span>
</Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink className={linkClass} to="/">Home</NavLink>
          <NavLink className={linkClass} to="/about">About</NavLink>
          <NavLink className={linkClass} to="/mentors">Our Mentors</NavLink>
          <NavLink className={linkClass} to="/find-teachers">Find Teachers</NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Link className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-700" to="/login">Login</Link>
              <Link className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow" to="/signup">Get Started</Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/messages" className="relative inline-flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-brand-700 shadow-card transition hover:bg-white">
                <FaComments />
                Messages
                {unreadMessages > 0 ? (
                  <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                ) : null}
              </Link>
              <Link to="/notifications" className="relative inline-flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-brand-700 shadow-card transition hover:bg-white">
                <FaBell />
                Alerts
                {Math.max(unreadNotifications, realtimeUnread) > 0 ? (
                  <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {Math.max(unreadNotifications, realtimeUnread) > 99 ? "99+" : Math.max(unreadNotifications, realtimeUnread)}
                  </span>
                ) : null}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl bg-white/75 px-2.5 py-1.5 shadow-card transition hover:bg-white"
                >
                  <Avatar src={user?.avatar_url} name={user?.name} className="h-9 w-9" textClassName="text-xs" />
                  <span className="max-w-[120px] truncate text-sm font-semibold text-slate-700 md:max-w-[180px]">{user.name}</span>
                  <FaChevronDown className={`text-xs text-slate-500 transition ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen ? (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-card backdrop-blur-xl">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{user.role} account</p>
                    <Link
                      to={dashboardLink}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-50"
                    >
                      <FaBookOpen className="text-brand-600" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-50"
                    >
                      <FaUserCircle className="text-brand-600" />
                      Edit Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <FaDoorOpen />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/75 text-brand-700 md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {isMobileOpen ? (
        <div className="border-t border-white/60 bg-white/85 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="grid gap-2">
            <NavLink onClick={() => setIsMobileOpen(false)} className={linkClass} to="/">Home</NavLink>
            <NavLink onClick={() => setIsMobileOpen(false)} className={linkClass} to="/about">About</NavLink>
            <NavLink onClick={() => setIsMobileOpen(false)} className={linkClass} to="/mentors">Our Mentors</NavLink>
            <NavLink onClick={() => setIsMobileOpen(false)} className={linkClass} to="/find-teachers">Find Teachers</NavLink>
          </nav>

          <div className="mt-4 border-t border-white/70 pt-4">
            {!user ? (
              <div className="grid gap-2">
                <Link onClick={() => setIsMobileOpen(false)} className="rounded-xl border border-brand-100 px-4 py-2 text-center text-sm font-semibold text-brand-700" to="/login">
                  Login
                </Link>
                <Link onClick={() => setIsMobileOpen(false)} className="rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-glow" to="/signup">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl border border-brand-100 px-4 py-2 text-center text-sm font-semibold text-brand-700"
                  to="/messages"
                >
                  Messages
                </Link>
                <Link
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl border border-brand-100 px-4 py-2 text-center text-sm font-semibold text-brand-700"
                  to="/notifications"
                >
                  Notifications
                </Link>
                <Link
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-xl border border-brand-100 px-4 py-2 text-center text-sm font-semibold text-brand-700"
                  to={dashboardLink}
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
