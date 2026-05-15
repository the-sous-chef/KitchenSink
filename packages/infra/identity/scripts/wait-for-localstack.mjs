#!/usr/bin/env node
import process from "node:process";

/**
 * @implements REQ-049 REQ-050 REQ-017 REQ-025 REQ-026 FR-017 FR-025 FR-026 ARCH-012 ARCH-017 ARCH-031 MOD-012 MOD-017 MOD-031
 */
const endpoint = process.env.LOCALSTACK_ENDPOINT ?? "http://localhost:4566";
const timeoutMs = Number(process.env.LOCALSTACK_WAIT_TIMEOUT_MS ?? 120_000);
const intervalMs = Number(process.env.LOCALSTACK_WAIT_INTERVAL_MS ?? 2_000);
const start = Date.now();

const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

while (Date.now() - start < timeoutMs) {
    try {
        const response = await fetch(`${endpoint}/_localstack/health`);
        if (response.ok) {
            const payload = await response.json();
            const services = payload.services ?? {};
            const isReady = (value) => value === "running" || value === "available";
            const hasCore = isReady(services.sqs) && isReady(services.s3) && isReady(services.events);
            if (hasCore) {
                process.stdout.write(`LocalStack ready at ${endpoint}\n`);
                process.exit(0);
            }
        }
    } catch {
        // No-op while waiting.
    }

    await sleep(intervalMs);
}

process.stderr.write(`Timed out waiting for LocalStack at ${endpoint}\n`);
process.exit(1);
