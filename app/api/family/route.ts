import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'familyData.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!existsSync(DATA_FILE)) {
  const initialData = {
    rootPersonId: '',
    members: [],
    relationships: []
  };
  writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

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

// GET /api/family - Get all family data
export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

// PUT /api/family - Save all family data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    writeData(body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
