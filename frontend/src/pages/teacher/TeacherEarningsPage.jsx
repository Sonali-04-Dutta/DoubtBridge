import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const TeacherEarningsPage = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => { api.get("/bookings/my").then(({ data }) => setBookings(data.bookings)).catch(() => {}); }, []);

  const paidBookings = useMemo(() => bookings.filter((b) => ["paid", "completed"].includes(b.status)), [bookings]);
  const total = useMemo(() => paidBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0), [paidBookings]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/85 p-6 shadow-card"><h1 className="text-3xl font-bold text-slate-900">Earnings</h1><p className="mt-4 text-4xl font-extrabold text-brand-700">Rs. {total}</p></div>
      <div className="rounded-3xl bg-white/85 p-6 shadow-card"><h2 className="text-xl font-bold text-slate-900">Transactions</h2><div className="mt-3 space-y-2">{paidBookings.map((booking) => <div key={booking.id} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm"><span>Booking #{booking.id}</span><span>{booking.duration} min</span><span className="font-bold text-brand-700">Rs. {booking.amount}</span></div>)}</div></div>
    </div>
  );
};

export default TeacherEarningsPage;