import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'data', 'familyData.json');

function readData() {
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { rootPersonId: '', members: [], relationships: [] };
  }
}

function writeData(data: unknown) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/members - Add new member
export async function POST(request: NextRequest) {
  try {
    const data = readData();
    const newMember = await request.json();
    data.members.push(newMember);
    writeData(data);
    return NextResponse.json(newMember);
  } catch {
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
