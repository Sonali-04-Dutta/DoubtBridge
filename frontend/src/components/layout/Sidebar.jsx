import { NavLink } from "react-router-dom";

const Sidebar = ({ title, links }) => {
  return (
    <aside className="glass h-fit rounded-3xl p-3 shadow-card lg:sticky lg:top-24 lg:p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-700">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition lg:shrink ${
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
