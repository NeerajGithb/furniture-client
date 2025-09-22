import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; alt: string; publicId: string };
  createdAt: string;
  updatedAt: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const categories: Category[] = await req.json();
    if (!Array.isArray(categories)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'categories.json');
    let shouldSave = false;

    try {
      const existingData = await fs.readFile(filePath, 'utf-8');
      const parsed = existingData.trim() ? JSON.parse(existingData) : [];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        shouldSave = true;
      }
    } catch {
      shouldSave = true;
    }

    if (shouldSave) {
      await fs.writeFile(filePath, JSON.stringify(categories, null, 2), 'utf-8');
      return NextResponse.json({ message: 'Categories saved successfully' });
    }

    return NextResponse.json({ message: 'File already has categories. Skipped saving.' });
  } catch (error: any) {
    console.error('Error saving categories:', error);
    return NextResponse.json(
      { message: 'Failed to save categories', error: error.message },
      { status: 500 },
    );
  }
}
