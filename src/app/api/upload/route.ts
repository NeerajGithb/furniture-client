// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs'; // ensure Node runtime

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // Handle FormData uploads (files from browser)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        console.warn('No file provided in FormData');
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Convert Blob/File to Node Buffer
      const arrayBuffer = await (file as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Optional folder from FormData
      const folder = (formData.get('folder') as string) || 'furniture-store';

      // Upload to Cloudinary
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder }, (error, result) => {
              if (error) {
                console.error('Cloudinary upload_stream error:', error);
                reject(error);
              } else if (!result) {
                console.error('Cloudinary upload_stream returned no result');
                reject(new Error('No result from Cloudinary'));
              } else {
                resolve(result as { secure_url: string; public_id: string });
              }
            })
            .end(buffer);
        },
      );

      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // Optional: handle base64 JSON uploads
    if (contentType?.includes('application/json')) {
      const body = await request.json().catch((err) => {
        console.error('JSON parse error:', err);
        throw new Error('Invalid JSON body');
      });

      const { image, folder } = body || {};
      if (!image || !folder) {
        return NextResponse.json({ error: 'Missing image or folder in JSON' }, { status: 400 });
      }

      const result = await cloudinary.uploader.upload(image, { folder });

      return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
    }

    console.warn('Unsupported Content-Type:', contentType);
    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (error) {
    console.error('Unhandled error in /api/upload:', error);
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
