import type { ValidationError } from "class-validator";

import { createValidationException } from "@/presentation/common/http/api-error.filter";

export function validationExceptionFactory(errors: ValidationError[]) {
  return createValidationException(flattenValidationErrors(errors));
}

function flattenValidationErrors(errors: ValidationError[]) {
  const fieldErrors: Record<string, string[]> = {};

  function visit(error: ValidationError, path: string) {
    const key = path ? `${path}.${error.property}` : error.property;

    if (error.constraints) {
      fieldErrors[key] = Object.values(error.constraints);
    }

    for (const child of error.children ?? []) {
      visit(child, key);
    }
  }

  for (const error of errors) {
    visit(error, "");
  }

  return fieldErrors;
}
