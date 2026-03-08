'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  User,
  Users,
  Search,
  Save,
  X,
  Upload,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { getFullName, getYearsRange, generateId } from '@/utils/helpers';
import type { FamilyMember } from '@/types/family';
import './AdminDashboard.css';

type EditMode = 'create' | 'edit' | null;

const emptyMember: Omit<FamilyMember, 'id'> = {
  firstName: '',
  lastName: '',
  patronymic: '',
  birthDate: '',
  deathDate: '',
  birthPlace: '',
  currentLocation: '',
  bio: '',
  photoUrl: '',
  gender: 'male',
  parentIds: [],
  spouseIds: [],
  childrenIds: [],
  events: [],
};

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { data, addMember, updateMember, deleteMember, uploadPhoto } = useFamilyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [currentMember, setCurrentMember] = useState<Partial<FamilyMember>>(emptyMember);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredMembers = data.members
    .filter((member) => {
      const fullName = getFullName(member).toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (!a.birthDate && !b.birthDate) return 0;
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
    });

  const handleLogout = () => {
    logout();
    router.push('/admin');
  };

  const handleExport = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'familyData.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreate = () => {
    setEditMode('create');
    setCurrentMember(emptyMember);
    setEditingId(null);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditMode('edit');
    setCurrentMember({ ...member });
    setEditingId(member.id);
  };

  const handleCancel = () => {
    setEditMode(null);
    setCurrentMember(emptyMember);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!currentMember.firstName || !currentMember.lastName) {
      alert('Пожалуйста, заполните имя и фамилию');
      return;
    }

    if (editMode === 'create') {
      const newMember: FamilyMember = {
        ...(currentMember as Omit<FamilyMember, 'id'>),
        id: generateId(`${currentMember.firstName} ${currentMember.lastName}`),
      };
      addMember(newMember);
    } else if (editMode === 'edit' && editingId) {
      updateMember(editingId, currentMember);
    }

    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого члена семьи?')) {
      deleteMember(id);
    }
  };

  const handleInputChange = (field: keyof FamilyMember, value: string | string[]) => {
    setCurrentMember((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const photoUrl = await uploadPhoto(file);
        handleInputChange('photoUrl', photoUrl);
      } catch {
        alert('Ошибка при загрузке фото');
      }
    }
  };

  const handleRelationshipChange = (
    field: 'parentIds' | 'spouseIds' | 'childrenIds',
    selectedIds: string[]
  ) => {
    handleInputChange(field, selectedIds);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-left">
          <Users size={24} />
          <h1>Управление семейным древом</h1>
        </div>
        <div className="header-actions">
          <button className="action-header-btn" onClick={handleExport} title="Экспорт данных">
            <Download size={18} />
            Экспорт
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="members-panel">
          <div className="panel-header">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={handleCreate}>
              <Plus size={18} />
              Добавить
            </button>
          </div>

          <div className="members-list">
            {filteredMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-avatar">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt="" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name">{getFullName(member)}</div>
                  <div className="member-years">{getYearsRange(member)}</div>
                </div>
                <div className="member-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(member)}
                    title="Редактировать"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(member.id)}
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div className="no-results">Члены семьи не найдены</div>
            )}
          </div>
        </div>

        {editMode && (
          <div className="edit-panel">
            <div className="panel-title">
              <h2>{editMode === 'create' ? 'Новый член семьи' : 'Редактирование'}</h2>
              <button className="close-btn" onClick={handleCancel}>
                <X size={20} />
              </button>
            </div>

            <div className="edit-form">
              <div className="photo-upload">
                <div className="photo-preview">
                  {currentMember.photoUrl ? (
                    <img src={currentMember.photoUrl} alt="" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <label className="upload-btn">
                  <Upload size={16} />
                  Загрузить фото
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    hidden
                  />
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Фамилия *</label>
                  <input
                    type="text"
                    value={currentMember.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Чебаков"
                  />
                </div>
                <div className="form-group">
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={currentMember.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Иван"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Отчество</label>
                  <input
                    type="text"
                    value={currentMember.patronymic || ''}
                    onChange={(e) => handleInputChange('patronymic', e.target.value)}
                    placeholder="Алексеевич"
                  />
                </div>
                <div className="form-group">
                  <label>Пол</label>
                  <select
                    value={currentMember.gender || 'male'}
                    onChange={(e) =>
                      handleInputChange('gender', e.target.value as 'male' | 'female')
                    }
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Дата рождения</label>
                  <input
                    type="date"
                    value={currentMember.birthDate || ''}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Дата смерти</label>
                  <input
                    type="date"
                    value={currentMember.deathDate || ''}
                    onChange={(e) => handleInputChange('deathDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Место рождения</label>
                  <input
                    type="text"
                    value={currentMember.birthPlace || ''}
                    onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                    placeholder="Москва, Россия"
                  />
                </div>
                <div className="form-group">
                  <label>Текущее место жительства</label>
                  <input
                    type="text"
                    value={currentMember.currentLocation || ''}
                    onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                    placeholder="Санкт-Петербург, Россия"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Биография</label>
                <textarea
                  value={currentMember.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Краткая биография..."
                  rows={4}
                />
              </div>

              <div className="relationships-section">
                <h3>Родственные связи</h3>

                <div className="form-group">
                  <label>Родители</label>
                  <div className="checkbox-list">
                    {data.members
                      .filter((m) => m.id !== editingId)
                      .sort((a, b) => {
                        if (!a.birthDate && !b.birthDate) return 0;
                        if (!a.birthDate) return 1;
                        if (!b.birthDate) return -1;
                        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
                      })
                      .map((m) => (
                        <label key={m.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={(currentMember.parentIds || []).includes(m.id)}
                            onChange={(e) => {
                              const current = currentMember.parentIds || [];
                              if (e.target.checked) {
                                handleRelationshipChange('parentIds', [...current, m.id]);
                              } else {
                                handleRelationshipChange('parentIds', current.filter(id => id !== m.id));
                              }
                            }}
                          />
                          <span>{getFullName(m)}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Супруг(а)</label>
                  <div className="checkbox-list">
                    {data.members
                      .filter((m) => m.id !== editingId)
                      .sort((a, b) => {
                        if (!a.birthDate && !b.birthDate) return 0;
                        if (!a.birthDate) return 1;
                        if (!b.birthDate) return -1;
                        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
                      })
                      .map((m) => (
                        <label key={m.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={(currentMember.spouseIds || []).includes(m.id)}
                            onChange={(e) => {
                              const current = currentMember.spouseIds || [];
                              if (e.target.checked) {
                                handleRelationshipChange('spouseIds', [...current, m.id]);
                              } else {
                                handleRelationshipChange('spouseIds', current.filter(id => id !== m.id));
                              }
                            }}
                          />
                          <span>{getFullName(m)}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Дети</label>
                  <div className="checkbox-list">
                    {data.members
                      .filter((m) => m.id !== editingId)
                      .sort((a, b) => {
                        if (!a.birthDate && !b.birthDate) return 0;
                        if (!a.birthDate) return 1;
                        if (!b.birthDate) return -1;
                        return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
                      })
                      .map((m) => (
                        <label key={m.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={(currentMember.childrenIds || []).includes(m.id)}
                            onChange={(e) => {
                              const current = currentMember.childrenIds || [];
                              if (e.target.checked) {
                                handleRelationshipChange('childrenIds', [...current, m.id]);
                              } else {
                                handleRelationshipChange('childrenIds', current.filter(id => id !== m.id));
                              }
                            }}
                          />
                          <span>{getFullName(m)}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button className="cancel-btn" onClick={handleCancel}>
                  Отмена
                </button>
                <button className="save-btn" onClick={handleSave}>
                  <Save size={18} />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
