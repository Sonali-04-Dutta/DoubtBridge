import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { shortDate, statusPill } from "./adminHelpers";

const AdminLiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/admin/live-classes");
    setLiveClasses(data.liveClasses);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const forceEnd = async (bookingId) => {
    try {
      await api.patch(`/admin/live-classes/${bookingId}/end`);
      toast.success("Live class ended");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to end class");
    }
  };

  return (
    <AdminLayout title="Live Classes" subtitle="Monitor active rooms and intervene when support needs to.">
      {loading ? <PageLoader message="Loading live classes..." /> : (
        <AdminTable
          rows={liveClasses}
          emptyText="No active live classes."
          columns={[
            { key: "student_name", label: "Student" },
            { key: "teacher_name", label: "Teacher" },
            { key: "duration", label: "Duration", render: (row) => `${row.duration} min` },
            { key: "session_status", label: "Status", render: (row) => statusPill(row.session_status) },
            { key: "actual_started_at", label: "Started", render: (row) => shortDate(row.actual_started_at || row.createdAt) },
            { key: "expires_at", label: "Ends", render: (row) => shortDate(row.expires_at) },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button onClick={() => forceEnd(row.id)} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white">
                  End Class
                </button>
              )
            }
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default AdminLiveClasses;
