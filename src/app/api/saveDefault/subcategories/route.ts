import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string };
  description?: string;
  image?: { url: string; alt: string; publicId: string };
  createdAt: string;
  updatedAt: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const subcategories: Subcategory[] = await req.json();

    if (!Array.isArray(subcategories)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'subcategories.json');
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
      await fs.writeFile(filePath, JSON.stringify(subcategories, null, 2), 'utf-8');
      return NextResponse.json({ message: 'Subcategories saved successfully' });
    }

    return NextResponse.json({ message: 'Subcategories file already has data. Skipped saving.' });
  } catch (error: any) {
    console.error('Error saving subcategories:', error);
    return NextResponse.json(
      { message: 'Failed to save subcategories', error: error.message },
      { status: 500 },
    );
  }
}
