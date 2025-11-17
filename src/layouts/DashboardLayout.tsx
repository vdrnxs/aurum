import { Sidebar } from '../components/ui/Sidebar';
import { Header } from '../components/ui/Header';
import { brand } from '../config/brand';
import { navigationItems } from '../config/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const activeItem = navigationItems.find(item => item.active);
  const pageTitle = title || activeItem?.name || "Dashboard";

  return (
    <div className="flex h-screen bg-white">
      <Sidebar brand={brand} items={navigationItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
