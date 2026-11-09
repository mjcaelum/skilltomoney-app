'use client';

import { useEffect, useRef, useState } from 'react';

export default function CourseCatalog({ courses }) {
  const [bookings, setBookings] = useState([]);
  const [seatNotice, setSeatNotice] = useState('최신 좌석을 확인하고 있습니다.');
  const catalog = courses.map(course=>({...course,booked:Math.min(course.seat,bookings.find(item=>item.id===course.id)?.booked ?? course.booked)}));
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);
  const dialog = useRef(null);
  const pending = useRef(false);

  function refreshSeats() {
    return fetch('/api/reserve',{cache:'no-store'})
      .then(async response=>{
        const data = await response.json();
        if(!response.ok) throw new Error(data.error);
        setBookings(data); setSeatNotice('');
      })
      .catch(error=>{ setSeatNotice(`${error.message || '최신 좌석을 불러오지 못했습니다.'} 표시된 좌석은 마지막 확인값이며, 신청 시 실제 잔여 좌석을 검사합니다.`); });
  }

  useEffect(()=>{ refreshSeats(); },[]);

  function open(course) {
    setSelected(course); setNotice(''); setSuccess(false);
    dialog.current.showModal();
  }

  async function reserve(event) {
    event.preventDefault();
    if(pending.current) return;
    const form = new FormData(event.currentTarget);
    const name = form.get('name').trim(), phone = form.get('phone').trim(), people = Number(form.get('people'));
    if(!name) { setNotice('이름을 입력해 주세요.'); return; }
    if(!Number.isInteger(people)||people<1||people>selected.seat-selected.booked) { setNotice(`인원은 1명부터 ${selected.seat-selected.booked}명까지 입력해 주세요.`); return; }
    pending.current = true; setSaving(true); setNotice('');
    try {
      const response = await fetch('/api/reserve', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({courseId:selected.id,name,phone,people})});
      const data = await response.json();
      if(!response.ok) throw new Error(data.error||'저장하지 못했습니다.');
      setSuccess(true); setNotice('예약 신청이 완료되었습니다');
      setBookings(catalog.map(course=>({id:course.id,booked:course.booked+(course.id===selected.id?people:0)})));
      await refreshSeats();
    } catch(error) { setNotice(error.message || '연결 상태를 확인한 뒤 다시 시도해 주세요.'); }
    finally { pending.current=false; setSaving(false); }
  }

  return (
    <section className="catalog" id="courses" aria-labelledby="courses-title">
      <div className="section-heading"><div><p className="muted">지금, 새로운 기술 하나</p><h2 id="courses-title">하루를 투자하는 배움</h2></div><label className="filter"><input type="checkbox" checked={onlyOpen} onChange={event=>setOnlyOpen(event.target.checked)}/>예약 가능한 강좌만 보기</label></div>
      <p className="muted" role="status">{seatNotice}</p>
      <div className="course-grid">{catalog.filter(course=>!onlyOpen||course.seat>course.booked).map(course=>{
        const left=course.seat-course.booked;
        return <article className="course" key={course.id}><div className="course-date"><time dateTime={course.date}>{Number(course.date.slice(5,7))}월 {Number(course.date.slice(8,10))}일 · 토요일</time>{left===0?<span className="badge closed">마감</span>:left<=2?<span className="badge urgent">마감 임박</span>:null}</div><h3>{course.name}</h3><div className="tags">{course.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p className="description">{course.description}</p><div className="course-bottom"><div><strong className="price">{course.price.toLocaleString('ko-KR')}<small>원</small></strong><p className="seats">남은 좌석 {left}석 / 정원 {course.seat}명</p></div><button disabled={left===0} onClick={()=>open(course)}>{left===0?'예약 마감':'예약하기'}</button></div></article>;
      })}</div>
      <dialog ref={dialog} className="reservation" onCancel={event=>{if(saving) event.preventDefault();}}>
        {selected ? <form key={selected.id} onSubmit={reserve}><div className="dialog-heading"><h2>예약 신청</h2><button type="button" className="close" aria-label="닫기" disabled={saving} onClick={()=>dialog.current.close()}>×</button></div><p className="selected-course">{selected.name} · {selected.date}</p><p className="muted">수강료 {selected.price.toLocaleString('ko-KR')}원 / 1명</p><fieldset disabled={saving||success}><label>이름<input name="name" autoComplete="name" required maxLength={60}/></label><label>연락처<input name="phone" type="tel" autoComplete="tel" placeholder="010-1234-5678" required maxLength={30}/></label><label>인원<input name="people" type="number" min="1" max={selected.seat-selected.booked} step="1" defaultValue="1" required/></label></fieldset><p className={success?'notice success':'notice error'} role="status">{notice}</p><div className="dialog-actions"><button type="button" className="secondary" disabled={saving} onClick={()=>dialog.current.close()}>닫기</button><button type="submit" disabled={saving||success}>{saving?'저장 중...':success?'신청 완료':'신청'}</button></div></form>:null}
      </dialog>
    </section>
  );
}
