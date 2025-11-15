import { NextRequest, NextResponse } from 'next/server';
import { parseUserIntent, generateResponse } from '@/lib/chat/ai-service';
import { connectDB } from '@/lib/dbConnect';
import Product from '@/models/product';
import Category from '@/models/category';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    await connectDB();

    const intent = await parseUserIntent(message, history || []);
    console.log('Intent:', intent);
    
    let response = intent.response || '';
    let products: any = [];

    if (intent.action === 'stats') {
      if (intent.query === 'products') {
        const total = await Product.countDocuments({ isPublished: { $ne: false } });
        response = `We have ${total} products available!`;
      } 
      else if (intent.query === 'categories') {
        const cats = await Category.find({}, { name: 1, _id: 0 }).lean();
        response = `We have ${cats.length} categories: ${cats.map((c: any) => c.name).join(', ')}`;
      } 
      else if (intent.query === 'category_count' && intent.category) {
        const categoryDoc = await Category.findOne({ slug: intent.category }).lean();
        
        if (!categoryDoc || !('_id' in categoryDoc)) {
          response = `We don't have a category called ${intent.category}`;
        } else {
          const count = await Product.countDocuments({ 
            categoryId: categoryDoc._id,
            isPublished: { $ne: false }
          });
          
          const categoryName = 'name' in categoryDoc ? categoryDoc.name : intent.category;
          response = count > 0 
            ? `We have ${count} ${categoryName.toLowerCase()}${count !== 1 ? 's' : ''} available!`
            : `Sorry, we don't have any ${categoryName.toLowerCase()}s in stock right now.`;
        }
      } 
      else if (intent.query === 'subcategories') {
        const subs = await Product.distinct('subcategorySlug', { 
          subcategorySlug: { $ne: null },
          isPublished: { $ne: false }
        });
        response = `We have ${subs.length} subcategories available`;
      } 
      else if (intent.query === 'brands') {
        const brands = await Product.distinct('brand', { 
          brand: { $nin: [null, ''] },
          isPublished: { $ne: false }
        });
        response = brands.length > 0
          ? `We carry these brands: ${brands.slice(0, 10).join(', ')}${brands.length > 10 ? '...' : ''}`
          : 'Brand information not available';
      } 
      else if (intent.query === 'materials') {
        const materials = await Product.distinct('material', { 
          material: { $nin: [null, ''] },
          isPublished: { $ne: false }
        });
        response = materials.length > 0
          ? `Available materials: ${materials.slice(0, 10).join(', ')}${materials.length > 10 ? '...' : ''}`
          : 'Material information not available';
      } 
      else if (intent.query === 'product_list') {
        const prods = await Product.find(
          { isPublished: { $ne: false } }, 
          { name: 1, _id: 0 }
        ).limit(10).lean();
        response = prods.length > 0
          ? `Here are some products: ${prods.map((p: any) => p.name).join(', ')}...`
          : 'No products available';
      } 
      else {
        response = 'What would you like to know?';
      }

      return NextResponse.json({
        response,
        intent,
        products: []
      });
    }

    if (intent.action === 'filter' || intent.action === 'search' || intent.action === 'navigate') {
      const query: any = { isPublished: { $ne: false } };

      if (intent.category) {
        const categoryDoc = await Category.findOne({ slug: intent.category }).lean();
        if (categoryDoc && '_id' in categoryDoc) {
          query.categoryId = categoryDoc._id;
        }
      }

      if (intent.filters?.price_min) {
        query.finalPrice = query.finalPrice || {};
        query.finalPrice.$gte = intent.filters.price_min;
      }
      if (intent.filters?.price_max) {
        query.finalPrice = query.finalPrice || {};
        query.finalPrice.$lte = intent.filters.price_max;
      }
      if (intent.filters?.material) {
        query.material = { $regex: intent.filters.material, $options: 'i' };
      }
      if (intent.filters?.color) {
        query.color = { $regex: intent.filters.color, $options: 'i' };
      }
      if (intent.filters?.brand) {
        query.brand = { $regex: intent.filters.brand, $options: 'i' };
      }
      if (intent.filters?.inStock) {
        query.inStockQuantity = { $gt: 0 };
      }
      if (intent.filters?.onSale) {
        query.discountPercent = { $gt: 0 };
      }
      if (intent.query) {
        query.$text = { $search: intent.query };
      }

      products = await Product.find(query)
        .populate('categoryId', 'name slug')
        .limit(10)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (products.length > 0) {
        response = response || `Found ${products.length} product${products.length !== 1 ? 's' : ''}`;
      } else {
        response = "No products match your criteria. Try different filters.";
      }
    } 
    else if (intent.action === 'info' && !response) {
      response = await generateResponse(message, history || []);
    }

    return NextResponse.json({
      response,
      intent,
      products: products.slice(0, 5)
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        response: 'Something went wrong. Please try again.'
      },
      { status: 500 }
    );
  }
}