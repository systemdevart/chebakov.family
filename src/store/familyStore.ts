import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyMember, FamilyData } from '../types/family';
import initialData from '../data/familyData.json';

interface FamilyStore {
  data: FamilyData;
  selectedMemberId: string | null;
  isDrawerOpen: boolean;

  // Actions
  setSelectedMember: (id: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // CRUD operations
  addMember: (member: FamilyMember) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;

  // Data management
  setData: (data: FamilyData) => void;
  getMemberById: (id: string) => FamilyMember | undefined;
  getParents: (memberId: string) => FamilyMember[];
  getChildren: (memberId: string) => FamilyMember[];
  getSpouses: (memberId: string) => FamilyMember[];
  getSiblings: (memberId: string) => FamilyMember[];
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      data: initialData as FamilyData,
      selectedMemberId: null,
      isDrawerOpen: false,

      setSelectedMember: (id) => set({ selectedMemberId: id }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addMember: (member) =>
        set((state) => ({
          data: {
            ...state.data,
            members: [...state.data.members, member],
          },
        })),

      updateMember: (id, updates) =>
        set((state) => ({
          data: {
            ...state.data,
            members: state.data.members.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          },
        })),

      deleteMember: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            members: state.data.members.filter((m) => m.id !== id),
            relationships: state.data.relationships.filter(
              (r) => r.person1Id !== id && r.person2Id !== id
            ),
          },
        })),

      setData: (data) => set({ data }),

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
    }),
    {
      name: 'chebakov-family-storage',
    }
  )
);
