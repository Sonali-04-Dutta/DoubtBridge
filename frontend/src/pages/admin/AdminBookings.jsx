import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { money, shortDate, statusPill } from "./adminHelpers";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/admin/bookings");
    setBookings(data.bookings);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refund = async (bookingId) => {
    try {
      await api.post(`/admin/refund/${bookingId}`);
      toast.success("Refund triggered");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Refund failed");
    }
  };

  return (
    <AdminLayout title="Bookings" subtitle="Track session lifecycle from request to completion or refund.">
      {loading ? <PageLoader message="Loading bookings..." /> : (
        <AdminTable
          rows={bookings}
          columns={[
            { key: "student_name", label: "Student" },
            { key: "teacher_name", label: "Teacher" },
            { key: "amount", label: "Amount", render: (row) => money(row.amount) },
            { key: "payment_status", label: "Payment", render: (row) => statusPill(row.payment_status) },
            { key: "status", label: "Booking", render: (row) => statusPill(row.status) },
            { key: "session_status", label: "Session", render: (row) => statusPill(row.session_status) },
            { key: "createdAt", label: "Created", render: (row) => shortDate(row.createdAt) },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button
                  onClick={() => refund(row.id)}
                  disabled={row.payment_status !== "paid" || row.refund_status === "refunded"}
                  className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Refund
                </button>
              )
            }
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default AdminBookings;
