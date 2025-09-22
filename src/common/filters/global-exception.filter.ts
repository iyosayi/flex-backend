import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  message?: string | string[];
  error?: string;
  code?: string;
  [key: string]: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = HttpStatus[status];
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorBody: ErrorResponseBody =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as ErrorResponseBody);

      ({ message, details } = this.extractMessageAndDetails(errorBody, exception.message));
      code = (errorBody.code as string) ?? (errorBody.error as string) ?? HttpStatus[status];
    } else if (exception instanceof Error) {
      message = exception.message || message;
      code = exception.name || code;
      details = null;
    }

    this.logger.error(
      `HTTP ${status} ${request.method} ${request.url} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message,
        code,
        details,
      },
      timestamp,
      path: request.url,
    });
  }

  private extractMessageAndDetails(
    errorBody: ErrorResponseBody,
    fallbackMessage: string,
  ): { message: string; details: unknown } {
    const rawMessage = errorBody.message;

    if (Array.isArray(rawMessage)) {
      return {
        message: rawMessage[0] ?? fallbackMessage,
        details: rawMessage,
      };
    }

    if (typeof rawMessage === 'string' && rawMessage.length > 0) {
      return { message: rawMessage, details: errorBody.details ?? null };
    }

    if (typeof errorBody.error === 'string' && errorBody.error.length > 0) {
      return { message: errorBody.error, details: errorBody.details ?? null };
    }

    return { message: fallbackMessage, details: errorBody };
  }
}
