import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groupPurchases, user } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const sellerId = url.searchParams.get('sellerId');
    
    // Build where conditions
    const whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(groupPurchases.status, status));
    }
    
    if (sellerId) {
      whereConditions.push(eq(groupPurchases.sellerId, sellerId));
    }
    
    // Build query
    const query = db.select({
      id: groupPurchases.id,
      sellerId: groupPurchases.sellerId,
      title: groupPurchases.title,
      description: groupPurchases.description,
      type: groupPurchases.type,
      marketplaceSource: groupPurchases.marketplaceSource,
      closingDate: groupPurchases.closingDate,
      additionalFee: groupPurchases.additionalFee,
      shippingInfo: groupPurchases.shippingInfo,
      status: groupPurchases.status,
      createdAt: groupPurchases.createdAt,
      updatedAt: groupPurchases.updatedAt,
      sellerName: user.name,
      sellerEmail: user.email,
    })
    .from(groupPurchases)
    .innerJoin(user, eq(groupPurchases.sellerId, user.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(groupPurchases.createdAt));
    
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching group purchases:', error);
    return NextResponse.json(
      { message: 'Failed to fetch group purchases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into database
    const [newGroupPurchase] = await db.insert(groupPurchases)
      .values({
        sellerId: session.user.id, // Use the authenticated user's ID
        title: body.title,
        description: body.description,
        type: body.type,
        marketplaceSource: body.marketplaceSource,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        additionalFee: body.additionalFee || 0,
        shippingInfo: body.shippingInfo,
        status: body.status || 'open',
      })
      .returning();

    return NextResponse.json(newGroupPurchase, { status: 201 });
  } catch (error) {
    console.error('Error creating group purchase:', error);
    return NextResponse.json(
      { message: 'Failed to create group purchase' },
      { status: 500 }
    );
  }
}
