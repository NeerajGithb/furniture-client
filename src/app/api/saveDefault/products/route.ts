// app/api/saveDefault/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    let products: any[] = Array.isArray(data) ? data : data.products || [];

    const publicFolder = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder, { recursive: true });

    const filePath = path.join(publicFolder, 'products.json');

    // Only write if file does not exist or is empty
    let writeFile = false;
    if (!fs.existsSync(filePath)) {
      writeFile = true;
    } else {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      if (!fileData || fileData.trim() === '[]') writeFile = true;
    }

    if (writeFile) {
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    }

    return NextResponse.json({ message: 'Default products saved if empty' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Failed to save default products', error: err },
      { status: 500 },
    );
  }
}
