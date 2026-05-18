export const money = (value = 0) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export const shortDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};

export const statusPill = (value) => {
  const text = value || "unknown";
  const palette = text.includes("paid") || text.includes("live") || text.includes("approved") || text.includes("active")
    ? "bg-emerald-100 text-emerald-700"
    : text.includes("failed") || text.includes("rejected") || text.includes("blocked")
      ? "bg-rose-100 text-rose-700"
      : "bg-brand-100 text-brand-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${palette}`}>{text}</span>;
};
