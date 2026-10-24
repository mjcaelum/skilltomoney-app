import { courses } from '../data/courses';
import CourseCatalog from './course-catalog';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <header className="site-header"><Link className="brand" href="/">스킬투머니<span>배움의 다음을 만듭니다</span></Link><nav aria-label="주 메뉴"><a href="#courses">강좌 둘러보기</a><a href="/lab.html">파이썬 실습실</a></nav></header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div><p className="hero-intro">하루의 배움이, 내일의 가능성으로.</p><h1 id="hero-title">배운 기술을<br/>돈으로.</h1><p className="hero-copy">배운 기술이 돈이 되는 원데이 클래스<br/>작게 배우고, 직접 만들고, 나의 일에 써보세요.</p><a href="#courses" className="button">나에게 맞는 강좌 찾기 <span aria-hidden="true">↗</span></a></div>
          <aside className="workshop-note"><div className="note-top"><span>11월 원데이 강좌</span><span>2026</span></div><p className="note-title">거창한 시작보다<br/>완성하는 하루.</p><p>AI 자동화부터 콘텐츠, 실무, 창업까지.<br/>소수 정원으로 함께 만들며 배웁니다.</p><div className="note-bottom"><span>토요일에 만나요</span><span aria-hidden="true">✳</span></div></aside>
        </section>
        <CourseCatalog courses={courses}/>
        <section className="teach" id="teach"><div><h2>나도 가르칠 수 있는 기술이 있다면?</h2><p>누군가에게는 당신의 경험이 첫걸음이 됩니다.</p></div><details><summary className="button secondary">내 기술로 강좌 열기</summary><p>강좌 주제, 대상, 수업 시간과 준비물을 정리해 주세요.<br/>강사 모집 접수는 준비 중입니다.</p></details></section>
      </main>
      <footer><Link className="brand" href="/">스킬투머니</Link><p>배운 기술을 돈으로, 원데이 강좌 플랫폼</p><nav aria-label="학습 자료"><a href="/intro.html">1~3장 소개 페이지</a>{[2,3,4,5,6].map(chapter=><a key={chapter} href={chapter===2?'/lab.html':`/lab0${chapter}.html`}>{chapter}장 실습실</a>)}</nav></footer>
    </>
  );
}
