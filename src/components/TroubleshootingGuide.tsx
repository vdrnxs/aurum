const TROUBLESHOOTING_STEPS = [
  'Check that .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
  'Restart dev server after adding .env',
  'Verify credentials in Supabase dashboard (Settings → API)',
  'Check that RLS policies allow public read access',
];

export function TroubleshootingGuide() {
  return (
    <details className="mt-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-50">Troubleshooting</summary>
      <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {TROUBLESHOOTING_STEPS.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
    </details>
  );
}
