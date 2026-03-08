import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Семья Чебаковых - Семейное древо',
  description: 'Интерактивное семейное древо семьи Чебаковых',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
