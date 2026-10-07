import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

const TRACE = 'trace-123';

function fail(status: number, url = '/api/v1/reservas', error: unknown = { traceId: TRACE }) {
  return toApiError(new HttpErrorResponse({ status, error, url }), 'corr-1', url);
}

describe('toApiError', () => {
  it.each([
    [401, 'Tu sesión expiró. Referencia: trace-123'],
    [403, 'No tienes permiso para ver esto. Referencia: trace-123'],
    [404, 'No encontramos lo que buscas. Referencia: trace-123'],
    [422, 'No se pudo completar esta acción. Referencia: trace-123'],
    [429, 'Demasiados intentos. Intenta de nuevo en unos minutos. Referencia: trace-123'],
    [500, 'Algo salió mal de nuestro lado. Referencia: trace-123'],
    [503, 'El servicio no está disponible en este momento. Referencia: trace-123'],
    [502, 'El servicio no está disponible en este momento. Referencia: trace-123'],
    [504, 'El servicio no está disponible en este momento. Referencia: trace-123'],
    [501, 'Algo salió mal de nuestro lado. Referencia: trace-123'],
    [413, 'Algo salió mal de nuestro lado. Referencia: trace-123'],
  ])('gives status %i its message with the reference', (status, expected) => {
    expect(fail(status).userMessage).toBe(expected);
  });

  it('gives a 400 a fallback message without reference, never the message of the API', () => {
    const error = fail(400, '/api/v1/reservas', {
      error: 'VALIDATION_ERROR', message: 'must be after fechaInicio', traceId: TRACE,
      details: [{ field: 'fechaFin', message: 'must be after fechaInicio' }],
    });
    expect(error.userMessage).toBe('Algunos datos no son válidos. Revísalos e intenta de nuevo.');
    expect(error.details).toEqual([{ field: 'fechaFin', message: 'must be after fechaInicio' }]);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('gives the 401 of the login the wrong-credentials message', () => {
    expect(fail(401, '/api/v1/login').userMessage)
      .toBe('Correo o contraseña incorrectos. Referencia: trace-123');
  });

  it('says there is no connection when no answer arrived, with the correlation id', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0 }), 'corr-1', '/api/v1/reservas');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.traceId).toBe('corr-1');
    expect(error.userMessage).toBe('Sin conexión. Referencia: corr-1');
  });

  it('says it is taking too long on a timeout', () => {
    const http = new HttpErrorResponse({ status: 0, error: { error: 'TIMEOUT' } });
    const error = toApiError(http, 'corr-1', '/api/v1/reservas');
    expect(error.code).toBe('TIMEOUT');
    expect(error.userMessage).toBe('Esto está tardando más de lo normal. Referencia: corr-1');
  });
});
