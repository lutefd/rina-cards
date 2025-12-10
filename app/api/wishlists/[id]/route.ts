import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems, user } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Promise or direct params
    const id = params instanceof Promise ? (await params).id : params.id;

    // Get the wishlist
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, id))
      .limit(1);

    if (!wishlist) {
      return NextResponse.json(
        { message: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Check if the wishlist is public or if the user is the owner
    if (!wishlist.isPublic) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session || session.user.id !== wishlist.userId) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Get the wishlist items
    const items = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.wishlistId, id))
      .orderBy(desc(wishlistItems.createdAt));

    // Get the wishlist owner
    const [owner] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, wishlist.userId))
      .limit(1);

    // Return the wishlist with items and owner
    return NextResponse.json({
      ...wishlist,
      items,
      owner,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { message: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Promise or direct params
    const id = params instanceof Promise ? (await params).id : params.id;

    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the wishlist
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, id))
      .limit(1);

    if (!wishlist) {
      return NextResponse.json(
        { message: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Check if the user is the owner
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, isPublic } = body;

    // Update the wishlist
    const [updatedWishlist] = await db
      .update(wishlists)
      .set({
        title: title !== undefined ? title : wishlist.title,
        description: description !== undefined ? description : wishlist.description,
        isPublic: isPublic !== undefined ? isPublic : wishlist.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(wishlists.id, id))
      .returning();

    return NextResponse.json(updatedWishlist);
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json(
      { message: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Promise or direct params
    const id = params instanceof Promise ? (await params).id : params.id;

    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the wishlist
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, id))
      .limit(1);

    if (!wishlist) {
      return NextResponse.json(
        { message: "Wishlist not found" },
        { status: 404 }
      );
    }

    // Check if the user is the owner
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete all wishlist items first
    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.wishlistId, id));

    // Delete the wishlist
    await db
      .delete(wishlists)
      .where(eq(wishlists.id, id));

    return NextResponse.json({ message: "Wishlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    return NextResponse.json(
      { message: "Failed to delete wishlist" },
      { status: 500 }
    );
  }
}
