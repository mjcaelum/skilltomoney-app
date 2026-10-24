import { courses } from '../../../data/courses.js';

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({error:'올바른 JSON 요청이 아닙니다.'}, {status:400}); }
  if(!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({error:'신청 정보를 확인해 주세요.'},{status:400});
  const course = courses.find(course=>course.id === body.courseId);
  if(!course) return Response.json({error:'강좌를 찾을 수 없습니다.'},{status:400});
  const { people } = body;
  if(typeof body.name !== 'string'||!body.name.trim()||body.name.trim().length>60) return Response.json({error:'이름을 60자 이내로 입력해 주세요.'},{status:400});
  if(typeof body.phone !== 'string'||!/^\+?[\d\s()-]{7,30}$/.test(body.phone.trim())) return Response.json({error:'연락처를 올바르게 입력해 주세요.'},{status:400});
  if(!Number.isInteger(people)||people<1||people>course.seat-course.booked) return Response.json({error:`남은 자리는 ${course.seat-course.booked}석입니다. 인원을 확인해 주세요.`},{status:400});
  const url = process.env.SHEET_URL;
  if(!url) return Response.json({error:'예약 저장 연결을 준비 중입니다. 운영자에게 문의해 주세요.'},{status:503});
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return Response.json({error:'예약 저장 주소 설정을 확인해 주세요.'},{status:503});
  const payload = {date:course.date,course:course.name,name:body.name.trim(),phone:body.phone.trim(),people,total:course.price*people};
  try {
    const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000),cache:'no-store'});
    if(!response.ok) throw new Error('upstream');
    const data = await response.json();
    if(data.error==='capacity') return Response.json({error:'남은 자리가 부족합니다. 다른 강좌를 선택해 주세요.'},{status:409});
    if(data.result!=='ok') throw new Error('upstream');
    return Response.json({result:'ok'});
  } catch {
    return Response.json({error:'저장 완료를 확인하지 못했습니다. 중복 신청을 막기 위해 운영자에게 접수 여부를 확인해 주세요.'},{status:502});
  }
}
