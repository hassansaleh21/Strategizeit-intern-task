import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const SENSITIVE_FIELDS = ['password', 'refreshToken', 'accessToken'];

function redact(body: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!body) return {};
  const clone = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clone) clone[field] = '[REDACTED]';
  }
  return clone;
}

/**
 * Wire this up globally (app.useGlobalInterceptors) so no request/response
 * logger anywhere in the app can accidentally print a raw password or token.
 * The AuthService/CredentialsService above never log dto.password directly,
 * but this is a second line of defense at the HTTP layer.
 */
@Injectable()
export class RedactSensitiveFieldsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const safeBody = redact(req.body);

    this.logger.log(`${req.method} ${req.url} - body: ${JSON.stringify(safeBody)}`);

    return next.handle().pipe(
      tap(() => {
        // response bodies (accessToken/refreshToken) are also never logged here
      }),
    );
  }
}
