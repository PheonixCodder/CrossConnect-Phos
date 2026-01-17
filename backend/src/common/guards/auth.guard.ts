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
    return request.headers.authorization;
  }
}
