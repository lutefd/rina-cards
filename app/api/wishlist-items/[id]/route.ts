import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Promise or direct params
    const id = params instanceof Promise ? (await params).id : params.id;

    // Get the wishlist item
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    // Get the wishlist to check permissions
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, item.wishlistId))
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

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching wishlist item:", error);
    return NextResponse.json(
      { message: "Failed to fetch wishlist item" },
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

    // Get the wishlist item
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    // Get the wishlist to check permissions
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, item.wishlistId))
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
    const { photocard, idol, group, album, version, imageUrl, priority, status } = body;

    // Update the wishlist item
    const [updatedItem] = await db
      .update(wishlistItems)
      .set({
        photocard: photocard !== undefined ? photocard : item.photocard,
        idol: idol !== undefined ? idol : item.idol,
        group: group !== undefined ? group : item.group,
        album: album !== undefined ? album : item.album,
        version: version !== undefined ? version : item.version,
        imageUrl: imageUrl !== undefined ? imageUrl : item.imageUrl,
        priority: priority !== undefined ? priority : item.priority,
        status: status !== undefined ? status : item.status,
        updatedAt: new Date(),
      })
      .where(eq(wishlistItems.id, id))
      .returning();

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating wishlist item:", error);
    return NextResponse.json(
      { message: "Failed to update wishlist item" },
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

    // Get the wishlist item
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { message: "Wishlist item not found" },
        { status: 404 }
      );
    }

    // Get the wishlist to check permissions
    const [wishlist] = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, item.wishlistId))
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

    // Delete the wishlist item
    await db
      .delete(wishlistItems)
      .where(eq(wishlistItems.id, id));

    return NextResponse.json({ message: "Wishlist item deleted successfully" });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    return NextResponse.json(
      { message: "Failed to delete wishlist item" },
      { status: 500 }
    );
  }
}
