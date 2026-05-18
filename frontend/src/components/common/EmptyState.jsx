import { motion } from "framer-motion";

const EmptyState = ({ title, description, action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/70 bg-white/75 p-8 text-center shadow-card"
    >
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </motion.div>
  );
};

export default EmptyState;
