import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const inspirations: any[] = Array.isArray(data) ? data : data.inspirations || [];

    const publicFolder = path.join(process.cwd(), 'public');
    const filePath = path.join(publicFolder, 'inspirations.json');

    await fs.mkdir(publicFolder, { recursive: true });

    let shouldSave = false;

    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      const parsed = existing.trim() ? JSON.parse(existing) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        shouldSave = true;
      }
    } catch {
      shouldSave = true;
    }

    if (shouldSave) {
      await fs.writeFile(filePath, JSON.stringify(inspirations, null, 2), 'utf-8');
      return NextResponse.json({ message: 'Default inspirations saved successfully' });
    }

    return NextResponse.json({ message: 'Inspirations file already has data. Skipped saving.' });
  } catch (err: any) {
    console.error('Error saving inspirations:', err);
    return NextResponse.json(
      { message: 'Failed to save default inspirations', error: err.message },
      { status: 500 },
    );
  }
}
