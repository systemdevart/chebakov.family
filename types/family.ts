export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  currentLocation?: string;
  bio?: string;
  photoUrl?: string;
  gender: 'male' | 'female';
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
  events?: LifeEvent[];
}

export interface LifeEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  location?: string;
}

export interface Relationship {
  id: string;
  type: 'parent-child' | 'spouse';
  person1Id: string;
  person2Id: string;
}

export interface FamilyData {
  members: FamilyMember[];
  relationships: Relationship[];
  rootPersonId: string;
}
