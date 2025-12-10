import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlists, wishlistItems, photocards } from "@/lib/db/schema";
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

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    return NextResponse.json(
      { message: "Failed to fetch wishlist items" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { 
      photocard, 
      idol, 
      group, 
      album, 
      version, 
      imageUrl, 
      priority = 0, 
      status = "desejado",
      notes,
      photocardsId 
    } = body;

    if (!photocard) {
      return NextResponse.json(
        { message: "Photocard name is required" },
        { status: 400 }
      );
    }
    
    let photocardId = photocardsId;
    
    // If no existing photocard ID is provided, check if a similar one exists or create a new one
    if (!photocardId) {
      // Check if a similar photocard exists in the database
      const existingPhotocards = await db
        .select()
        .from(photocards)
        .where(
          and(
            eq(photocards.title, photocard),
            idol ? eq(photocards.idol, idol) : undefined,
            group ? eq(photocards.group, group) : undefined
          )
        )
        .limit(1);
      
      if (existingPhotocards.length > 0) {
        // Use existing photocard
        photocardId = existingPhotocards[0].id;
      } else {
        // Create a new photocard in the catalog
        const [newPhotocard] = await db
          .insert(photocards)
          .values({
            title: photocard,
            idol: idol || null,
            group: group || null,
            album: album || null,
            version: version || null,
            imageUrl: imageUrl || null,
          })
          .returning();
          
        photocardId = newPhotocard.id;
      }
    }

    // Create wishlist item
    const [newItem] = await db
      .insert(wishlistItems)
      .values({
        wishlistId: id,
        photocard,
        idol: idol || null,
        group: group || null,
        album: album || null,
        version: version || null,
        imageUrl: imageUrl || null,
        priority,
        status,
        notes: notes || null,
        photocardsId: photocardId || null,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error adding wishlist item:", error);
    return NextResponse.json(
      { message: "Failed to add wishlist item" },
      { status: 500 }
    );
  }
}
