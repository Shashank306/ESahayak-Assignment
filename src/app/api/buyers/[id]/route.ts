import { NextRequest, NextResponse } from 'next/server';
import { db, buyers, buyerHistory, users } from '@/lib/db';
import { updateBuyerSchema } from '@/lib/validation/schemas';
import { getCurrentUser, canEditBuyer } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PUT /api/buyers/[id] - Starting authentication...');
    
    // Try multiple authentication methods
    let user = await getCurrentUser();
    console.log('getCurrentUser result:', user ? `User found: ${user.email}` : 'No user');
    
    // If getCurrentUser fails, try Authorization header
    if (!user) {
      console.log('Trying Authorization header method...');
      const authHeader = request.headers.get('authorization');
      console.log('Authorization header:', authHeader ? 'present' : 'missing');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('Token found, trying to verify...');
        
        try {
          const { data: { user: tokenUser }, error } = await supabaseAdmin?.auth.getUser(token);
          console.log('Token verification result:', tokenUser ? `User found: ${tokenUser.email}` : 'No user');
          console.log('Token verification error:', error);
          
          if (tokenUser && !error) {
            // Get or create user in our database
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, tokenUser.id))
              .limit(1);

            if (!dbUser) {
              console.log('Creating new user in database...');
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
              console.log('New user created:', user.email);
            } else {
              user = dbUser;
              console.log('Existing user found:', user.email);
            }
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
        }
      }
    }
    
    if (!user) {
      console.log('No user found with any method, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Authentication successful, proceeding with buyer update...');

    const body = await request.json();
    console.log('Request body received:', body);
    
    // Convert updatedAt string to Date object if it exists
    if (body.updatedAt && typeof body.updatedAt === 'string') {
      body.updatedAt = new Date(body.updatedAt);
    }
    
    const validatedData = updateBuyerSchema.parse(body);
    console.log('Validated data:', validatedData);
    const { id } = await params;
    console.log('Looking for buyer with ID:', id);
    console.log('Current user ID:', user.id);

    // Debug: Check all users in database
    const allUsers = await db.select().from(users);
    console.log('All users in database:', allUsers.map(u => ({ id: u.id, email: u.email })));

    // First check if buyer exists at all (for debugging)
    const [anyBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, id))
      .limit(1);
    
    console.log('Buyer exists in database:', anyBuyer ? 'Yes' : 'No');
    if (anyBuyer) {
      console.log('Buyer owner ID:', anyBuyer.ownerId);
      console.log('Buyer owner matches current user:', anyBuyer.ownerId === user.id);
    }

    // Check if buyer exists and user can edit it (owner or admin)
    const [existingBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, id))
      .limit(1);

    console.log('Existing buyer found:', existingBuyer ? 'Yes' : 'No');

    if (!existingBuyer) {
      console.log('Buyer not found');
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Check if user can edit this buyer (owner or admin)
    const canEdit = await canEditBuyer(user.id, existingBuyer.ownerId);
    console.log('User can edit buyer:', canEdit);

    if (!canEdit) {
      console.log('User does not have permission to edit this buyer');
      return NextResponse.json({ error: 'You do not have permission to edit this buyer' }, { status: 403 });
    }

    // Check for concurrency conflicts
    if (new Date(existingBuyer.updatedAt).getTime() !== new Date(validatedData.updatedAt).getTime()) {
      return NextResponse.json(
        { error: 'Record changed, please refresh' },
        { status: 409 }
      );
    }

    // Process tags if provided
    let tags: string[] | undefined = undefined;
    if (validatedData.tags !== undefined) {
      if (typeof validatedData.tags === 'string') {
        tags = (validatedData.tags as string).split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(validatedData.tags)) {
        tags = validatedData.tags;
      }
    }

    // Calculate changes for history
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const fieldsToCheck = [
      'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 
      'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 
      'status', 'notes', 'tags'
    ] as const;

    fieldsToCheck.forEach(field => {
      const oldValue = existingBuyer[field];
      const newValue = validatedData[field];
      
      if (oldValue !== newValue) {
        changes[field] = { old: oldValue, new: newValue };
      }
    });

    // Update buyer
    const [updatedBuyer] = await db
      .update(buyers)
      .set({
        ...validatedData,
        tags,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, id))
      .returning();

    // Create history entry if there are changes
    if (Object.keys(changes).length > 0) {
      await db.insert(buyerHistory).values({
        buyerId: id,
        changedBy: user.id,
        diff: changes,
      });
    }

    return NextResponse.json(updatedBuyer);
  } catch (error) {
    console.error('Error updating buyer:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Validation error details:', error.message);
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/buyers/[id] - Starting authentication...');
    
    // Try multiple authentication methods
    let user = await getCurrentUser();
    console.log('getCurrentUser result:', user ? `User found: ${user.email}` : 'No user');
    
    // If getCurrentUser fails, try Authorization header
    if (!user) {
      console.log('Trying Authorization header method...');
      const authHeader = request.headers.get('authorization');
      console.log('Authorization header:', authHeader ? 'present' : 'missing');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('Token found, trying to verify...');
        
        try {
          const { data: { user: tokenUser }, error } = await supabaseAdmin?.auth.getUser(token);
          console.log('Token verification result:', tokenUser ? `User found: ${tokenUser.email}` : 'No user');
          console.log('Token verification error:', error);
          
          if (tokenUser && !error) {
            // Get or create user in our database
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, tokenUser.id))
              .limit(1);

            if (!dbUser) {
              console.log('Creating new user in database...');
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
              console.log('New user created:', user.email);
            } else {
              user = dbUser;
              console.log('Existing user found:', user.email);
            }
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
        }
      }
    }
    
    if (!user) {
      console.log('No user found with any method, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Authentication successful, proceeding with buyer deletion...');

    const { id } = await params;
    console.log('Looking for buyer with ID:', id);
    console.log('Current user ID:', user.id);

    // Check if buyer exists and user can delete it (owner or admin)
    const [existingBuyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, id))
      .limit(1);

    console.log('Existing buyer found:', existingBuyer ? 'Yes' : 'No');

    if (!existingBuyer) {
      console.log('Buyer not found');
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Check if user can delete this buyer (owner or admin)
    const canDelete = await canEditBuyer(user.id, existingBuyer.ownerId);
    console.log('User can delete buyer:', canDelete);

    if (!canDelete) {
      console.log('User does not have permission to delete this buyer');
      return NextResponse.json({ error: 'You do not have permission to delete this buyer' }, { status: 403 });
    }

    // Delete buyer history first (foreign key constraint)
    await db.delete(buyerHistory).where(eq(buyerHistory.buyerId, id));
    console.log('Buyer history deleted');

    // Delete the buyer
    await db.delete(buyers).where(eq(buyers.id, id));
    console.log('Buyer deleted successfully');

    return NextResponse.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
