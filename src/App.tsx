import { useState } from 'react';
import DashboardLayout, { type ViewType } from './layouts/DashboardLayout';
import IpInvestigator from './components/IpInvestigator';
import ScanHistory from './components/ScanHistory';
import Settings from './components/Settings';
import IocExtractor from './components/IocExtractor';
import type { IpInfo } from './services/ipUtils';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('intel');
  const [results, setResults] = useState<IpInfo[]>([]);

  // Callback to restore history and switch view
  const handleRestore = (data: IpInfo[]) => {
    setResults(data);
    setActiveView('intel');
  };

  return (
    <DashboardLayout activeView={activeView} onNavigate={setActiveView}>
      {activeView === 'intel' && (
        <IpInvestigator results={results} setResults={setResults} />
      )}
      {activeView === 'logs' && (
        <ScanHistory onRestore={handleRestore} />
      )}
      {activeView === 'tools' && <IocExtractor />}
      {activeView === 'settings' && <Settings />}
    </DashboardLayout>
  );
}

export default App;
