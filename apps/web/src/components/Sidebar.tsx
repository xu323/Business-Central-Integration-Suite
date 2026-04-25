import { NavLink } from "react-router-dom";
import clsx from "clsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/requests", label: "Purchase Requests", icon: "🧾" },
  { to: "/requests/new", label: "Create Request", icon: "➕" },
  { to: "/audit", label: "Audit Logs", icon: "🔍" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-sm uppercase tracking-widest text-brand-600 font-semibold">
          BC Suite
        </div>
        <div className="text-base font-semibold text-slate-800 mt-0.5">
          Integration Console
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-400 border-t border-slate-200">
        v1.0 · MSP demo
      </div>
    </aside>
  );
}
