const getInitials = (name = "") => {
  const cleaned = String(name).trim();
  if (!cleaned) return "U";

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const Avatar = ({ src, name, alt, className = "", textClassName = "", hover = true }) => {
  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brand-500 via-fuchsia-400 to-brand-700 text-white shadow-[0_10px_26px_rgba(123,53,240,.24)] ring-2 ring-brand-100/80 transition duration-300 ${hover ? "hover:-translate-y-0.5 hover:scale-105 hover:shadow-glow" : ""} ${className}`}
      aria-label={alt || `${name || "User"} avatar`}
      title={name || "User"}
    >
      {src ? (
        <img
          src={src}
          alt={alt || `${name || "User"} avatar`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <>
          <span className="absolute -right-1 -top-1 h-1/2 w-1/2 rounded-full bg-white/20 blur-sm" />
          <span className={`relative select-none font-extrabold uppercase tracking-wide ${textClassName}`}>{initials}</span>
        </>
      )}
    </div>
  );
};

export default Avatar;
