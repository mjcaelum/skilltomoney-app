import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('sheet validates totals, guards remaining seats and never exposes contact details',()=>{
  const rows=[['날짜','강좌','이름','연락처','인원','결제 금액','신청 시각']];
  const context=vm.createContext({
    Date,
    Utilities:{formatDate:date=>date.toISOString().slice(0,10)},
    Session:{getScriptTimeZone:()=> 'Asia/Seoul'},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},
    PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test-read-key'})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
    SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>rows}),appendRow:row=>rows.push(row)})}),flush(){}},
  });
  vm.runInContext(readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),context);
  const send=data=>JSON.parse(JSON.stringify(context.doPost({postData:{contents:JSON.stringify(data)}})));
  const valid={date:'2026-11-28',course:'스마트스토어',name:'=1+1',phone:'010-1111-2222',people:1,total:40000};
  assert.deepEqual(send({...valid,total:1}),{error:'input'});
  assert.equal(rows.length,1);
  assert.deepEqual(send(valid),{result:'ok'});
  assert.equal(rows[1][2],"'=1+1");
  assert.deepEqual(send(valid),{error:'capacity'});
  assert.equal(rows.length,2);
  assert.deepEqual(JSON.parse(JSON.stringify(context.doGet({parameter:{key:'wrong'}}))),{error:'key'});
  const result=JSON.parse(JSON.stringify(context.doGet({parameter:{key:'test-read-key'}})));
  assert.deepEqual(result,[{date:valid.date,course:valid.course,people:1,total:40000}]);
  rows[1][0]=new Date('2026-11-28T00:00:00Z');
  assert.deepEqual(send(valid),{error:'capacity'});
  assert.equal(context.doGet({parameter:{key:'test-read-key'}})[0].date,'2026-11-28');
});
