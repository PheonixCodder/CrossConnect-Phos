import { Injectable, Logger } from '@nestjs/common';
import Bottleneck from 'bottleneck';

interface ThrottleConfig {
  minTime: number;
  maxConcurrent: number;
}

@Injectable()
export class SpApiThrottleManager {
  private readonly logger = new Logger(SpApiThrottleManager.name);

  /**
   * Global limiter (safety net)
   */
  private globalLimiter = new Bottleneck({
    minTime: 200, // 5 req/sec max global
    maxConcurrent: 5,
  });

  /**
   * Operation specific limiters
   * Values chosen conservatively for SP-API stability
   */
  private limiters: Record<string, Bottleneck> = {
    REPORTS: new Bottleneck({ minTime: 2000, maxConcurrent: 1 }),
    ORDERS: new Bottleneck({ minTime: 500, maxConcurrent: 2 }),
    INVENTORY: new Bottleneck({ minTime: 1000, maxConcurrent: 1 }),
    SALES: new Bottleneck({ minTime: 1000, maxConcurrent: 1 }),
    DATA_KIOSK: new Bottleneck({ minTime: 300_000, maxConcurrent: 1 }), // critical
  };

  /**
   * Central execution wrapper
   */
  async execute<T>(
    operation: keyof SpApiThrottleManager['limiters'],
    fn: () => Promise<T>,
    context: string,
    maxRetries = 6,
  ): Promise<T> {
    const limiter = this.limiters[operation];

    return this.globalLimiter.schedule(() =>
      limiter.schedule(() => this.retryWithBackoff(fn, context, maxRetries)),
    );
  }

  /**
   * Intelligent retry logic
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string,
    maxRetries: number,
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;

        const status =
          err?.response?.statusCode ?? err?.response?.status ?? err?.statusCode;


        const retryable =
          status === 429 ||
          (status >= 500 && status < 600) ||
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT';

        if (!retryable || attempt > maxRetries) {
          this.logger.error(
            `SP-API failed [${context}] after ${attempt} attempts`,
            err?.stack ?? err,
          );
          throw err;
        }

        /**
         * Respect Amazon retry-after header if present
         */
        const retryAfter =
          err?.response?.headers?.['retry-after'] ??
          err?.response?.headers?.['x-amzn-ratelimit-reset'] ??
          err?.response?.headers?.['x-amzn-ratelimit-remaining'];

        let delay: number;

        if (retryAfter) {
          delay = Number(retryAfter) * 1000;
          if (isNaN(delay) || delay < 1000) delay = 30000; // fallback
        } else {
          const base = 2000;
          const max = 60_000;
          const exp = Math.min(max, base * 2 ** attempt);
          delay = Math.random() * exp; // full jitter
        }

        this.logger.warn(
          `SP-API retry ${attempt}/${maxRetries} [${context}] in ${Math.floor(
            delay,
          )}ms`,
        );

        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
}
