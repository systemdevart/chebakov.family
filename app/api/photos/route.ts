import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';

const PHOTOS_DIR = join(process.cwd(), 'public', 'photos');

// Ensure photos directory exists
if (!existsSync(PHOTOS_DIR)) {
  mkdirSync(PHOTOS_DIR, { recursive: true });
}

// POST /api/photos - Upload photo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.name.split('.').pop();
    const filename = `${uniqueSuffix}.${ext}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(PHOTOS_DIR, filename);
    writeFileSync(filePath, buffer);
    chmodSync(filePath, 0o644);

    const photoUrl = `/photos/${filename}`;
    return NextResponse.json({ photoUrl });
  } catch {
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
