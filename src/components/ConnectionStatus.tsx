interface ConnectionStatusProps {
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

export function ConnectionStatus({ isSuccess, isError, error }: ConnectionStatusProps) {
  if (isSuccess) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-400/30 dark:bg-emerald-500/10">
        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 dark:text-red-400">
        <p className="font-medium">Connection failed</p>
        <p className="mt-1 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600" />
      <span className="text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-500">Connecting</span>
    </div>
  );
}
