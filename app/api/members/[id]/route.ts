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
