import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/dbConnect";

import SubCategory from '@/models/subcategory';
import Category from '@/models/category'; // Add this import

export async function GET() {
    try {
        await connectDB();
        const subcategories = await SubCategory.find().populate('categoryId', 'name slug');
        return NextResponse.json(subcategories);
    } catch (error) {
        const message =
            typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message: string }).message
                : 'An unexpected error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const { name, categoryId } = await request.json();

        const category = await Category.findById(categoryId);
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        const subcategory = new SubCategory({
            name,
            categoryId,
            slug: name.toLowerCase().replace(/\s+/g, '-')
        });
        await subcategory.save();

        return NextResponse.json(subcategory, { status: 201 });
    } catch (error) {
        const message =
            typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message: string }).message
                : 'An unexpected error occurred';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}