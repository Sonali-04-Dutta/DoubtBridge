import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer } from "recharts";

const AdminStatCard = ({ label, value, icon: Icon, tone = "violet", data = [3, 5, 4, 7, 6, 9] }) => {
  const tones = {
    violet: "from-brand-500/18 via-white/75 to-fuchsia-200/50 text-brand-700",
    emerald: "from-emerald-300/25 via-white/80 to-brand-100/70 text-emerald-700",
    amber: "from-amber-200/40 via-white/80 to-brand-100/70 text-amber-700",
    rose: "from-rose-200/40 via-white/80 to-fuchsia-100/70 text-rose-700"
  };
  const chartData = data.map((point, index) => ({ index, point }));

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      className={`overflow-hidden rounded-[26px] border border-white/80 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_45px_rgba(100,40,200,.12)] backdrop-blur-xl`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        {Icon ? <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 shadow-sm"><Icon className="text-xl" /></span> : null}
      </div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-extrabold text-slate-950">{value}</p>
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="point" stroke="currentColor" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminStatCard;
