import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminTable from "../../components/admin/AdminTable";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { shortDate, statusPill } from "./adminHelpers";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get("/admin/students");
    setStudents(data.students);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const toggleBlock = async (student) => {
    try {
      await api.patch(`/admin/user/${student.id}/${student.isBlocked ? "unblock" : "block"}`);
      toast.success(student.isBlocked ? "Student unblocked" : "Student blocked");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <AdminLayout title="Students" subtitle="Monitor learner accounts and pause suspicious access.">
      {loading ? <PageLoader message="Loading students..." /> : (
        <AdminTable
          rows={students}
          columns={[
            { key: "name", label: "Student" },
            { key: "email", label: "Email" },
            { key: "access", label: "Access", render: (row) => statusPill(row.isBlocked ? "blocked" : "active") },
            { key: "createdAt", label: "Joined", render: (row) => shortDate(row.createdAt) },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button onClick={() => toggleBlock(row)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white">
                  {row.isBlocked ? "Unblock" : "Block"}
                </button>
              )
            }
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default AdminStudents;
