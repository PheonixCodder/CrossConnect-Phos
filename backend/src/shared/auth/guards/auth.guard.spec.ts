import { Request } from 'express';
import { MyAuthGuard } from './auth.guard';

class TestAuthGuard extends MyAuthGuard {
  constructor() {
    super({} as never);
  }

  extract(request: Partial<Request>): string | undefined {
    return this.extractTokenFromRequest(request as Request);
  }
}

describe('MyAuthGuard', () => {
  let guard: TestAuthGuard;

  beforeEach(() => {
    guard = new TestAuthGuard();
  });

  it('extracts a Bearer token without returning the scheme', () => {
    expect(
      guard.extract({
        headers: {
          authorization: 'Bearer token-1',
        },
      }),
    ).toBe('token-1');
  });

  it('trims surrounding whitespace and repeated spacing', () => {
    expect(
      guard.extract({
        headers: {
          authorization: '  Bearer   token-1  ',
        },
      }),
    ).toBe('token-1');
  });

  it('accepts a case-insensitive Bearer scheme', () => {
    expect(
      guard.extract({
        headers: {
          authorization: 'bearer token-1',
        },
      }),
    ).toBe('token-1');
  });

  it('rejects missing or malformed authorization headers', () => {
    expect(
      guard.extract({
        headers: {},
      }),
    ).toBeUndefined();
    expect(
      guard.extract({
        headers: {
          authorization: 'token-1',
        },
      }),
    ).toBeUndefined();
    expect(
      guard.extract({
        headers: {
          authorization: 'Basic token-1',
        },
      }),
    ).toBeUndefined();
  });
});
