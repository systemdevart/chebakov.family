import { NavLink } from 'react-router-dom';
import { TreePine, Clock, Map, Settings } from 'lucide-react';
import './Header.css';

export default function Header() {
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
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <TreePine size={18} />
          <span>Древо</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Clock size={18} />
          <span>Хронология</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Map size={18} />
          <span>Карта</span>
        </NavLink>
      </nav>

      <div className="header-actions">
        <NavLink to="/admin" className="admin-link" title="Администрирование">
          <Settings size={20} />
        </NavLink>
      </div>
    </header>
  );
}
