import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    console.log('getCurrentUser: Getting user from Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('getCurrentUser: Error:', error);
      console.log('getCurrentUser: User:', user ? 'Found' : 'No user');
      console.log('getCurrentUser: Returning null due to error or no user');
      return null;
    }

    console.log('getCurrentUser: User found:', user.email);

    // Try to get user from our database
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (dbUser) {
        console.log('getCurrentUser: Database user found:', dbUser.email);
        return {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          role: dbUser.role as 'user' | 'admin',
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt,
        };
      } else {
        // Create user in our database
        console.log('getCurrentUser: Creating new user in database...');
        const newUser = {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
          role: 'user' as const,
        };

        await db.insert(users).values(newUser);
        
        return {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    } catch (dbError) {
      console.warn('getCurrentUser: Database error (non-critical):', dbError);
      // Return user info from Supabase even if database is unavailable
      return {
        id: user.id,
        email: user.email!,
        fullName: user.user_metadata?.full_name || null,
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  } catch (error) {
    console.error('getCurrentUser: Unexpected error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('Auth check failed:', error);
      redirect('/auth/login');
    }

    // Try to get or create user in our database, but don't fail if database is unavailable
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!dbUser) {
        // Create user in our database
        await db.insert(users).values({
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
        });
      }
    } catch (dbError) {
      console.warn('Database error in auth check (non-critical):', dbError);
      // Continue anyway - authentication is still valid
    }
    
    return {
      id: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name || null,
      role: 'user' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Auth check error:', error);
    redirect('/auth/login');
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function canEditBuyer(userId: string, buyerOwnerId: string): Promise<boolean> {
  try {
    // Check if user is admin
    const adminStatus = await isAdmin(userId);
    if (adminStatus) {
      return true;
    }

    // Check if user is the owner
    return userId === buyerOwnerId;
  } catch (error) {
    console.error('Error checking edit permissions:', error);
    return false;
  }
}
