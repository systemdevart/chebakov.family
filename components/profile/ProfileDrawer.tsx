'use client';

import { useState } from 'react';
import { X, User, MapPin, Calendar, Users, FileText, Image } from 'lucide-react';
import { useFamilyStore } from '@/store/familyStore';
import { getFullName, formatDate, calculateAge, getShortName } from '@/utils/helpers';
import './ProfileDrawer.css';

type TabType = 'bio' | 'family' | 'media';

export default function ProfileDrawer() {
  const [activeTab, setActiveTab] = useState<TabType>('bio');
  const { selectedMemberId, isDrawerOpen, closeDrawer, getMemberById, getParents, getChildren, getSpouses, getSiblings, setSelectedMember } = useFamilyStore();

  const member = selectedMemberId ? getMemberById(selectedMemberId) : null;

  if (!isDrawerOpen || !member) return null;

  const parents = getParents(member.id);
  const children = getChildren(member.id);
  const spouses = getSpouses(member.id);
  const siblings = getSiblings(member.id);
  const age = calculateAge(member.birthDate, member.deathDate);

  const handleMemberClick = (id: string) => {
    setSelectedMember(id);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={closeDrawer} />
      <div className="profile-drawer">
        <div className="drawer-header">
          <button className="close-button" onClick={closeDrawer}>
            <X size={24} />
          </button>
        </div>

        <div className="profile-hero">
          <div className="profile-avatar">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={getShortName(member)} />
            ) : (
              <User size={48} />
            )}
          </div>
          <h2 className="profile-name">{getFullName(member)}</h2>
          <div className="profile-meta">
            {member.birthDate && (
              <span className="meta-item">
                <Calendar size={14} />
                {formatDate(member.birthDate)}
                {member.deathDate && ` — ${formatDate(member.deathDate)}`}
              </span>
            )}
            {age !== null && (
              <span className="meta-item age">
                {member.deathDate ? `Прожил${member.gender === 'female' ? 'а' : ''} ${age} лет` : `${age} лет`}
              </span>
            )}
          </div>
          {member.birthPlace && (
            <div className="profile-location">
              <MapPin size={14} />
              <span>{member.birthPlace}</span>
            </div>
          )}
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'bio' ? 'active' : ''}`}
            onClick={() => setActiveTab('bio')}
          >
            <FileText size={16} />
            Биография
          </button>
          <button
            className={`tab ${activeTab === 'family' ? 'active' : ''}`}
            onClick={() => setActiveTab('family')}
          >
            <Users size={16} />
            Семья
          </button>
          <button
            className={`tab ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <Image size={16} />
            Медиа
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'bio' && (
            <div className="bio-tab">
              {member.bio ? (
                <p className="bio-text">{member.bio}</p>
              ) : (
                <p className="no-content">Биография пока не добавлена</p>
              )}

              {member.events && member.events.length > 0 && (
                <div className="life-events">
                  <h3>Важные события</h3>
                  {member.events.map((event) => (
                    <div key={event.id} className="event-item">
                      <div className="event-date">{formatDate(event.date)}</div>
                      <div className="event-title">{event.title}</div>
                      {event.description && (
                        <div className="event-desc">{event.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'family' && (
            <div className="family-tab">
              {parents.length > 0 && (
                <div className="family-section">
                  <h3>Родители</h3>
                  <div className="family-list">
                    {parents.map((p) => (
                      <button
                        key={p.id}
                        className="family-link"
                        onClick={() => handleMemberClick(p.id)}
                      >
                        <User size={16} />
                        {getShortName(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {spouses.length > 0 && (
                <div className="family-section">
                  <h3>Супруг(а)</h3>
                  <div className="family-list">
                    {spouses.map((s) => (
                      <button
                        key={s.id}
                        className="family-link"
                        onClick={() => handleMemberClick(s.id)}
                      >
                        <User size={16} />
                        {getShortName(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {siblings.length > 0 && (
                <div className="family-section">
                  <h3>Братья и сёстры</h3>
                  <div className="family-list">
                    {siblings.map((s) => (
                      <button
                        key={s.id}
                        className="family-link"
                        onClick={() => handleMemberClick(s.id)}
                      >
                        <User size={16} />
                        {getShortName(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div className="family-section">
                  <h3>Дети</h3>
                  <div className="family-list">
                    {children.map((c) => (
                      <button
                        key={c.id}
                        className="family-link"
                        onClick={() => handleMemberClick(c.id)}
                      >
                        <User size={16} />
                        {getShortName(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {parents.length === 0 && spouses.length === 0 && children.length === 0 && siblings.length === 0 && (
                <p className="no-content">Информация о семье не добавлена</p>
              )}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="media-tab">
              <p className="no-content">Медиа файлы пока не добавлены</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
