import { TestConnection } from './components/TestConnection';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 py-6">
        <div className="max-w-screen-2xl mx-auto px-8">
          <h1 className="text-2xl font-light text-zinc-100">Aurum</h1>
          <p className="text-sm text-zinc-500 mt-1">Crypto Market Data</p>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-8 py-12">
        <TestConnection />
      </main>
    </div>
  );
}

export default App;
