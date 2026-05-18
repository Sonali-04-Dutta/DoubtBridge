import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { money, shortDate, statusPill } from "./adminHelpers";

const AdminPayments = ({ refundsOnly = false }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/payments").then(({ data }) => setPayments(data.payments)).finally(() => setLoading(false));
  }, []);

  const rows = refundsOnly ? payments.filter((item) => item.status === "refunded" || item.refund_amount > 0) : payments;

  return (
    <AdminLayout title={refundsOnly ? "Refunds" : "Payments"} subtitle="Razorpay status, failed payments, and refunds.">
      {loading ? <PageLoader message="Loading payments..." /> : (
        <AdminTable
          rows={rows}
          columns={[
            { key: "student_name", label: "Student" },
            { key: "teacher_name", label: "Teacher" },
            { key: "amount", label: "Amount", render: (row) => money(row.amount) },
            { key: "status", label: "Status", render: (row) => statusPill(row.status) },
            { key: "refund_status", label: "Refund", render: (row) => statusPill(row.refund_status || "none") },
            { key: "razorpay_payment_id", label: "Razorpay Payment" },
            { key: "razorpay_refund_id", label: "Refund Id", render: (row) => row.razorpay_refund_id || "-" },
            { key: "createdAt", label: "Created", render: (row) => shortDate(row.createdAt) }
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPayments;
