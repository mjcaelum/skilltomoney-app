import './globals.css';

export const metadata = {
  title: '스킬투머니 | 배운 기술을 돈으로',
  description: '작은 수업에서 시작하는 새로운 가능성. 스킬투머니 원데이 강좌를 만나보세요.',
};

export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
