export type StressTestMode = 'sequential' | 'parallel';

export interface StressTestRunResult {
  success: number;
  failed: number;
  total: number;
  durationMs: number;
  errors: string[];
  avgMs: number;
}

export const STRESS_TEST_LIMITS = {
  minRequests: 1,
  maxRequests: 500,
  defaultRequests: 20,
  maxErrorsShown: 15,
  maxErrorsLogged: 10,
} as const;
