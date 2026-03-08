import Header from '@/components/common/Header';
import Providers from '@/components/Providers';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="app">
        <Header />
        <main>{children}</main>
      </div>
    </Providers>
  );
}
