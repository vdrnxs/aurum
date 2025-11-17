import type { NavigationItem } from '../../config/navigation';

interface SidebarProps {
  brand: {
    name: string;
    description: string;
    footer: string;
  };
  items: NavigationItem[];
}

export function Sidebar({ brand, items }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <div>
              <span className="block text-sm font-semibold text-gray-900">
                {brand.name}
              </span>
              <span className="block text-xs text-gray-500">
                {brand.description}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={
                    item.active
                      ? "flex items-center gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900"
                      : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">
            {brand.footer}
          </p>
        </div>
      </div>
    </aside>
  );
}
