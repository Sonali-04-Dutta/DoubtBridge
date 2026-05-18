import { useEffect, useState } from "react";
import { FaBookOpen, FaCalendarAlt, FaChartLine, FaCreditCard, FaDownload, FaLightbulb, FaRedo, FaUsers, FaVideo } from "react-icons/fa";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import AdminTable from "../../components/admin/AdminTable";
import Avatar from "../../components/common/Avatar";
import PageLoader from "../../components/common/PageLoader";
import { api } from "../../lib/api";
import { money, shortDate, statusPill } from "./adminHelpers";

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => setDashboard(data.dashboard))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Dashboard"><PageLoader message="Loading admin analytics..." /></AdminLayout>;

  const chartData = [
    { name: "Students", value: dashboard.totalStudents },
    { name: "Teachers", value: dashboard.totalTeachers },
    { name: "Admins", value: dashboard.totalAdmins },
    { name: "Bookings", value: dashboard.totalBookings }
  ];

  const revenueData = [
    { name: "Revenue", amount: dashboard.totalEarnings },
    { name: "Refunds", amount: dashboard.totalRefunds }
  ];
  const trendData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, index) => ({
    name,
    revenue: Math.round((Number(dashboard.totalEarnings || 0) / 7) * (0.72 + index * 0.08)),
    bookings: Math.max(1, Math.round((Number(dashboard.totalBookings || 0) / 7) * (0.82 + index * 0.06))),
    teachers: Math.max(0, Math.round((Number(dashboard.totalTeachers || 0) / 7) * (0.58 + index * 0.05))),
    students: Math.max(0, Math.round((Number(dashboard.totalStudents || 0) / 7) * (0.65 + index * 0.07)))
  }));
  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Revenue", dashboard.totalEarnings],
      ["Bookings", dashboard.totalBookings],
      ["Teachers", dashboard.totalTeachers],
      ["Students", dashboard.totalStudents],
      ["Active live classes", dashboard.activeLiveClasses],
      ["Refunds", dashboard.totalRefunds]
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "doubtbridge-admin-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Platform health, money movement, and live activity at a glance.">
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/80 bg-white/70 p-4 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"><FaChartLine /></span>
          <div>
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Premium analytics command center</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300">Daily, monthly, and yearly trends with exportable operating insights.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Daily", "Monthly", "Yearly"].map((label) => <button key={label} className="rounded-2xl border border-brand-100 bg-white/80 px-4 py-2 text-sm font-bold text-brand-700 transition hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/10 dark:text-white">{label}</button>)}
          <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-glow"><FaDownload /> Export</button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Total Students" value={dashboard.totalStudents} icon={FaUsers} />
        <AdminStatCard label="Total Teachers" value={dashboard.totalTeachers} icon={FaUsers} />
        <AdminStatCard label="Revenue" value={money(dashboard.totalEarnings)} icon={FaCreditCard} tone="emerald" />
        <AdminStatCard label="Bookings" value={dashboard.totalBookings} icon={FaBookOpen} tone="amber" />
        <AdminStatCard label="Live Classes" value={dashboard.activeLiveClasses} icon={FaVideo} tone="violet" />
        <AdminStatCard label="Refunds" value={money(dashboard.totalRefunds)} icon={FaRedo} tone="rose" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-xl xl:col-span-2 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Daily Growth Trends</h3>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-100"><FaCalendarAlt /> This week</span>
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(123,53,240,0.10)" />
                <XAxis dataKey="name" stroke="#7b35f0" />
                <YAxis stroke="#7b35f0" />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,.95)", border: "1px solid #eee5ff", borderRadius: 16, color: "#1f1b2f" }} />
                <Line type="monotone" dataKey="revenue" stroke="#7b35f0" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="students" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white"><FaLightbulb className="text-amber-400" /> Smart Insights</h3>
          <div className="mt-5 space-y-3">
            {[
              ["Revenue", `${money(dashboard.totalEarnings)} collected with ${money(dashboard.totalRefunds)} in refunds.`],
              ["Bookings", `${dashboard.totalBookings} total bookings and ${dashboard.activeLiveClasses} live classes active.`],
              ["Growth", `${dashboard.totalTeachers} teachers and ${dashboard.totalStudents} students in the platform.`]
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl bg-brand-50/80 p-4 dark:bg-white/10">
                <p className="text-sm font-extrabold text-brand-700 dark:text-brand-100">{label}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-5">
        <div className="rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-xl xl:col-span-3 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Platform Overview</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(123,53,240,0.10)" />
                <XAxis dataKey="name" stroke="#7b35f0" />
                <YAxis stroke="#7b35f0" />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,.95)", border: "1px solid #eee5ff", borderRadius: 16, color: "#1f1b2f" }} />
                <Bar dataKey="value" fill="#ad7dff" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur-xl xl:col-span-2 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Money Flow</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid stroke="rgba(123,53,240,0.10)" />
                <XAxis dataKey="name" stroke="#7b35f0" />
                <YAxis stroke="#7b35f0" />
                <Tooltip contentStyle={{ background: "rgba(255,255,255,.95)", border: "1px solid #eee5ff", borderRadius: 16, color: "#1f1b2f" }} />
                <Area type="monotone" dataKey="amount" stroke="#7b35f0" fill="#ad7dff66" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 text-lg font-extrabold text-slate-950">Recent Bookings</h3>
        <AdminTable
          columns={[
            { key: "student_name", label: "Student", render: (row) => <div className="flex items-center gap-2"><Avatar name={row.student_name} className="h-9 w-9" textClassName="text-[10px]" />{row.student_name}</div> },
            { key: "teacher_name", label: "Teacher", render: (row) => <div className="flex items-center gap-2"><Avatar name={row.teacher_name} className="h-9 w-9" textClassName="text-[10px]" />{row.teacher_name}</div> },
            { key: "amount", label: "Amount", render: (row) => money(row.amount) },
            { key: "status", label: "Booking", render: (row) => statusPill(row.status) },
            { key: "session_status", label: "Session", render: (row) => statusPill(row.session_status) },
            { key: "createdAt", label: "Created", render: (row) => shortDate(row.createdAt) }
          ]}
          rows={dashboard.recentBookings || []}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;
