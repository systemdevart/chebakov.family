import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { checkBasicAuth } from '../auth';

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

// Sync bidirectional relationships for new member
function syncNewMemberRelationships(data: FamilyData, newMember: FamilyMember) {
  const memberMap = new Map(data.members.map(m => [m.id, m]));

  // Add to spouses' spouseIds
  (newMember.spouseIds || []).forEach(spouseId => {
    const spouse = memberMap.get(spouseId);
    if (spouse) {
      spouse.spouseIds = spouse.spouseIds || [];
      if (!spouse.spouseIds.includes(newMember.id)) {
        spouse.spouseIds.push(newMember.id);
      }
    }
  });

  // Add to parents' childrenIds
  (newMember.parentIds || []).forEach(parentId => {
    const parent = memberMap.get(parentId);
    if (parent) {
      parent.childrenIds = parent.childrenIds || [];
      if (!parent.childrenIds.includes(newMember.id)) {
        parent.childrenIds.push(newMember.id);
      }
    }
  });

  // Add to children's parentIds
  (newMember.childrenIds || []).forEach(childId => {
    const child = memberMap.get(childId);
    if (child) {
      child.parentIds = child.parentIds || [];
      if (!child.parentIds.includes(newMember.id)) {
        child.parentIds.push(newMember.id);
      }
    }
  });
}

// POST /api/members - Add new member (protected)
export async function POST(request: NextRequest) {
  const authError = checkBasicAuth(request);
  if (authError) return authError;

  try {
    const data = readData();
    const newMember = await request.json();
    data.members.push(newMember);
    syncNewMemberRelationships(data, newMember);
    writeData(data);
    return NextResponse.json(newMember);
  } catch {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
