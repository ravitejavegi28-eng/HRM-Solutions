import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContactHandler } from '../lib/contact.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';
const env={SMTP_HOST:'smtp.hostinger.com',SMTP_PORT:'465',SMTP_USER:'info@example.com',CONTACT_TO_EMAIL:'info@example.com',SMTP_PASS:'test-secret',NODE_ENV:'production'};
const origin='https://www.hrm-solutions.com';
const request=(body,headers={})=>new Request(origin+'/api/contact/',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});

test('malformed requests and token retrieval share an early bounded throttle',async()=>{
 let time=1791500000000;const h=createContactHandler({env,now:()=>time,send:()=>assert.fail('must not send')});
 for(let i=0;i<30;i++)assert.equal((await h(request({}))).status,400);
 const blocked=await h(new Request(origin+'/api/contact/'));assert.equal(blocked.status,429);assert.ok(blocked.headers.get('retry-after'));time+=60001;assert.equal((await h(new Request(origin+'/api/contact/'))).status,200);
});
test('cross-site fetches and CORS preflights cannot send or read tokens',async()=>{
 const h=createContactHandler({env,send:()=>assert.fail('must not send')});
 for(const r of [new Request(origin+'/api/contact/',{headers:{'sec-fetch-site':'cross-site'}}),request({},{origin:'https://attacker.example'})]){const res=await h(r);assert.equal(res.status,403);assert.equal(res.headers.get('access-control-allow-origin'),null)}
 assert.equal((await h(new Request(origin+'/api/contact/',{method:'OPTIONS'}))).status,405);
});
test('HTML payloads remain text-only email; recipient and message options cannot be overridden',async()=>{
 let time=1791500000000,sent;const h=createContactHandler({env,now:()=>time,send:async m=>{sent=m;return {accepted:['info@example.com']}}});const token=(await (await h(new Request(origin))).json()).token;time+=4000;
 const html='<img src=x onerror=alert(1)><script>alert(1)</script>';
 const r=await h(request({name:'Test',email:'visitor@example.com',interest:'hiring',message:html,token,html,attachments:[{path:'/etc/passwd'}],to:'attacker@example.com'}));
 assert.equal(r.status,200);assert.ok(sent.text.includes(html));assert.equal(sent.html,undefined);assert.equal(sent.attachments,undefined);assert.equal(sent.to,env.CONTACT_TO_EMAIL);assert.equal(sent.disableFileAccess,true);assert.equal(sent.disableUrlAccess,true);
});
test('oversized streamed bodies without Content-Length are rejected',async()=>{
 const h=createContactHandler({env,send:()=>assert.fail('must not send')});
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(16001)));c.close()}});
 const r=await h(new Request(origin+'/api/contact/',{method:'POST',duplex:'half',headers:{origin,'content-type':'application/json'},body}));assert.equal(r.status,413);
});
test('security policy permits only the exact initial script and forbids unsafe execution',async()=>{
 const config=JSON.parse(await readFile('vercel.json','utf8'));const headers=Object.fromEntries(config.headers[0].headers.map(x=>[x.key.toLowerCase(),x.value]));const html=await readFile('public/index.html','utf8');const script=html.match(/<script>(.*?)<\/script>/s)[1];const hash=createHash('sha256').update(script).digest('base64');
 assert.ok(headers['content-security-policy'].includes(`'sha256-${hash}'`));assert.ok(!/unsafe-inline|unsafe-eval|\*/.test(headers['content-security-policy']));assert.ok(headers['content-security-policy'].includes("frame-ancestors 'none'"));assert.equal(headers['x-content-type-options'],'nosniff');
});
test('private and unused files are absent from public output and return 404',async()=>{
 const server=createPreviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));try{for(const path of ['/.env','/.git/config','/api/contact.js','/lib/contact.mjs','/package.json','/admin/','/assets/images/industry-retail.webp','/BRD_HRM_Business_Solutions.pdf'])assert.equal((await fetch(`http://127.0.0.1:${server.address().port}${path}`)).status,404,path);const r=await fetch(`http://127.0.0.1:${server.address().port}/`);assert.equal(r.headers.get('x-frame-options'),'DENY');}finally{await new Promise(r=>server.close(r));}
});
