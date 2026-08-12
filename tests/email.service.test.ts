import { describe, expect, it, vi, afterEach } from 'vitest';
import { sendEmail } from '../worker/services/email.service';
import type { Env } from '../worker';

const env = {
  DB: {} as D1Database,
  ASSETS: {} as R2Bucket,
  PROJECT_NAME: 'Test',
  BREVO_API_KEY: 'test-brevo-key',
} as Env;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Email Service - Brevo', () => {
  it('envía correctamente una petición a Brevo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ messageId: '<test-message-id>' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await sendEmail(env, {
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Mensaje de prueba</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<test-message-id>');

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, request] = fetchMock.mock.calls[0];

    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request?.method).toBe('POST');

    const headers = request?.headers as Record<string, string>;
    expect(headers['api-key']).toBe('test-brevo-key');

    const body = JSON.parse(request?.body as string);

    expect(body.sender.email).toBe('eyestaff.ncarrillo@gmail.com');
    expect(body.to).toEqual([{ email: 'test@example.com' }]);
    expect(body.subject).toBe('Test');
    expect(body.htmlContent).toBe('<p>Mensaje de prueba</p>');
  });

  it('lanza error cuando Brevo devuelve un error HTTP', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    await expect(
      sendEmail(env, {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }),
    ).rejects.toThrow('Brevo API error (401)');
  });
});
