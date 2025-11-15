const TROUBLESHOOTING_STEPS = [
  'Check that .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
  'Restart dev server after adding .env',
  'Verify credentials in Supabase dashboard (Settings → API)',
  'Check that RLS policies allow public read access',
];

export function TroubleshootingGuide() {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer font-medium">Troubleshooting</summary>
      <ul className="mt-2 ml-6 list-disc space-y-1 text-sm">
        {TROUBLESHOOTING_STEPS.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
    </details>
  );
}
