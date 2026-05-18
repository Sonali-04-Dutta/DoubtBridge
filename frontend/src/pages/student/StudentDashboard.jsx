import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaBolt, FaCalendarAlt, FaCheckCircle, FaClock, FaFire, FaGraduationCap, FaReceipt, FaRupeeSign, FaSearch, FaStar, FaVideo } from "react-icons/fa";
import Avatar from "../../components/common/Avatar";
import GlassCard from "../../components/common/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const formatDate = (date) => {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
};

const getStatusClass = (status) => {
  const classes = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-sky-100 text-sky-700",
    paid: "bg-emerald-100 text-emerald-700",
    completed: "bg-brand-100 text-brand-700",
    rejected: "bg-rose-100 text-rose-700"
  };

  return classes[status] || "bg-slate-100 text-slate-700";
};

const isJoinWindowOpen = (booking) => {
  if (!booking?.join_deadline_at) return true;
  return new Date(booking.join_deadline_at).getTime() > Date.now();
};

const canStudentJoin = (booking) =>
  booking.status === "paid" &&
  ["scheduled", "live"].includes(booking.session_status) &&
  !booking.student_joined_at &&
  isJoinWindowOpen(booking);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/bookings/my");
      setBookings(data.bookings || []);
    };
    load().catch(() => {});
    const onBookingPaymentUpdated = () => load().catch(() => {});
    window.addEventListener("booking-payment-updated", onBookingPaymentUpdated);
    return () => window.removeEventListener("booking-payment-updated", onBookingPaymentUpdated);
  }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter((booking) => booking.status === "completed").length;
    const paidOrCompleted = bookings.filter((booking) => ["paid", "completed"].includes(booking.status));
    const totalSpent = paidOrCompleted.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
    const totalMinutes = bookings.reduce((sum, booking) => sum + Number(booking.duration || 0), 0);

    return [
      ["Total Bookings", bookings.length, FaCalendarAlt],
      ["Completed", completed, FaCheckCircle],
      ["Study Time", `${totalMinutes} min`, FaClock],
      ["Money Spent", `Rs. ${totalSpent}`, FaRupeeSign]
    ];
  }, [bookings]);

  const upcomingBookings = useMemo(
    () => bookings.filter((booking) => ["accepted", "paid", "pending"].includes(booking.status) && !["expired", "cancelled"].includes(booking.session_status)).slice(0, 3),
    [bookings]
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar_url} name={user?.name} className="h-12 w-12" textClassName="text-sm" />
          <div>
            <p className="text-sm font-bold text-brand-600">Welcome back, study star</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{user?.name || "Student"}</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">Your next mentor session, streak, and learning actions are ready.</p>
          </div>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-glow" to="/find-teachers">
          <FaSearch /> Find a mentor
        </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-brand-50/90 p-4 dark:bg-brand-500/10"><p className="flex items-center gap-2 text-sm font-bold text-brand-700 dark:text-brand-100"><FaFire /> Study streak</p><p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{Math.max(1, upcomingBookings.length + 2)} days</p></div>
          <div className="rounded-3xl bg-emerald-50/90 p-4 dark:bg-emerald-500/10"><p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-100"><FaGraduationCap /> Progress</p><p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{Math.min(100, bookings.length * 12)}%</p></div>
          <div className="rounded-3xl bg-amber-50/90 p-4 dark:bg-amber-500/10"><p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-100"><FaBolt /> Motivation</p><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">Small doubts solved daily become big confidence.</p></div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <GlassCard key={label} className="p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{label}</p><span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon /></span></div>
            <p className="mt-2 text-2xl font-bold text-brand-700">{value}</p>
          </GlassCard>
        ))}
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/messages">Messages</Link>
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/notifications">Notifications</Link>
        <Link className="rounded-2xl bg-white/80 p-4 text-center text-sm font-bold text-brand-700 shadow-card" to="/find-teachers">Find Mentors</Link>
      </section>
      {upcomingBookings.length ? (
        <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Next Actions</h2>
              <p className="text-sm text-slate-500">Keep recent booking requests and live sessions within reach.</p>
            </div>
            <Link className="text-sm font-bold text-brand-700" to="/find-teachers">Book another</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl bg-brand-50/80 p-4">
                <p className="text-sm font-bold text-slate-900">{booking.teacher_name || "Teacher"}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.duration} min | Rs. {booking.amount}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(booking.status)}`}>{booking.status}</span>
                  {booking.status === "accepted" ? (
                    <Link className="text-xs font-bold text-brand-700" to={`/student/payment/${booking.id}`}>Pay now</Link>
                  ) : canStudentJoin(booking) ? (
                    <Link className="text-xs font-bold text-brand-700" to={`/live-class/${booking.id}`}>Join</Link>
                  ) : booking.status === "paid" ? (
                    <span className="text-xs font-bold text-slate-500 capitalize">{booking.session_status}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Booking History</h2>
          <p className="text-sm text-slate-500">Review dates, duration, spending, mentor details, and session status.</p>
        </div>
        <Link className="text-sm font-bold text-brand-700" to="/find-teachers">New booking</Link>
      </section>
      {bookings.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <GlassCard key={booking.id} className="p-5" hover={false}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={booking.teacher_avatar_url} name={booking.teacher_name || "Teacher"} className="h-11 w-11" textClassName="text-xs" hover={false} />
                  <div>
                    <p className="font-bold text-slate-900">{booking.teacher_name || "Teacher"}</p>
                    <p className="text-xs text-slate-500">Booking #{booking.id?.slice(-6) || "new"}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(booking.status)}`}>{booking.status}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCalendarAlt /> Date</p>
                  <p className="mt-1 font-bold text-slate-800">{formatDate(booking.created_at)}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FaClock /> Duration</p>
                  <p className="mt-1 font-bold text-slate-800">{booking.duration} min</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FaRupeeSign /> Spent</p>
                  <p className="mt-1 font-bold text-slate-800">Rs. {booking.amount}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FaReceipt /> Payment</p>
                  <p className="mt-1 font-bold text-slate-800">{booking.payment_status === "refunded" ? "Refunded" : booking.is_paid ? "Paid" : "Unpaid"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {booking.status === "accepted" ? (
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white" to={`/student/payment/${booking.id}`}><FaReceipt /> Pay</Link>
                ) : null}
                {canStudentJoin(booking) ? (
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white" to={`/live-class/${booking.id}`}><FaVideo /> Join Session</Link>
                ) : null}
                {booking.refund_status === "refunded" ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><FaCheckCircle /> Refunded Rs. {booking.refund_amount || booking.amount}</span>
                ) : null}
                {booking.status === "completed" ? (
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-brand-700" to="/student/reviews"><FaStar /> Review</Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600"><FaCheckCircle /> {booking.session_status || "requested"}</span>
                )}
              </div>
            </GlassCard>
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-brand-200 bg-white/70 p-8 text-center shadow-card">
          <p className="text-lg font-bold text-slate-900">No bookings yet</p>
          <p className="mt-2 text-sm text-slate-500">Your booked mentors, dates, duration, and spending will appear here after your first request.</p>
          <Link className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow" to="/find-teachers">
            <FaSearch /> Find your first mentor
          </Link>
        </section>
      )}
    </div>
  );
};

export default StudentDashboard;
