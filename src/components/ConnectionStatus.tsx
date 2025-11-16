interface ConnectionStatusProps {
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

export function ConnectionStatus({ isSuccess, isError, error }: ConnectionStatusProps) {
  if (isSuccess) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg">
        <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        <span className="text-teal-400 text-xs font-medium uppercase tracking-wider">Live</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-400">
        <p className="font-medium">Connection failed</p>
        <p className="text-sm mt-1">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-lg">
      <div className="w-2 h-2 bg-zinc-600 rounded-full" />
      <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Connecting</span>
    </div>
  );
}
