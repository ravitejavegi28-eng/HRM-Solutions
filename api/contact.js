import nodemailer from 'nodemailer';
import { createContactHandler } from '../lib/contact.mjs';

const handler = createContactHandler({ send: async message => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000,
    tls: { minVersion: 'TLSv1.2' }, logger: false, debug: false
  });
  try { return await transport.sendMail(message); }
  finally { transport.close(); }
} });

export const GET = handler;
export const POST = handler;
