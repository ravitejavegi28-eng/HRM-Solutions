import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const services = {
  hiring: 'US IT staffing enquiry',
  implementation: 'Software implementation enquiry',
  'staffing-software': 'Staffing software enquiry'
};
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
const json = (status, message, extra = {}) => Response.json({ message, ...extra }, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export function createContactHandler({ env = process.env, send, now = Date.now, log = console.error } = {}) {
  // Supplemental instance-local throttling, not a distributed rate limit.
  const attempts = new Map(), usedTokens = new Map();
  const signature = value => createHmac('sha256', env.SMTP_PASS).update(value).digest('hex');
  const configured = () => env.SMTP_HOST === 'smtp.hostinger.com' && env.SMTP_PORT === '465'
    && emailPattern.test(env.SMTP_USER || '') && emailPattern.test(env.CONTACT_TO_EMAIL || '') && !!env.SMTP_PASS;
  return async request => {
    if (!['GET', 'POST'].includes(request.method)) {
      return new Response(null, { status: 405, headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' } });
    }
    if (!configured()) return json(503, 'Online sending is unavailable. Please email info@hrm-solutions.com.');
    const time = now();
    for (const [key, entry] of attempts) if (time - entry.time > 600_000) attempts.delete(key);
    for (const [key, expiry] of usedTokens) if (expiry < time) usedTokens.delete(key);
    if (request.method === 'GET') {
      const payload = `${time}.${randomBytes(16).toString('hex')}`;
      return json(200, 'Ready', { token: `${payload}.${signature(payload)}` });
    }
    if (request.headers.get('origin') !== 'https://www.hrm-solutions.com' &&
        !(env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(request.headers.get('origin') || ''))) {
      return json(403, 'Please submit this form from our website.');
    }
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return json(415, 'Please use the website form.');
    if (Number(request.headers.get('content-length')) > 16000) return json(413, 'Your enquiry is too long.');
    let input;
    try {
      // Bound the streamed body too: Content-Length is not always present.
      const reader = request.body?.getReader();
      if (!reader) return json(400, 'Please complete the form.');
      const chunks = []; let size = 0;
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 16000) { await reader.cancel(); return json(413, 'Your enquiry is too long.'); }
        chunks.push(Buffer.from(value));
      }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { return json(400, 'Please complete the form and try again.'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json(400, 'Invalid form.');
    if (input.website) return json(400, 'Unable to submit this form.');
    const fields = { name: 100, email: 160, company: 160, role: 100, location: 160, timing: 100, message: 2000, interest: 30 };
    const data = {};
    for (const [key, max] of Object.entries(fields)) {
      const value = input[key] ?? '';
      if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)
          || (key !== 'message' && /[\r\n]/.test(value))) return json(400, 'Check your form fields and try again.');
      data[key] = value.trim();
    }
    if (!data.name || !emailPattern.test(data.email) || !data.message || !Object.hasOwn(services, data.interest)) {
      return json(400, 'Enter your name, a valid email, service, and requirements.');
    }
    const token = typeof input.token === 'string' ? input.token : '';
    const parts = token.split('.');
    if (parts.length !== 3 || !/^\d{13}$/.test(parts[0]) || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2]) ||
        !timingSafeEqual(Buffer.from(signature(`${parts[0]}.${parts[1]}`)), Buffer.from(parts[2]))) {
      return json(400, 'Refresh the form and try again.');
    }
    const age = time - Number(parts[0]);
    if (age < 3000 || age > 3600_000) return json(400, 'Please wait a few seconds, or refresh an expired form, and try again.');
    if (usedTokens.has(token)) return json(409, 'This submission was already attempted. Please check your confirmation before retrying.');
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = createHmac('sha256', env.SMTP_PASS).update(ip).digest('hex');
    const entry = attempts.get(key) || { time, count: 0 };
    if (entry.count >= 5 || attempts.size >= 10000 || usedTokens.size >= 10000) return json(429, 'Too many enquiries. Please try again later or email us.');
    entry.count++; attempts.set(key, entry); usedTokens.set(token, time + 3600_000);
    try {
      const result = await send({
        from: { name: 'HRM-Solutions website', address: env.SMTP_USER },
        to: env.CONTACT_TO_EMAIL,
        replyTo: { name: data.name, address: data.email },
        subject: `${services[data.interest]}${data.company ? ` — ${data.company}` : ''}`,
        text: ['Website enquiry', '', `Service: ${services[data.interest]}`, `Name: ${data.name}`, `Email: ${data.email}`,
          `Company: ${data.company || 'Not provided'}`, `Role: ${data.role || 'Not provided'}`,
          `Location: ${data.location || 'Not provided'}`, `Timeline: ${data.timing || 'Not provided'}`, '', data.message].join('\n'),
        disableFileAccess: true, disableUrlAccess: true
      });
      if (!result?.accepted?.length || result.rejected?.length) throw new Error('SMTP_NOT_ACCEPTED');
      return json(200, 'Thank you. Your enquiry has been submitted to our team.');
    } catch {
      // Never log passwords, SMTP responses, addresses, or enquiry contents.
      log('Contact form: SMTP delivery could not be confirmed.');
      return json(502, 'We could not confirm sending. Please email info@hrm-solutions.com if you need help.');
    }
  };
}
