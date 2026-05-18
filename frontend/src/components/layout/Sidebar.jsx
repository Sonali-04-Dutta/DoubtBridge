import { NavLink } from "react-router-dom";

const Sidebar = ({ title, links }) => {
  return (
    <aside className="glass sticky top-24 h-fit rounded-3xl p-4 shadow-card">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">{title}</p>
      <div className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isActive ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-brand-50"
              }`
            }
            end={link.end}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;