import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/reserve/route.js';

const originalFetch=globalThis.fetch, originalUrl=process.env.SHEET_URL;
afterEach(()=>{globalThis.fetch=originalFetch;if(originalUrl===undefined)delete process.env.SHEET_URL;else process.env.SHEET_URL=originalUrl;});
const valid={courseId:2,name:'김하늘',phone:'010-1111-2222',people:2};
function request(body){return new Request('http://localhost/api/reserve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}

test('invalid names, seats and people never reach the sheet',async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('must not send');};
  for(const body of [null,[],{}, {...valid,name:' '},{...valid,phone:'=IMPORTXML()'},{...valid,people:0},{...valid,people:-1},{...valid,people:1.5},{...valid,people:'2'},{...valid,people:5},{...valid,courseId:1}]) {
    assert.equal((await POST(request(body))).status,400);
  }
  assert.equal(calls,0);
  const malformed=new Request('http://localhost/api/reserve',{method:'POST',body:'{'});
  assert.equal((await POST(malformed)).status,400);
});
test('the server owns date, course and total',async()=>{
  process.env.SHEET_URL='https://script.google.com/macros/s/test-deployment/exec';
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,process.env.SHEET_URL);
    assert.deepEqual(JSON.parse(options.body),{date:'2026-11-14',course:'숏폼 편집',name:'김하늘',phone:valid.phone,people:2,total:90000});
    return Response.json({result:'ok'});
  };
  const response=await POST(request({...valid,total:1,course:'AI 자동화',date:'1900-01-01'}));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{result:'ok'});
});
test('missing configuration, capacity conflicts and failed storage are not successes',async()=>{
  delete process.env.SHEET_URL;
  assert.equal((await POST(request(valid))).status,503);
  process.env.SHEET_URL='https://attacker.invalid/exec';
  assert.equal((await POST(request(valid))).status,503);
  process.env.SHEET_URL='https://script.google.com/macros/s/test-deployment/exec';
  globalThis.fetch=async()=>Response.json({error:'capacity'});
  assert.equal((await POST(request(valid))).status,409);
  globalThis.fetch=async()=>new Response('<html>login</html>');
  const response=await POST(request(valid));
  assert.equal(response.status,502);
  assert.ok(!(JSON.stringify(await response.json())).includes('script.google.com'));
});
