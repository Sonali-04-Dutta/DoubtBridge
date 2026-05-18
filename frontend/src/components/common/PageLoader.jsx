import { motion } from "framer-motion";

const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        className="h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-600"
      />
      <p className="text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
};

export default PageLoader;
