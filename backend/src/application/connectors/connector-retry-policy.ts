import { ConnectorRateLimitProfile } from './connector.types';

export function getErrorStatus(error: unknown): number | undefined {
  const err = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number; statusCode?: number };
  };

  return err?.response?.status ?? err?.response?.statusCode ?? err?.statusCode ?? err?.status;
}

export function isRetryableConnectorError(
  error: unknown,
  policy: ConnectorRateLimitProfile,
): boolean {
  const err = error as { code?: string };
  const status = getErrorStatus(error);
  const networkError = err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';

  return (
    networkError ||
    (status !== undefined &&
      (policy.rateLimitStatuses.includes(status) ||
        policy.retryableStatuses.includes(status)))
  );
}

export function calculateConnectorBackoffMs(
  attempt: number,
  policy: ConnectorRateLimitProfile,
  jitter = 0,
): number {
  const exponentialDelay = policy.baseDelayMs * Math.pow(2, attempt - 1);
  return Math.min(exponentialDelay + jitter, policy.maxDelayMs);
}
