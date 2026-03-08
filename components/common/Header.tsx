'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreePine, Clock, Map, Settings } from 'lucide-react';
import './Header.css';

export default function Header() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);
    return isActive ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className="main-header">
      <div className="header-brand">
        <TreePine size={28} />
        <div className="brand-text">
          <span className="brand-title">Семья Чебаковых</span>
          <span className="brand-subtitle">Семейное древо</span>
        </div>
      </div>

      <nav className="header-nav">
        <Link href="/" className={getLinkClass('/')}>
          <TreePine size={18} />
          <span>Древо</span>
        </Link>
        <Link href="/timeline" className={getLinkClass('/timeline')}>
          <Clock size={18} />
          <span>Хронология</span>
        </Link>
        <Link href="/map" className={getLinkClass('/map')}>
          <Map size={18} />
          <span>Карта</span>
        </Link>
      </nav>

      <div className="header-actions">
        <Link href="/admin" className="admin-link" title="Администрирование">
          <Settings size={20} />
        </Link>
      </div>
    </header>
  );
}
