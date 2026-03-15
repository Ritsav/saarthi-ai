import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/passport/AppSidebar';
import { TopNavbar } from '@/components/passport/TopNavbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function PassportLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar onMenuClick={() => setMobileOpen(true)} />
      <div className="mx-auto flex max-w-[1400px]">
        <AppSidebar />
        <main className="min-h-[calc(100vh-64px)] flex-1 px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
