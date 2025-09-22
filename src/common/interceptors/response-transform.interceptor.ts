import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const baseResponse: Record<string, unknown> = {
          success: true,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const { meta, data: innerData, cursor, ...rest } = data as Record<string, unknown>;

          let payload: unknown = innerData ?? rest;

          if (innerData !== undefined && Object.keys(rest).length > 0) {
            payload = { payload: innerData, ...rest };
          }

          baseResponse.data = payload;

          if (meta !== undefined) {
            baseResponse.meta = meta;
          }

          if (cursor !== undefined) {
            baseResponse.meta = {
              ...(baseResponse.meta as Record<string, unknown> | undefined),
              cursor,
            };
          }

          return baseResponse;
        }

        return {
          ...baseResponse,
          data,
        };
      }),
    );
  }
}
