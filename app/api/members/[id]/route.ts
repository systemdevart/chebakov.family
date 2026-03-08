import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { checkBasicAuth } from '../../auth';

const DATA_FILE = join(process.cwd(), 'data', 'familyData.json');

interface FamilyMember {
  id: string;
  parentIds?: string[];
  spouseIds?: string[];
  childrenIds?: string[];
  [key: string]: unknown;
}

interface FamilyData {
  rootPersonId: string;
  members: FamilyMember[];
  relationships: unknown[];
}

function readData(): FamilyData {
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { rootPersonId: '', members: [], relationships: [] };
  }
}

function writeData(data: FamilyData) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Sync bidirectional relationships
function syncRelationships(data: FamilyData, memberId: string, updates: Partial<FamilyMember>) {
  const memberMap = new Map(data.members.map(m => [m.id, m]));
  const member = memberMap.get(memberId);
  if (!member) return;

  // Sync spouse relationships
  if (updates.spouseIds !== undefined) {
    const oldSpouses = new Set(member.spouseIds || []);
    const newSpouses = new Set(updates.spouseIds || []);

    // Add this member to new spouses
    newSpouses.forEach(spouseId => {
      if (!oldSpouses.has(spouseId)) {
        const spouse = memberMap.get(spouseId);
        if (spouse) {
          spouse.spouseIds = spouse.spouseIds || [];
          if (!spouse.spouseIds.includes(memberId)) {
            spouse.spouseIds.push(memberId);
          }
        }
      }
    });

    // Remove this member from removed spouses
    oldSpouses.forEach(spouseId => {
      if (!newSpouses.has(spouseId)) {
        const spouse = memberMap.get(spouseId);
        if (spouse && spouse.spouseIds) {
          spouse.spouseIds = spouse.spouseIds.filter(id => id !== memberId);
        }
      }
    });
  }

  // Sync parent relationships (update parent's childrenIds)
  if (updates.parentIds !== undefined) {
    const oldParents = new Set(member.parentIds || []);
    const newParents = new Set(updates.parentIds || []);

    // Add this member to new parents' children
    newParents.forEach(parentId => {
      if (!oldParents.has(parentId)) {
        const parent = memberMap.get(parentId);
        if (parent) {
          parent.childrenIds = parent.childrenIds || [];
          if (!parent.childrenIds.includes(memberId)) {
            parent.childrenIds.push(memberId);
          }
        }
      }
    });

    // Remove this member from removed parents' children
    oldParents.forEach(parentId => {
      if (!newParents.has(parentId)) {
        const parent = memberMap.get(parentId);
        if (parent && parent.childrenIds) {
          parent.childrenIds = parent.childrenIds.filter(id => id !== memberId);
        }
      }
    });
  }

  // Sync children relationships (update child's parentIds)
  if (updates.childrenIds !== undefined) {
    const oldChildren = new Set(member.childrenIds || []);
    const newChildren = new Set(updates.childrenIds || []);

    // Add this member to new children's parents
    newChildren.forEach(childId => {
      if (!oldChildren.has(childId)) {
        const child = memberMap.get(childId);
        if (child) {
          child.parentIds = child.parentIds || [];
          if (!child.parentIds.includes(memberId)) {
            child.parentIds.push(memberId);
          }
        }
      }
    });

    // Remove this member from removed children's parents
    oldChildren.forEach(childId => {
      if (!newChildren.has(childId)) {
        const child = memberMap.get(childId);
        if (child && child.parentIds) {
          child.parentIds = child.parentIds.filter(id => id !== memberId);
        }
      }
    });
  }
}

// GET /api/members/[id] - Get single member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = readData();
    const member = data.members.find((m) => m.id === id);
    if (member) {
      return NextResponse.json(member);
    } else {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// PUT /api/members/[id] - Update member (protected)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkBasicAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const data = readData();
    const index = data.members.findIndex((m) => m.id === id);
    if (index !== -1) {
      const updates = await request.json();
      // Sync bidirectional relationships before applying updates
      syncRelationships(data, id, updates);
      data.members[index] = { ...data.members[index], ...updates };
      writeData(data);
      return NextResponse.json(data.members[index]);
    } else {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/members/[id] - Delete member (protected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkBasicAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const data = readData();
    const index = data.members.findIndex((m) => m.id === id);
    if (index !== -1) {
      data.members.splice(index, 1);
      // Also remove from relationships
      data.members.forEach((m) => {
        m.parentIds = m.parentIds?.filter((pid) => pid !== id) || [];
        m.spouseIds = m.spouseIds?.filter((sid) => sid !== id) || [];
        m.childrenIds = m.childrenIds?.filter((cid) => cid !== id) || [];
      });
      writeData(data);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
