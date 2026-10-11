import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * What every failed request becomes before it reaches a portal: the shared error
 * envelope, the HTTP status (0 = no answer) and the message a person sees, decided
 * here, in ONE place (property-docs, 12-ux-ui/design-system.md, "Error handling").
 * The `message` of the API is written for developers and is never shown.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: FieldError[];
  traceId: string;
  userMessage: string;
}

export function toApiError(err: HttpErrorResponse, correlationId: string, path: string): ApiError {
  const envelope = typeof err.error === 'object' && err.error !== null ? err.error : {};
  const status = err.status;
  const code: string = envelope.error ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`);
  // With no answer, the reference is the X-Correlation-Id the container sent.
  const traceId: string = envelope.traceId ?? err.headers?.get('X-Correlation-Id') ?? correlationId;
  return {
    status,
    code,
    message: envelope.message ?? err.message,
    details: envelope.details ?? [],
    traceId,
    userMessage: describe(status, code, path, traceId),
  };
}

function describe(status: number, code: string, path: string, traceId: string): string {
  // Fallback only: the portal shows the error of each `details` entry next to its field.
  // An error next to a field carries no reference.
  if (status === 400) return 'Algunos datos no son válidos. Revísalos e intenta de nuevo.';
  return `${text(status, code, path)}. Referencia: ${traceId}`;
}

function text(status: number, code: string, path: string): string {
  if (status === 0) return code === 'TIMEOUT' ? 'Esto está tardando más de lo normal' : 'Sin conexión';
  if (status === 401) {
    return path.startsWith('/api/v1/login') ? 'Correo o contraseña incorrectos' : 'Tu sesión expiró';
  }
  if (status === 403) return 'No tienes permiso para ver esto';
  if (status === 404) return 'No encontramos lo que buscas';
  // Fallback only: the screen replaces it with its own text for the refused action.
  if (status === 422) return 'No se pudo completar esta acción';
  if (status === 429) return 'Demasiados intentos. Intenta de nuevo en unos minutos';
  // 502 and 504: the gateway could not reach the service, like a 503.
  if (status === 502 || status === 503 || status === 504) {
    return 'El servicio no está disponible en este momento';
  }
  return 'Algo salió mal de nuestro lado';
}
