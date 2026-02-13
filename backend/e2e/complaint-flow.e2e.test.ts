import { describe, it, expect } from 'vitest';


/**
 * E2E Test: Full Complaint Flow
 * 
 * Requisites: Docker Compose must be running.
 * - Producer: http://localhost:3000
 * - Consumer: http://localhost:3001 (Health & Metrics)
 */

describe('E2E System Flow', () => {
    const PRODUCER_URL = 'http://localhost:3000';
    const CONSUMER_URL = 'http://localhost:3001';

    // Helper to delay execution
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    it('should process a NO_SERVICE complaint from Producer to Consumer persistence', async () => {
        // 1. Snapshot initial metrics from Consumer
        const initialHealthRes = await fetch(`${CONSUMER_URL}/health`);
        expect(initialHealthRes.status).toBe(200);
        const initialHealth = await initialHealthRes.json();
        const initialProcessedCount = initialHealth.metrics?.messagesProcessed || 0;

        // 2. Send a Complaint to the Producer
        const payload = {
            lineNumber: '099123456',
            email: `e2e-test-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`,
            incidentType: 'NO_SERVICE',
            description: 'Automated E2E Test Incident'
        };

        const postRes = await fetch(`${PRODUCER_URL}/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        expect(postRes.status).toBe(201);
        const responseBody = await postRes.json();
        expect(responseBody).toHaveProperty('ticketId');
        expect(responseBody.status).toBe('RECEIVED');
        console.log(`Created Ticket: ${responseBody.ticketId}`);

        // 3. Poll Consumer metrics until processed count increments
        // We give it up to 5 seconds for async processing
        let processed = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            await sleep(500); // Wait 500ms between checks
            attempts++;

            const healthRes = await fetch(`${CONSUMER_URL}/health`);
            const health = await healthRes.json();
            const currentProcessedCount = health.metrics?.messagesProcessed || 0;

            if (currentProcessedCount > initialProcessedCount) {
                processed = true;
                break;
            }
        }

        expect(processed).toBe(true);
    }, 10000); // 10s timeout for the test
});
