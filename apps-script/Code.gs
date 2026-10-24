// Keep these values aligned with data/courses.js. booked is the lesson's starting count.
const COURSES = [
  {name:'AI 자동화',date:'2026-11-07',price:35000,seat:8,booked:8},
  {name:'숏폼 편집',date:'2026-11-14',price:45000,seat:6,booked:2},
  {name:'엑셀 실무',date:'2026-11-21',price:30000,seat:10,booked:7},
  {name:'스마트스토어',date:'2026-11-28',price:40000,seat:6,booked:5},
  {name:'블로그 수익화',date:'2026-12-05',price:38000,seat:6,booked:0},
];

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function sheetDate(value) {
  return value instanceof Date ? Utilities.formatDate(value,Session.getScriptTimeZone(),'yyyy-MM-dd') : String(value);
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); }
  catch (error) { return jsonResponse({error:'input'}); }
  if(!data || typeof data!=='object') return jsonResponse({error:'input'});
  const course = COURSES.find(c=>c.name===data.course && c.date===data.date);
  if(!course || typeof data.name!=='string' || !data.name.trim() || data.name.length>60 ||
    typeof data.phone!=='string' || !/^\+?[\d\s()-]{7,30}$/.test(data.phone.trim()) ||
    !Number.isInteger(data.people) || data.people<1 || data.total!==course.price*data.people) {
    return jsonResponse({error:'input'});
  }
  const lock = LockService.getScriptLock();
  if(!lock.tryLock(10000)) return jsonResponse({error:'busy'});
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('예약');
    if(!sheet) return jsonResponse({error:'sheet'});
    const rows = sheet.getDataRange().getValues().slice(1);
    const reserved = rows.filter(row=>sheetDate(row[0])===course.date && row[1]===course.name).reduce((sum,row)=>sum+(Number(row[4])||0),0);
    if(course.booked+reserved+data.people>course.seat) return jsonResponse({error:'capacity'});
    // A leading apostrophe keeps user text from being interpreted as a spreadsheet formula.
    const name = /^[=+\-@\t\r\n]/.test(data.name.trim()) ? "'"+data.name.trim() : data.name.trim();
    sheet.appendRow([data.date,data.course,name,"'"+data.phone.trim(),data.people,course.price*data.people,new Date()]);
    SpreadsheetApp.flush();
    return jsonResponse({result:'ok'});
  } catch(error) { return jsonResponse({error:'storage'}); }
  finally { lock.releaseLock(); }
}

function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('READ_KEY');
  if(!key || !e || !e.parameter || e.parameter.key!==key) return jsonResponse({error:'key'});
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('예약');
  if(!sheet) return jsonResponse({error:'sheet'});
  const rows = sheet.getDataRange().getValues().slice(1);
  return jsonResponse(rows.filter(row=>row[0] && row[1]).map(row=>({
    date:sheetDate(row[0]),
    course:String(row[1]),people:Number(row[4]),total:Number(row[5]),
  })));
}
