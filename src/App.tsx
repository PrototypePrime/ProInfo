import { useState } from 'react';
import { DashboardLayout, type ViewType } from './layouts/DashboardLayout';
import { IpInvestigator } from './features/ip-intel/IpInvestigator';
import { ScanHistory } from './features/history/ScanHistory';
import { Settings } from './features/settings/Settings';
import { IocExtractor } from './features/tools/IocExtractor';
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
