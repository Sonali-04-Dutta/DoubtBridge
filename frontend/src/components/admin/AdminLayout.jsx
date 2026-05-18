import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaBookOpen, FaChalkboardTeacher, FaChartPie, FaCreditCard, FaGraduationCap, FaMoon, FaPowerOff, FaRedo, FaSearch, FaSun, FaTimes, FaUsers, FaVideo } from "react-icons/fa";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: FaChartPie },
  { label: "Teachers", href: "/admin/teachers", icon: FaChalkboardTeacher },
  { label: "Students", href: "/admin/students", icon: FaUsers },
  { label: "Bookings", href: "/admin/bookings", icon: FaBookOpen },
  { label: "Payments", href: "/admin/payments", icon: FaCreditCard },
  { label: "Live Classes", href: "/admin/live-classes", icon: FaVideo },
  { label: "Refunds", href: "/admin/refunds", icon: FaRedo }
];

const searchDataset = [
  { type: "Teacher", label: "Teacher approvals", description: "Review pending mentor applications", href: "/admin/teachers" },
  { type: "Teacher", label: "Teacher growth", description: "View mentor acquisition and status", href: "/admin/dashboard" },
  { type: "Booking", label: "Recent bookings", description: "Track student sessions and payments", href: "/admin/bookings" },
  { type: "Booking", label: "Live classes", description: "Monitor active classrooms", href: "/admin/live-classes" },
  { type: "Payment", label: "Payment updates", description: "Revenue, failures, and refunds", href: "/admin/payments" },
  { type: "Refund", label: "Refund queue", description: "Inspect refund requests", href: "/admin/refunds" }
];

const AdminLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, unreadMessages, markRead, markAllRead, darkMode, toggleDarkMode } = useNotifications();
  const [query, setQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const panelRef = useRef(null);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return searchDataset.filter((item) => `${item.type} ${item.label} ${item.description}`.toLowerCase().includes(value)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const onClick = (event) => {
      if (!panelRef.current?.contains(event.target)) setNotificationOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderNav = (compact = false) => (
    <nav className={compact ? "flex gap-2 overflow-x-auto pb-1" : "min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 soft-scrollbar"}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }}>
            <NavLink
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `${compact ? "flex shrink-0" : "flex"} group items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition duration-200 ${
                  isActive
                    ? "bg-white text-brand-700 shadow-[0_12px_34px_rgba(123,53,240,.22)] ring-1 ring-brand-200 dark:bg-slate-900 dark:text-brand-100 dark:ring-white/10"
                    : "text-slate-600 hover:-translate-y-0.5 hover:bg-white/75 hover:text-brand-700 hover:shadow-card dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`
              }
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110 dark:bg-brand-500/15 dark:text-brand-200">
                <Icon />
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          </motion.div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f3ff] text-slate-900 transition dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(196,163,255,.34),transparent_28%),radial-gradient(circle_at_65%_92%,rgba(143,79,255,.13),transparent_32%)] dark:opacity-60" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-5 lg:block">
        <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-white/80 bg-white/68 p-4 shadow-[0_24px_70px_rgba(100,40,200,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/72">
          <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-fuchsia-400 p-4 text-white shadow-glow">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl"><FaGraduationCap /></span>
              <div><p className="text-xs font-bold uppercase text-white/80">DoubtBridge</p><h1 className="text-lg font-extrabold">Admin Studio</h1></div>
            </div>
          </motion.div>
          <div className="my-4 rounded-3xl border border-brand-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Today's desk</p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Approvals, refunds, classes</p>
          </div>
          {renderNav()}
          <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm font-bold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
            <FaPowerOff /> Logout
          </button>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 px-4 py-4 backdrop-blur md:px-8">
          <div className="rounded-[26px] border border-white/80 bg-white/75 px-4 py-4 shadow-card backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/78">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-500">Secure operations</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-950 dark:text-white">{title}</h2>
                  {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p> : null}
                </div>
                <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="grid h-11 w-11 place-items-center rounded-2xl border border-brand-100 bg-white/80 text-brand-700 shadow-sm lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white">
                  {mobileMenuOpen ? <FaTimes /> : <FaGraduationCap />}
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <label className="flex min-w-0 items-center gap-2 rounded-2xl border border-brand-100 bg-white/85 px-3 py-2 shadow-sm sm:w-80 dark:border-white/10 dark:bg-white/10">
                    <FaSearch className="text-brand-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search teachers, bookings..." />
                  </label>
                  {results.length ? (
                    <div className="absolute left-0 right-0 top-12 z-40 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                      {results.map((item) => (
                        <button key={item.label} onClick={() => { navigate(item.href); setQuery(""); }} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-brand-50 dark:hover:bg-white/10">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-500">{item.type}</span>
                          <span className="block text-sm font-extrabold text-slate-900 dark:text-white">{item.label}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-300">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="relative" ref={panelRef}>
                  <button onClick={() => setNotificationOpen((prev) => !prev)} className="relative grid h-11 w-11 place-items-center rounded-2xl border border-brand-100 bg-white/85 text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <FaBell />
                    {unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
                  </button>
                  <AnimatePresence>
                    {notificationOpen ? (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="absolute right-0 z-50 mt-3 w-[min(92vw,380px)] rounded-3xl border border-white/80 bg-white/96 p-3 shadow-[0_24px_70px_rgba(30,20,60,.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/96">
                        <div className="flex items-center justify-between px-2 py-1">
                          <div><p className="text-sm font-extrabold">Notifications</p><p className="text-xs text-slate-500 dark:text-slate-300">{unreadCount} unread · {unreadMessages} messages</p></div>
                          <button onClick={markAllRead} className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">Mark read</button>
                        </div>
                        <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1 soft-scrollbar">
                          {notifications.slice(0, 8).map((item) => (
                            <button key={item.id} onClick={() => markRead(item.id)} className={`flex w-full gap-3 rounded-2xl p-3 text-left transition hover:bg-brand-50 dark:hover:bg-white/10 ${item.isRead ? "bg-white/50 dark:bg-white/5" : "bg-brand-50/90 dark:bg-brand-500/10"}`}>
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-lg shadow-sm dark:bg-white/10">{item.icon}</span>
                              <span className="min-w-0"><span className="block truncate text-sm font-extrabold">{item.title}</span><span className="mt-1 line-clamp-2 block text-xs text-slate-500 dark:text-slate-300">{item.message}</span><span className="mt-1 block text-[11px] font-bold text-brand-500">{new Date(item.timestamp).toLocaleString()}</span></span>
                            </button>
                          ))}
                          {!notifications.length ? <p className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">No notifications yet.</p> : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <button onClick={toggleDarkMode} className="grid h-11 w-11 place-items-center rounded-2xl border border-brand-100 bg-white/85 text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/10 dark:text-amber-200" title="Theme toggle">
                  {darkMode ? <FaMoon /> : <FaSun className="text-amber-400" />}
                </button>
                <button type="button" onClick={() => navigate("/profile")} className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white/85 px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/10">
                  <Avatar src={user?.avatar_url} name={user?.name || "Admin"} className="h-11 w-11 ring-4 ring-brand-100" textClassName="text-xs" />
                  <div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{user?.name || "Admin"}</p><p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</p></div>
                </button>
              </div>
            </div>
            {mobileMenuOpen ? <div className="mt-4 lg:hidden">{renderNav(true)}</div> : null}
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-10 pt-3 md:px-8">
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
