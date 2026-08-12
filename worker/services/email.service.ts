import type { Env } from '../index';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface BrevoResponse {
  messageId?: string;
}

export async function sendEmail(
  env: Env,
  options: SendEmailOptions,
): Promise<{ success: true; messageId?: string }> {
  if (!env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY no está configurada');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: 'eyestaff.ncarrillo@gmail.com',
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as BrevoResponse;

  return {
    success: true,
    messageId: result.messageId,
  };
}
