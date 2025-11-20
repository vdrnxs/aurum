interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Simplified app layout with header
 * Ready to scale with sidebar, navigation, or multiple pages
 */
export function AppLayout({
  children,
  title = 'Aurum',
  subtitle,
  actions
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-screen-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-screen-2xl px-6 py-6">
        {children}
      </main>

      {/* Footer - ready to add if needed */}
      {/* <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-screen-2xl px-6 py-4">
          <p className="text-sm text-gray-600">Aurum Dashboard</p>
        </div>
      </footer> */}
    </div>
  );
}
