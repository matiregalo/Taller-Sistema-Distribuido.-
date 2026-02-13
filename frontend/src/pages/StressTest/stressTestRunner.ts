import { logger } from '../../utils/logger';
import { complaintsService } from '../../services/complaints.service';
import type { CreateIncidentRequest } from '../../types/incident';
import { IncidentType } from '../../types/incident';
import type { StressTestRunResult } from './types';
import { STRESS_TEST_LIMITS } from './types';

const INCIDENT_TYPES: IncidentType[] = [
  IncidentType.NO_SERVICE,
  IncidentType.INTERMITTENT_SERVICE,
  IncidentType.SLOW_CONNECTION,
  IncidentType.ROUTER_ISSUE,
  IncidentType.BILLING_QUESTION,
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function buildPayloads(count: number): CreateIncidentRequest[] {
  const payloads: CreateIncidentRequest[] = [];
  for (let i = 0; i < count; i++) {
    payloads.push({
      email: `stress-${i + 1}@stress-test.local`,
      lineNumber: String(990000000 + (i % 1_000_000)).padStart(9, '0'),
      incidentType: INCIDENT_TYPES[i % INCIDENT_TYPES.length],
      description: i % 5 === 0 ? `Stress test request #${i + 1}` : undefined,
    });
  }
  return payloads;
}

export async function runSequential(
  payloads: CreateIncidentRequest[]
): Promise<StressTestRunResult> {
  const errors: string[] = [];
  let success = 0;
  const start = performance.now();

  for (const payload of payloads) {
    try {
      await complaintsService.createComplaint(payload);
      success++;
    } catch (e) {
      const msg = getErrorMessage(e);
      errors.push(msg);
      if (errors.length <= STRESS_TEST_LIMITS.maxErrorsLogged) {
        logger.error('Stress test request failed:', msg);
      }
    }
  }

  const durationMs = Math.round(performance.now() - start);
  return {
    success,
    failed: payloads.length - success,
    total: payloads.length,
    durationMs,
    errors: errors.slice(0, STRESS_TEST_LIMITS.maxErrorsShown),
    avgMs: payloads.length ? Math.round(durationMs / payloads.length) : 0,
  };
}

export async function runParallel(
  payloads: CreateIncidentRequest[]
): Promise<StressTestRunResult> {
  const start = performance.now();
  const outcomes = await Promise.allSettled(
    payloads.map((p) => complaintsService.createComplaint(p))
  );
  const durationMs = Math.round(performance.now() - start);

  const success = outcomes.filter((o) => o.status === 'fulfilled').length;
  const errors = outcomes
    .filter((o): o is PromiseRejectedResult => o.status === 'rejected')
    .map((o) => getErrorMessage(o.reason))
    .slice(0, STRESS_TEST_LIMITS.maxErrorsShown);

  outcomes
    .filter((o): o is PromiseRejectedResult => o.status === 'rejected')
    .slice(0, STRESS_TEST_LIMITS.maxErrorsLogged)
    .forEach((o) => logger.error('Stress test request failed:', o.reason));

  return {
    success,
    failed: payloads.length - success,
    total: payloads.length,
    durationMs,
    errors,
    avgMs: payloads.length ? Math.round(durationMs / payloads.length) : 0,
  };
}
