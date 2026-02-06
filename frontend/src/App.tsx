import { useState, useEffect } from 'react';
import type { FC } from 'react';
import IncidentReportPage from './pages/IncidentReport/IncidentReportPage';
import StressTestPage from './pages/StressTest/StressTestPage';

function useStressParam(): [boolean, (value: boolean) => void] {
  const [showStress, setShowStress] = useState(
    () => new URLSearchParams(window.location.search).get('stress') === '1'
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    if (showStress) url.searchParams.set('stress', '1');
    else url.searchParams.delete('stress');
    window.history.replaceState({}, '', url.toString());
  }, [showStress]);
  return [showStress, setShowStress];
}

const App: FC = () => {
  const [showStress, setShowStress] = useStressParam();

  return (
    <div className="app">
      {showStress ? (
        <StressTestPage onBack={() => setShowStress(false)} />
      ) : (
        <IncidentReportPage onOpenStressTest={() => setShowStress(true)} />
      )}
    </div>
  );
};

export default App;
