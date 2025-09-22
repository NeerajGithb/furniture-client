import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/dbConnect';

export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    await connectDB();

    const userProfile = await User.findById(user.userId).select('-password -__v');

    if (!userProfile) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      id: userProfile._id,
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone || '',
      photoURL: userProfile.photoURL || '',
      createdAt: userProfile.createdAt,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    const { name, phone, photoURL } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^[+]?[1-9][\d\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid phone number' },
          { status: 400 },
        );
      }
    }

    await connectDB();

    const updateData: {
      name: string;
      phone: string;
      updatedAt: Date;
      photoURL?: string;
    } = {
      name: name.trim(),
      phone: phone?.trim() || '',
      updatedAt: new Date(),
    };

    if (photoURL) {
      updateData.photoURL = photoURL;
    }

    const updatedUser = await User.findByIdAndUpdate(user.userId, updateData, {
      new: true,
      select: '-password -__v',
    });

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      photoURL: updatedUser.photoURL || '',
      createdAt: updatedUser.createdAt,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});
