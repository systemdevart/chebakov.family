'use client';

import { create } from 'zustand';
import type { FamilyMember, FamilyData } from '@/types/family';

function getAuthHeader(): string {
  const username = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'chebakov';
  const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'family2024';
  return 'Basic ' + btoa(`${username}:${password}`);
}

interface FamilyStore {
  data: FamilyData;
  selectedMemberId: string | null;
  highlightedIds: Set<string>;
  isDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedMember: (id: string | null) => void;
  setHighlightedIds: (ids: Set<string>) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // API operations
  fetchData: () => Promise<void>;
  addMember: (member: FamilyMember) => Promise<void>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  uploadPhoto: (file: File) => Promise<string>;
  setData: (data: FamilyData) => Promise<void>;

  // Helpers
  getMemberById: (id: string) => FamilyMember | undefined;
  getParents: (memberId: string) => FamilyMember[];
  getChildren: (memberId: string) => FamilyMember[];
  getSpouses: (memberId: string) => FamilyMember[];
  getSiblings: (memberId: string) => FamilyMember[];
}

const emptyData: FamilyData = {
  rootPersonId: '',
  members: [],
  relationships: [],
};

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  data: emptyData,
  selectedMemberId: null,
  highlightedIds: new Set<string>(),
  isDrawerOpen: false,
  isLoading: false,
  error: null,

  setSelectedMember: (id) => {
    set({ selectedMemberId: id });
    // Calculate highlighted subtree
    if (id) {
      const highlighted = new Set<string>();
      const member = get().getMemberById(id);
      if (member) {
        highlighted.add(id);
        // Add spouses
        member.spouseIds.forEach((sId) => highlighted.add(sId));
        // Add descendants recursively
        const addDescendants = (mId: string) => {
          const m = get().getMemberById(mId);
          if (m) {
            m.childrenIds.forEach((cId) => {
              highlighted.add(cId);
              addDescendants(cId);
            });
          }
        };
        addDescendants(id);
      }
      set({ highlightedIds: highlighted });
    } else {
      set({ highlightedIds: new Set() });
    }
  },
  setHighlightedIds: (ids) => set({ highlightedIds: ids }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedMemberId: null, highlightedIds: new Set() }),

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/family');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      set({ data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMember: async (member) => {
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to add member');
      await get().fetchData();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateMember: async (id, updates) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update member');
      await get().fetchData();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteMember: async (id) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      if (!response.ok) throw new Error('Failed to delete member');
      await get().fetchData();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload photo');
    const { photoUrl } = await response.json();
    return photoUrl;
  },

  setData: async (data) => {
    try {
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save data');
      await get().fetchData();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getMemberById: (id) => get().data.members.find((m) => m.id === id),

  getParents: (memberId) => {
    const member = get().getMemberById(memberId);
    if (!member) return [];
    return member.parentIds
      .map((id) => get().getMemberById(id))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  getChildren: (memberId) => {
    const member = get().getMemberById(memberId);
    if (!member) return [];
    return member.childrenIds
      .map((id) => get().getMemberById(id))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  getSpouses: (memberId) => {
    const member = get().getMemberById(memberId);
    if (!member) return [];
    return member.spouseIds
      .map((id) => get().getMemberById(id))
      .filter((m): m is FamilyMember => m !== undefined);
  },

  getSiblings: (memberId) => {
    const member = get().getMemberById(memberId);
    if (!member) return [];
    const parentIds = member.parentIds;
    return get().data.members.filter(
      (m) =>
        m.id !== memberId &&
        m.parentIds.some((pId) => parentIds.includes(pId))
    );
  },
}));
