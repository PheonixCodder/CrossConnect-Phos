import { getConnectorCapability } from './connector-capabilities';
import {
  calculateConnectorBackoffMs,
  getErrorStatus,
  isRetryableConnectorError,
} from './connector-retry-policy';

describe('connector retry policy', () => {
  const policy = getConnectorCapability('shopify').rateLimit;

  it('extracts status from common provider error shapes', () => {
    expect(getErrorStatus({ response: { status: 429 } })).toBe(429);
    expect(getErrorStatus({ response: { statusCode: 503 } })).toBe(503);
    expect(getErrorStatus({ statusCode: 500 })).toBe(500);
    expect(getErrorStatus({ status: 400 })).toBe(400);
  });

  it('classifies rate limit, server, and network errors as retryable', () => {
    expect(isRetryableConnectorError({ response: { status: 429 } }, policy)).toBe(
      true,
    );
    expect(isRetryableConnectorError({ statusCode: 503 }, policy)).toBe(true);
    expect(isRetryableConnectorError({ code: 'ETIMEDOUT' }, policy)).toBe(true);
  });

  it('does not retry validation/client errors', () => {
    expect(isRetryableConnectorError({ response: { status: 400 } }, policy)).toBe(
      false,
    );
  });

  it('calculates capped exponential backoff', () => {
    expect(calculateConnectorBackoffMs(1, policy, 100)).toBe(5100);
    expect(calculateConnectorBackoffMs(99, policy, 0)).toBe(policy.maxDelayMs);
  });
});
