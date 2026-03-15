import { NavLink } from 'react-router-dom';
import { Bot, CheckCircle2, FileText, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assistant', label: 'Passport Assistant', icon: Bot },
  { to: '/documents', label: 'My Documents', icon: FileText },
  { to: '/readiness', label: 'Readiness Check', icon: CheckCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/90 px-3 py-4 lg:flex">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Passport Preparation</p>
        <p className="mt-1 text-xs text-slate-500">AI-powered guidance for Nepal individual applicants.</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
