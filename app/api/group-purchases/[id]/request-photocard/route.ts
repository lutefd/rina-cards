import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groupPurchases, groupPurchasePhotocards } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Handle Promise or direct params
    const id = params instanceof Promise ? (await params).id : params.id;
    const groupPurchaseId = id;

    // Check if the group purchase exists
    const [groupPurchase] = await db
      .select()
      .from(groupPurchases)
      .where(eq(groupPurchases.id, groupPurchaseId))
      .limit(1);

    if (!groupPurchase) {
      return NextResponse.json(
        { message: 'Group purchase not found' },
        { status: 404 }
      );
    }

    // Check if the group purchase is open for requests
    if (groupPurchase.status !== 'open') {
      return NextResponse.json(
        { message: 'This group purchase is not open for requests' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.photocard) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into database
    const [newRequest] = await db.insert(groupPurchasePhotocards)
      .values({
        groupPurchaseId,
        photocard: body.photocard,
        idol: body.idol,
        group: body.group,
        price: 0, // Price will be set by the seller if approved
        imageUrl: body.imageUrl,
        available: false, // Not available until approved
        quantity: 0, // Quantity will be set by the seller if approved
        requesterId: session.user.id,
        status: 'pending', // Pending approval from the seller
      })
      .returning();

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error requesting photocard:', error);
    return NextResponse.json(
      { message: 'Failed to request photocard' },
      { status: 500 }
    );
  }
}
