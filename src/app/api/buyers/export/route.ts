import { NextRequest, NextResponse } from 'next/server';
import { db, buyers, users } from '@/lib/db';
import { buyerFiltersSchema } from '@/lib/validation/schemas';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('Export API called - RESTORING FUNCTIONALITY');
    
    // Log all cookies
    console.log('All cookies:', request.cookies.getAll());
    
    // Step 1: Test authentication - try multiple methods
    console.log('Testing authentication...');
    
    // Method 1: Try the regular getCurrentUser
    let user = await getCurrentUser();
    console.log('getCurrentUser result:', user ? `User found: ${user.email}` : 'No user');
    
    // Method 2: If that fails, try to get user from Authorization header
    if (!user) {
      console.log('Trying Authorization header method...');
      const authHeader = request.headers.get('authorization');
      console.log('Authorization header:', authHeader ? 'present' : 'missing');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('Token found, trying to verify...');
        
        try {
          const { data: { user: tokenUser }, error } = await supabaseAdmin?.auth.getUser(token);
          if (tokenUser && !error) {
            console.log('Token user found:', tokenUser.email);
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
      console.log('No user found with any method, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Authentication successful, proceeding with database query');

    // Step 2: Parse query parameters for filtering
    console.log('Parsing query parameters for filtering...');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    console.log('Raw search params:', Object.fromEntries(searchParams.entries()));
    
    // Helper function to safely get string values from searchParams
    const getStringParam = (param: string | null): string => {
      return param || '';
    };

    // Helper function to get enum values (returns undefined for empty strings)
    const getEnumParam = (param: string | null): string | undefined => {
      const value = getStringParam(param);
      return value === '' ? undefined : value;
    };

    let filters;
    try {
      filters = buyerFiltersSchema.parse({
        search: getStringParam(searchParams.get('search')),
        city: getEnumParam(searchParams.get('city')),
        propertyType: getEnumParam(searchParams.get('propertyType')),
        status: getEnumParam(searchParams.get('status')),
        timeline: getEnumParam(searchParams.get('timeline')),
        page: 1, // Not needed for export
        limit: 100, // Use the maximum allowed limit
        sortBy: getStringParam(searchParams.get('sortBy')) || 'updatedAt',
        sortOrder: getStringParam(searchParams.get('sortOrder')) || 'desc',
      });
      console.log('Applied filters:', filters);
    } catch (filterError) {
      console.error('Filter parsing error:', filterError);
      throw new Error(`Filter validation error: ${filterError instanceof Error ? filterError.message : 'Unknown filter error'}`);
    }

    // Step 3: Build where conditions (same logic as buyers list)
    const whereConditions = [];
    
    if (filters.search) {
      whereConditions.push(
        or(
          like(buyers.fullName, `%${filters.search}%`),
          like(buyers.phone, `%${filters.search}%`),
          like(buyers.email, `%${filters.search}%`)
        )!
      );
    }
    
    if (filters.city) {
      whereConditions.push(eq(buyers.city, filters.city as 'Chandigarh' | 'Mohali' | 'Zirakpur' | 'Panchkula' | 'Other'));
    }
    
    if (filters.propertyType) {
      whereConditions.push(eq(buyers.propertyType, filters.propertyType as 'Apartment' | 'Villa' | 'Plot' | 'Office' | 'Retail'));
    }
    
    if (filters.status) {
      whereConditions.push(eq(buyers.status, filters.status as 'New' | 'Qualified' | 'Contacted' | 'Visited' | 'Negotiation' | 'Converted' | 'Dropped'));
    }
    
    if (filters.timeline) {
      whereConditions.push(eq(buyers.timeline, filters.timeline as '0-3m' | '3-6m' | '>6m' | 'Exploring'));
    }

    // Build order by
    let orderBy;
    if (filters.sortBy === 'createdAt') {
      orderBy = filters.sortOrder === 'asc' 
        ? asc(buyers.createdAt)
        : desc(buyers.createdAt);
    } else if (filters.sortBy === 'fullName') {
      orderBy = filters.sortOrder === 'asc' 
        ? asc(buyers.fullName)
        : desc(buyers.fullName);
    } else {
      orderBy = filters.sortOrder === 'asc' 
        ? asc(buyers.updatedAt)
        : desc(buyers.updatedAt);
    }

    // Step 4: Execute filtered query
    console.log('Executing filtered database query...');
    let buyersList;
    try {
      buyersList = await db
        .select()
        .from(buyers)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(orderBy);
      
      console.log(`Database query successful, found ${buyersList.length} buyers with filters applied`);
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

    // Step 3: Generate CSV with real data
    console.log('Generating CSV with real data...');
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'City',
      'Property Type',
      'BHK',
      'Purpose',
      'Budget Min',
      'Budget Max',
      'Timeline',
      'Source',
      'Notes',
      'Tags',
      'Status',
      'Created At',
      'Updated At'
    ];

    const csvRows = buyersList.map(buyer => [
      buyer.fullName,
      buyer.email || '',
      buyer.phone,
      buyer.city,
      buyer.propertyType,
      buyer.bhk || '',
      buyer.purpose,
      buyer.budgetMin || '',
      buyer.budgetMax || '',
      buyer.timeline,
      buyer.source,
      (buyer.notes || '').replace(/"/g, '""'), // Escape quotes
      buyer.tags ? buyer.tags.join(', ') : '',
      buyer.status,
      buyer.createdAt.toISOString(),
      buyer.updatedAt.toISOString()
    ]);

    // Escape CSV values and wrap in quotes if needed
    const escapeCsvValue = (value: string | number | Date | null | undefined) => {
      const str = String(value || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    console.log('CSV generated successfully with real data');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="buyers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error in export:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
