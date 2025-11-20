import { AppLayout } from './layouts/AppLayout';
import { SimpleIndicators } from './components/SimpleIndicators';
//import { HybridIndicatorsDashboard } from './components/HybridIndicatorsDashboard';
//import { IndicatorsDashboard } from './components/IndicatorsDashboard';

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
