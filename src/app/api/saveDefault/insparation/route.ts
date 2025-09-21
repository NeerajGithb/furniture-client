// app/api/saveDefaultInspirations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    let inspirations: any[] = Array.isArray(data) ? data : data.inspirations || [];

    const publicFolder = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder, { recursive: true });

    const filePath = path.join(publicFolder, 'inspirations.json');

    // Only write if file does not exist or is empty
    let writeFile = false;
    if (!fs.existsSync(filePath)) {
      writeFile = true;
    } else {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      if (!fileData || fileData.trim() === '[]') writeFile = true;
    }

    if (writeFile) {
      fs.writeFileSync(filePath, JSON.stringify(inspirations, null, 2), 'utf-8');
    }

    return NextResponse.json({ message: 'Default inspirations saved if empty' });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Failed to save default inspirations', error: err },
      { status: 500 },
    );
  }
}
