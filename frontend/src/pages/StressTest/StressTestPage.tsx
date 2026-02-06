import type { FC } from 'react';
import Layout from '../../components/layout/Layout';
import { useStressTest } from './useStressTest';
import StressTestForm from './StressTestForm';
import StressTestResults from './StressTestResults';

interface StressTestPageProps {
  onBack: () => void;
}

const StressTestPage: FC<StressTestPageProps> = ({ onBack }) => {
  const { count, setCount, mode, setMode, running, result, handleRun } = useStressTest();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pruebas de estrés</h1>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Volver al reporte
          </button>
        </header>

        <p className="text-gray-600 text-sm mb-6">
          Dispara muchas peticiones{' '}
          <code className="bg-gray-100 px-1 rounded">POST /complaints</code> para comprobar si el
          sistema sigue respondiendo, se degrada o se cae. No corrige nada; solo detecta y documenta.
        </p>

        <StressTestForm
          count={count}
          onCountChange={setCount}
          mode={mode}
          onModeChange={setMode}
          running={running}
          onRun={handleRun}
        />

        <StressTestResults result={result} />
      </div>
    </Layout>
  );
};

export default StressTestPage;
