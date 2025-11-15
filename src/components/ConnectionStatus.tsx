interface ConnectionStatusProps {
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

export function ConnectionStatus({ isSuccess, isError, error }: ConnectionStatusProps) {
  if (isSuccess) {
    return <p className="text-green-600">Connected successfully</p>;
  }

  if (isError) {
    return (
      <div className="text-red-600">
        <p className="font-semibold">Connection failed</p>
        <p className="text-sm mt-1">Error: {error}</p>
      </div>
    );
  }

  return <p className="text-gray-600">Connecting to Supabase...</p>;
}
