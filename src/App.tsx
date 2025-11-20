import { AppLayout } from './layouts/AppLayout';
import { SimpleIndicators } from './components/SimpleIndicators';

function App() {
  return (
    <AppLayout
      title="Aurum Dashboard"
      subtitle="Technical Indicators for BTC 1h"
    >
      <SimpleIndicators />
    </AppLayout>
  );
}

export default App;
