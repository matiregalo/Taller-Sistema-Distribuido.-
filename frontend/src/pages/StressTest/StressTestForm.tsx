import type { FC } from 'react';
import type { StressTestMode } from './types';
import { STRESS_TEST_LIMITS } from './types';

interface StressTestFormProps {
  count: number;
  onCountChange: (value: number) => void;
  mode: StressTestMode;
  onModeChange: (value: StressTestMode) => void;
  running: boolean;
  onRun: () => void;
}

const StressTestForm: FC<StressTestFormProps> = ({
  count,
  onCountChange,
  mode,
  onModeChange,
  running,
  onRun,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Número de peticiones ({STRESS_TEST_LIMITS.minRequests}–{STRESS_TEST_LIMITS.maxRequests})
      </label>
      <input
        type="number"
        min={STRESS_TEST_LIMITS.minRequests}
        max={STRESS_TEST_LIMITS.maxRequests}
        value={count}
        onChange={(e) => {
          const raw = Number(e.target.value);
          const clamped = Number.isNaN(raw)
            ? STRESS_TEST_LIMITS.defaultRequests
            : Math.min(STRESS_TEST_LIMITS.maxRequests, Math.max(STRESS_TEST_LIMITS.minRequests, raw));
          onCountChange(clamped);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        disabled={running}
      />
    </div>
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">Modo</span>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'sequential'}
            onChange={() => onModeChange('sequential')}
            disabled={running}
          />
          Secuencial (una tras otra)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'parallel'}
            onChange={() => onModeChange('parallel')}
            disabled={running}
          />
          Paralelo (todas a la vez)
        </label>
      </div>
    </div>
    <button
      type="button"
      onClick={onRun}
      disabled={running}
      className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
    >
      {running ? 'Ejecutando…' : 'Ejecutar prueba de estrés'}
    </button>
  </div>
);

export default StressTestForm;
