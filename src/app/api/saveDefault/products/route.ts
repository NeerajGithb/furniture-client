import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const products: any[] = Array.isArray(data) ? data : data.products || [];

    const publicFolder = path.join(process.cwd(), 'public');
    const filePath = path.join(publicFolder, 'products.json');

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
      await fs.writeFile(filePath, JSON.stringify(products, null, 2), 'utf-8');
      return NextResponse.json({ message: 'Products saved successfully' });
    }

    return NextResponse.json({ message: 'Products file already has data. Skipped saving.' });
  } catch (err: any) {
    console.error('Error saving products:', err);
    return NextResponse.json(
      { message: 'Failed to save default products', error: err.message },
      { status: 500 },
    );
  }
}
