import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // ✅ New JSON-based upload logic (base64 image)
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      const { image, folder } = body;

      if (!image || !folder) {
        return NextResponse.json({ error: 'Missing image or folder' }, { status: 400 });
      }

      const result = await cloudinary.uploader.upload(image, {
        folder,
      });

      return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
    }

    // ✅ Old form-data upload logic (File)
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'furniture-store' },
          (error: unknown, result: { secure_url: string; public_id: string } | undefined) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    const uploadResult = result as { secure_url: string; public_id: string };

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// This code handles file uploads to Cloudinary, supporting both JSON-based uploads with base64 images
