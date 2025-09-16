import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    console.log('Check user API called with email:', email);
    
    if (!email) {
      console.log('No email provided');
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    console.log('Querying database for user:', email);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    console.log('Database query result:', user ? 'User found' : 'User not found');
    
    if (user) {
      console.log('User details:', { id: user.id, email: user.email, role: user.role });
      return NextResponse.json({ 
        found: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } else {
      console.log(`User ${email} not found in database`);
      return NextResponse.json({ 
        found: false,
        message: `User ${email} not found in database`
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
