import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const BookingRequestsPage = () => {
  const [bookings, setBookings] = useState([]);

  const load = async () => {
    const { data } = await api.get("/bookings/my");
    setBookings(data.bookings);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const respond = async (bookingId, action) => {
    await api.patch(`/bookings/${bookingId}/respond`, { action });
    load();
  };

  return (
    <div className="rounded-3xl bg-white/85 p-6 shadow-card">
      <h1 className="text-3xl font-bold text-slate-900">Booking Requests</h1>
      <div className="mt-5 space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <div><p className="font-bold text-slate-800">{booking.student_name}</p><p className="text-sm text-slate-600">{booking.duration} min | Rs. {booking.amount}</p></div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">{booking.status}</span>{booking.status === "pending" ? <><button onClick={() => respond(booking.id, "accepted")} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white">Accept</button><button onClick={() => respond(booking.id, "rejected")} className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white">Reject</button></> : null}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingRequestsPage;