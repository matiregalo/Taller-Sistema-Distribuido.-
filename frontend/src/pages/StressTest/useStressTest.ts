import { useState, useCallback } from 'react';
import { buildPayloads, runSequential, runParallel } from './stressTestRunner';
import type { StressTestMode, StressTestRunResult } from './types';
import { STRESS_TEST_LIMITS } from './types';

function clampCount(value: number): number {
  return Math.min(
    Math.max(STRESS_TEST_LIMITS.minRequests, value),
    STRESS_TEST_LIMITS.maxRequests
  );
}

export function useStressTest() {
  const [count, setCount] = useState<number>(STRESS_TEST_LIMITS.defaultRequests);
  const [mode, setMode] = useState<StressTestMode>('sequential');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<StressTestRunResult | null>(null);

  const handleRun = useCallback(async () => {
    const num = clampCount(count);
    setRunning(true);
    setResult(null);

    const payloads = buildPayloads(num);
    const run = mode === 'sequential' ? runSequential : runParallel;

    try {
      const runResult = await run(payloads);
      setResult(runResult);
    } catch (e) {
      console.error('Stress test run error:', e);
      setResult({
        success: 0,
        failed: num,
        total: num,
        durationMs: 0,
        errors: [e instanceof Error ? e.message : String(e)],
        avgMs: 0,
      });
    } finally {
      setRunning(false);
    }
  }, [count, mode]);

  return {
    count,
    setCount,
    mode,
    setMode,
    running,
    result,
    handleRun,
  };
}
