import { motion } from "framer-motion";

const GlassCard = ({ children, className = "", hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`glass rounded-3xl shadow-card ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;