import { NextRequest, NextResponse } from 'next/server';
import { db, buyers, buyerHistory, users } from '@/lib/db';
import { csvImportSchema } from '@/lib/validation/schemas';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { eq } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';

export async function POST(request: NextRequest) {
  try {
    // Try multiple authentication methods
    let user = await getCurrentUser();
    
    // If getCurrentUser fails, try Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          if (!supabaseAdmin) {
            throw new Error('Supabase admin client not available');
          }
          const { data: { user: tokenUser }, error } = await supabaseAdmin.auth.getUser(token);
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parse(text, { columns: true }) as Record<string, string>[];
    
    // Debug: Log the first few rows to see what's being parsed
    console.log('CSV Debug - First row:', rows[0]);
    console.log('CSV Debug - Available columns:', Object.keys(rows[0] || {}));
    console.log('CSV Debug - Total rows:', rows.length);
    
    // Field mapping from CSV column names to schema field names
    const fieldMapping: Record<string, string> = {
      'Full Name': 'fullName',
      'Email': 'email',
      'Phone': 'phone',
      'City': 'city',
      'Property Type': 'propertyType',
      'BHK': 'bhk',
      'Purpose': 'purpose',
      'Budget Min': 'budgetMin',
      'Budget Max': 'budgetMax',
      'Timeline': 'timeline',
      'Source': 'source',
      'Notes': 'notes',
      'Tags': 'tags',
      'Status': 'status',
      'Created At': 'createdAt',
      'Updated At': 'updatedAt'
    };
    
    // Transform rows to use schema field names
    const transformedRows = rows.map(row => {
      const transformed: Record<string, string> = {};
      for (const [csvField, value] of Object.entries(row)) {
        const schemaField = fieldMapping[csvField] || csvField;
        transformed[schemaField] = value;
      }
      return transformed;
    });
    
    console.log('CSV Debug - Transformed first row:', transformedRows[0]);
    
    const errors: Array<{ row: number; error: string }> = [];
    let successCount = 0;

    if (transformedRows.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 rows allowed' },
        { status: 400 }
      );
    }

    // Validate and process rows
    const validRows: unknown[] = [];
    
    for (let i = 0; i < transformedRows.length; i++) {
      const row = transformedRows[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

      // Debug: Log the row data for first few rows
      if (i < 6) {
        console.log(`CSV Debug - Row ${rowNumber}:`, row);
        console.log(`CSV Debug - Row ${rowNumber} fullName:`, row.fullName);
        console.log(`CSV Debug - Row ${rowNumber} phone:`, row.phone);
        console.log(`CSV Debug - Row ${rowNumber} bhk:`, row.bhk, typeof row.bhk);
        console.log(`CSV Debug - Row ${rowNumber} propertyType:`, row.propertyType);
      }

      try {
        const validatedRow = csvImportSchema.parse(row);
        validRows.push(validatedRow);
      } catch (error) {
        if (error instanceof Error) {
          errors.push({
            row: rowNumber,
            error: error.message,
          });
        }
      }
    }

    // Insert valid rows in a transaction
    if (validRows.length > 0) {
      await db.transaction(async (tx) => {
        for (const row of validRows) {
          const validatedRow = row as ReturnType<typeof csvImportSchema.parse>;
          const [newBuyer] = await tx.insert(buyers).values({
            fullName: validatedRow.fullName,
            email: validatedRow.email || null,
            phone: validatedRow.phone,
            city: validatedRow.city,
            propertyType: validatedRow.propertyType,
            bhk: validatedRow.bhk || null,
            purpose: validatedRow.purpose,
            budgetMin: validatedRow.budgetMin || null,
            budgetMax: validatedRow.budgetMax || null,
            timeline: validatedRow.timeline,
            source: validatedRow.source,
            status: validatedRow.status,
            notes: validatedRow.notes || null,
            tags: validatedRow.tags && validatedRow.tags.length > 0 ? validatedRow.tags : null,
            ownerId: user.id,
          }).returning();

          // Create history entry
          await tx.insert(buyerHistory).values({
            buyerId: newBuyer.id,
            changedBy: user.id,
            diff: {
              created: { old: null, new: 'Buyer imported from CSV' }
            },
          });
        }
      });

      successCount = validRows.length;
    }

    return NextResponse.json({
      successCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
