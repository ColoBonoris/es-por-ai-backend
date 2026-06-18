import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import type { Response } from "express";

type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (isMongoDuplicateError(exception)) {
      response.status(HttpStatus.CONFLICT).json({
        error: {
          code: "CONFLICT",
          message: "Ya existe un recurso con esos datos."
        }
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (hasApiErrorShape(payload)) {
        response.status(status).json(payload);
        return;
      }

      response.status(status).json({
        error: {
          code: mapHttpStatusToErrorCode(status, exception),
          message: getExceptionMessage(payload)
        }
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado."
      }
    });
  }
}

export function createValidationException(fieldErrors: Record<string, string[]>) {
  return new BadRequestException({
    error: {
      code: "VALIDATION_ERROR",
      message: "Revisá los campos marcados.",
      fieldErrors
    }
  });
}

function hasApiErrorShape(payload: unknown): payload is { error: unknown } {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

function getExceptionMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "No se pudo completar la acción.";
}

function mapHttpStatusToErrorCode(
  status: number,
  exception: HttpException
): ApiErrorCode {
  if (exception instanceof UnauthorizedException) {
    return "UNAUTHORIZED";
  }

  if (exception instanceof ForbiddenException) {
    return "FORBIDDEN";
  }

  if (exception instanceof NotFoundException) {
    return "NOT_FOUND";
  }

  if (exception instanceof ConflictException) {
    return "CONFLICT";
  }

  if (exception instanceof BadRequestException) {
    return "VALIDATION_ERROR";
  }

  return status >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR";
}

function isMongoDuplicateError(exception: unknown) {
  return (
    typeof exception === "object" &&
    exception !== null &&
    "code" in exception &&
    exception.code === 11000
  );
}
