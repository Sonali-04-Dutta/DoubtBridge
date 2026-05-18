import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const isJoinWindowOpen = (booking) => {
  if (!booking?.join_deadline_at) return true;
  return new Date(booking.join_deadline_at).getTime() > Date.now();
};

const canTeacherJoin = (booking) =>
  booking.status === "paid" &&
  ["scheduled", "live"].includes(booking.session_status) &&
  !booking.teacher_joined_at &&
  isJoinWindowOpen(booking);

const TeacherSessionHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  useEffect(() => { api.get("/bookings/my").then(({ data }) => setBookings(data.bookings)).catch(() => {}); }, []);

  return (
    <div className="rounded-3xl bg-white/85 p-6 shadow-card">
      <h1 className="text-3xl font-bold text-slate-900">Session History</h1>
      <div className="mt-5 space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-700">{booking.student_name}</span>
            <span>{booking.duration} min</span>
            <span>Rs. {booking.amount}</span>
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-brand-700">{booking.refund_status === "refunded" ? "refunded" : booking.session_status || booking.status}</span>
            {canTeacherJoin(booking) ? <Link className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white" to={`/live-class/${booking.id}`}>Start Class</Link> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherSessionHistoryPage;
