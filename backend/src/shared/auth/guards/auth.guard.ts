import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Request } from 'express';
import { BaseSupabaseAuthGuard } from 'nestjs-supabase-js';

@Injectable()
export class MyAuthGuard extends BaseSupabaseAuthGuard {
  public constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient);
  }

  protected extractTokenFromRequest(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (!/^Bearer$/i.test(scheme) || !token) {
      return undefined;
    }

    return token;
  }
}
