import type { FC } from 'react';
import type { StressTestRunResult } from './types';
import { STRESS_TEST_LIMITS } from './types';

interface StressTestResultsProps {
  result: StressTestRunResult | null;
}

const StressTestResults: FC<StressTestResultsProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Resultado</h2>
      <ul className="space-y-1 text-sm">
        <li><strong>Éxitos:</strong> {result.success}</li>
        <li><strong>Fallos:</strong> {result.failed}</li>
        <li><strong>Total:</strong> {result.total}</li>
        <li><strong>Tiempo total:</strong> {result.durationMs} ms</li>
        <li><strong>Promedio por petición:</strong> {result.avgMs} ms</li>
      </ul>
      {result.errors.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Errores (máx. {STRESS_TEST_LIMITS.maxErrorsShown}):
          </p>
          <ul className="text-xs text-red-700 bg-red-50 rounded p-2 max-h-32 overflow-y-auto">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StressTestResults;
