import { connectDB } from '@/lib/dbConnect';
import { ICategory } from '@/models/category';
import Inspiration, { IInspiration } from '@/models/Inspiration';
import { NextResponse } from 'next/server';

type PopulatedInspiration = Omit<IInspiration, 'categories'> & {
  categories: ICategory[];
};

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();

    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const inspiration = await Inspiration.findOne({ slug })
      .populate({
        path: 'categories',
        select: '_id name slug mainImage',
        model: 'Category',
      })
      .lean<PopulatedInspiration>();

    if (!inspiration) {
      return NextResponse.json({ error: 'Inspiration not found' }, { status: 404 });
    }

    const transformed: PopulatedInspiration & { imageUrl: string } = {
      ...inspiration,
      categories: inspiration.categories ?? [],
      imageUrl: inspiration.heroImage?.url || '',
    };

    return NextResponse.json(transformed, { status: 200 });
  } catch (err) {
    console.error('GET Inspiration error:', err);
    return NextResponse.json({ error: 'Failed to fetch inspiration' }, { status: 500 });
  }
}
