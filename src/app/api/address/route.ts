import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import Address from '@/models/Address';
import { connectDB } from '@/lib/dbConnect';

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    await connectDB();

    const addresses = await Address.find({ userId: user.userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return NextResponse.json({
      addresses: addresses.map((addr) => ({
        _id: addr._id,
        type: addr.type,
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt,
      })),
    });
  } catch (error) {
    console.error('Address GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const body = await request.json();
    const {
      type,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !postalCode?.trim()
    ) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const pinCodeRegex = /^[0-9]{6}$/;
    if (!pinCodeRegex.test(postalCode.trim())) {
      return NextResponse.json({ error: 'Invalid postal code format' }, { status: 400 });
    }

    await connectDB();

    const existingAddressCount = await Address.countDocuments({
      userId: user.userId,
    });

    const shouldBeDefault = existingAddressCount === 0 || isDefault;

    if (shouldBeDefault) {
      await Address.updateMany({ userId: user.userId }, { isDefault: false });
    }

    const newAddress = new Address({
      userId: user.userId,
      type: type || 'home',
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim() || '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country || 'India',
      isDefault: shouldBeDefault,
    });

    await newAddress.save();

    return NextResponse.json({
      message: 'Address added successfully',
      address: {
        _id: newAddress._id,
        type: newAddress.type,
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        city: newAddress.city,
        state: newAddress.state,
        postalCode: newAddress.postalCode,
        country: newAddress.country,
        isDefault: newAddress.isDefault,
      },
    });
  } catch (error) {
    console.error('Address POST error:', error);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
});
