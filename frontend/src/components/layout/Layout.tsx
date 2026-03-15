import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => {
          setSidebarOpen((prev) => !prev);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden border-r border-slate-200 bg-slate-50 transition-all duration-300 md:flex md:flex-col ${
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
          }`}
        >
          <Sidebar />
        </aside>

        <Sheet>
          <SheetTrigger asChild className="absolute left-3 top-3 z-30 md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open sidebar">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto"> 
          <Outlet />
        </main>
      </div>
    </div>
  );
}
