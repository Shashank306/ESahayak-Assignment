import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log(`Setting user ${email} as admin...`);
    
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))
      .returning();
    
    if (updatedUser) {
      console.log(`✅ Successfully set ${email} as admin!`);
      return NextResponse.json({ 
        success: true, 
        message: `Successfully set ${email} as admin!`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role
        }
      });
    } else {
      console.log(`❌ User ${email} not found in database`);
      return NextResponse.json({ 
        error: `User ${email} not found in database` 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error setting admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
