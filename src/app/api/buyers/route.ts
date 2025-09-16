import { NextRequest, NextResponse } from 'next/server';
import { db, buyers, buyerHistory, users } from '@/lib/db';
import { createBuyerSchema } from '@/lib/validation/schemas';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

async function createBuyer(request: NextRequest) {
  try {
    console.log('Creating buyer...');
    
    // Try multiple authentication methods
    let user = await getCurrentUser();
    
    // If getCurrentUser fails, try Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const { data: { user: tokenUser }, error } = await supabaseAdmin?.auth.getUser(token);
          if (tokenUser && !error) {
            // Get or create user in our database
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, tokenUser.id))
              .limit(1);

            if (!dbUser) {
              // Create user in our database
              await db.insert(users).values({
                id: tokenUser.id,
                email: tokenUser.email!,
                fullName: tokenUser.user_metadata?.full_name || tokenUser.email!.split('@')[0],
              });
              
              // Return the newly created user
              const [newUser] = await db
                .select()
                .from(users)
                .where(eq(users.id, tokenUser.id))
                .limit(1);
              
              user = newUser;
            } else {
              user = dbUser;
            }
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = createBuyerSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Process tags if provided
    let tags: string[] | undefined = undefined;
    if (validatedData.tags !== undefined) {
      if (typeof validatedData.tags === 'string') {
        tags = (validatedData.tags as string).split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(validatedData.tags)) {
        tags = validatedData.tags;
      }
    }

    // Prepare buyer data for insertion
    const buyerData = {
      fullName: validatedData.fullName,
      email: validatedData.email || null,
      phone: validatedData.phone,
      city: validatedData.city,
      propertyType: validatedData.propertyType,
      bhk: validatedData.bhk || null,
      purpose: validatedData.purpose,
      budgetMin: validatedData.budgetMin || null,
      budgetMax: validatedData.budgetMax || null,
      timeline: validatedData.timeline,
      source: validatedData.source,
      status: validatedData.status,
      notes: validatedData.notes || null,
      tags: tags || null,
      ownerId: user.id,
    };

    console.log('Buyer data to insert:', buyerData);

    // Create buyer
    console.log('Inserting buyer into database...');
    const [newBuyer] = await db.insert(buyers).values(buyerData).returning();
    console.log('Buyer created:', newBuyer);

    // Create history entry
    console.log('Creating history entry...');
    await db.insert(buyerHistory).values({
      buyerId: newBuyer.id,
      changedBy: user.id,
      diff: {
        created: { old: null, new: 'Buyer created' }
      },
    });
    console.log('History entry created');

    return NextResponse.json(newBuyer);
  } catch (error) {
    console.error('Error creating buyer:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: error.message },
          { status: 400 }
        );
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: error.message, stack: error.stack },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(createBuyer, { windowMs: 15 * 60 * 1000, maxRequests: 20 });
