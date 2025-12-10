import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, groupPurchases } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';

export async function PUT(
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
    const orderId = id;

    // Get the order and its group purchase
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        groupPurchaseId: orders.groupPurchaseId,
        sellerId: groupPurchases.sellerId,
      })
      .from(orders)
      .innerJoin(
        groupPurchases,
        eq(orders.groupPurchaseId, groupPurchases.id)
      )
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { message: 'Missing status field' },
        { status: 400 }
      );
    }

    // Check if the user is authorized to update the status
    // Only the seller can update the status to anything
    // The buyer can only cancel their own order
    if (
      order.sellerId !== session.user.id && 
      !(order.userId === session.user.id && body.status === 'canceled')
    ) {
      return NextResponse.json(
        { message: 'You are not authorized to update this order status' },
        { status: 403 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'canceled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update the order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
