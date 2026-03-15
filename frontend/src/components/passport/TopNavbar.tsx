import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">S</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Saarthi</p>
              <p className="text-xs text-slate-500">Nepal Passport Assistant</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden items-center gap-1 rounded-full px-3 py-1 text-xs md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            Secure document processing
          </Badge>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            {user?.name?.split(' ')[0] || 'Account'}
          </Button>
        </div>
      </div>
    </header>
  );
}
