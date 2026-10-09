import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../lib/contact.mjs';
const env = { SMTP_HOST: 'smtp.hostinger.com', SMTP_PORT: '465', SMTP_USER: 'info@example.com', CONTACT_TO_EMAIL: 'inbox@example.com', SMTP_PASS: 'test-only-password', NODE_ENV: 'production' };
const good = { name: 'Test Person', email: 'visitor@example.com', message: 'A test staffing request', interest: 'hiring', company: 'Example' };
function fixture(send = async () => ({ accepted: ['inbox@example.com'], rejected: [] })) {
 let time = 1791500000000; const mails=[];
 const handler = createContactHandler({ env, now:()=>time, log:()=>{}, send:async m=>{mails.push(m);return send(m);} });
 return {handler,mails, advance:n=>time+=n, token:async()=>{const r=await handler(new Request('https://www.hrm-solutions.com/api/contact/'));return (await r.json()).token;}, post:(body,headers={})=>handler(new Request('https://www.hrm-solutions.com/api/contact/',{method:'POST',headers:{origin:'https://www.hrm-solutions.com','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1',...headers},body:JSON.stringify(body)}))};
}
test('valid enquiry uses fixed sender and recipient and visitor reply-to',async()=>{
 const f=fixture();const token=await f.token();f.advance(4000);
 assert.equal((await f.post({...good,token,to:'attacker@example.com'})).status,200);
 assert.equal(f.mails[0].to,env.CONTACT_TO_EMAIL);assert.equal(f.mails[0].from.address,env.SMTP_USER);
 assert.equal(f.mails[0].replyTo.address,good.email);assert.ok(!f.mails[0].html);
 assert.equal((await f.post({...good,token})).status,409);assert.equal(f.mails.length,1);
});
test('invalid input, cross-site, honeypot, timing and forged tokens never send',async()=>{
 const f=fixture();const token=await f.token();assert.equal((await f.post({...good,token})).status,400);f.advance(4000);
 for(const bad of [{email:'bad'}, {interest:'__proto__'}, {name:'X\r\nBcc: other@example.com'}, {message:'x'.repeat(2001)}, {website:'spam'}, {token:'fake'}, {email:['visitor@example.com']}]) assert.equal((await f.post({...good,token,...bad})).status,400);
 assert.equal((await f.post({...good,token},{origin:'https://other.example'})).status,403);
 assert.equal((await f.post({...good,token},{'content-type':'text/plain'})).status,415);
 assert.equal((await f.post({...good,token,message:'x'.repeat(17000)})).status,413);
 f.advance(3600001);assert.equal((await f.post({...good,token})).status,400);assert.equal(f.mails.length,0);
});
test('SMTP rejection and exceptions never claim success or expose errors',async()=>{
 for(const send of [async()=>{throw Error('SECRET SMTP PASSWORD')},async()=>({accepted:[],rejected:['inbox@example.com']})]){
 const f=fixture(send);const token=await f.token();f.advance(4000);const r=await f.post({...good,token});assert.equal(r.status,502);assert.ok(!(await r.text()).includes('SECRET'));
 }
});
test('instance throttle rejects sixth request and recovers after window',async()=>{
 const f=fixture();for(let i=0;i<6;i++){const token=await f.token();f.advance(4000);assert.equal((await f.post({...good,token})).status,i<5?200:429)}
 assert.equal(f.mails.length,5);f.advance(600001);const token=await f.token();f.advance(4000);assert.equal((await f.post({...good,token})).status,200);
});
test('missing configuration and unsupported methods fail closed',async()=>{
 const handler=createContactHandler({env:{},send:()=>assert.fail('must not send')});
 assert.equal((await handler(new Request('https://example.com'))).status,503);
 const r=await handler(new Request('https://example.com',{method:'DELETE'}));assert.equal(r.status,405);
});
