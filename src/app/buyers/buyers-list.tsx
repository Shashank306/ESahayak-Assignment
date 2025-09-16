import { db, buyers, users } from '@/lib/db';
import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
import { buyerFiltersSchema } from '@/lib/validation/schemas';
import Link from 'next/link';
import { format } from 'date-fns';

interface BuyersListProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BuyersList({ searchParams }: BuyersListProps) {
  // Await searchParams in Next.js 15
  const resolvedSearchParams = await searchParams;
  // Helper function to safely get string values from searchParams
  const getStringParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) {
      return param[0] || '';
    }
    return param || '';
  };

  // Helper function to get enum values (returns undefined for empty strings)
  const getEnumParam = (param: string | string[] | undefined): string | undefined => {
    const value = getStringParam(param);
    return value === '' ? undefined : value;
  };

  const filters = buyerFiltersSchema.parse({
    search: getStringParam(resolvedSearchParams.search),
    city: getEnumParam(resolvedSearchParams.city),
    propertyType: getEnumParam(resolvedSearchParams.propertyType),
    status: getEnumParam(resolvedSearchParams.status),
    timeline: getEnumParam(resolvedSearchParams.timeline),
    page: parseInt(getStringParam(resolvedSearchParams.page)) || 1,
    limit: parseInt(getStringParam(resolvedSearchParams.limit)) || 10,
    sortBy: getStringParam(resolvedSearchParams.sortBy) || 'updatedAt',
    sortOrder: getStringParam(resolvedSearchParams.sortOrder) || 'desc',
  });

  // Build where conditions
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

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(buyers)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / filters.limit);

  // Get buyers with pagination
  const buyersList = await db
    .select({
      id: buyers.id,
      fullName: buyers.fullName,
      email: buyers.email,
      phone: buyers.phone,
      city: buyers.city,
      propertyType: buyers.propertyType,
      bhk: buyers.bhk,
      purpose: buyers.purpose,
      budgetMin: buyers.budgetMin,
      budgetMax: buyers.budgetMax,
      timeline: buyers.timeline,
      status: buyers.status,
      updatedAt: buyers.updatedAt,
      owner: {
        fullName: users.fullName,
      },
    })
    .from(buyers)
    .leftJoin(users, eq(buyers.ownerId, users.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(orderBy)
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🆕' },
      'Qualified': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '✅' },
      'Contacted': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '📞' },
      'Visited': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🏠' },
      'Negotiation': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🤝' },
      'Converted': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🎉' },
      'Dropped': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '❌' },
    };
    return configs[status as keyof typeof configs] || configs['New'];
  };

  const getPropertyIcon = (propertyType: string) => {
    const icons = {
      'Apartment': '🏢',
      'Villa': '🏡',
      'Plot': '📐',
      'Office': '🏢',
      'Retail': '🏪',
    };
    return icons[propertyType as keyof typeof icons] || '🏠';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">👥</span>
              Buyer Leads
              <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {total}
              </span>
            </h3>
            <p className="mt-2 text-gray-800">
              Manage and track your buyer leads
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
            <span>📊</span>
            <span>Showing {buyersList.length} of {total}</span>
          </div>
        </div>
      </div>
      
      {buyersList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No buyers found</h3>
          <p className="text-gray-700 mb-6">No buyers match your current search and filter criteria.</p>
          <Link
            href="/buyers/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">➕</span>
            Add New Lead
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {buyersList.map((buyer) => {
            const statusConfig = getStatusConfig(buyer.status);
            return (
              <div
                key={buyer.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
              >
                <Link href={`/buyers/${buyer.id}`} className="block p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {buyer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {buyer.fullName}
                            </h4>
                            <p className="text-sm text-gray-500">{buyer.email || buyer.phone}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          <span className="mr-1">{statusConfig.icon}</span>
                          {buyer.status}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>📍</span>
                          <span>{buyer.city}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{getPropertyIcon(buyer.propertyType)}</span>
                          <span>{buyer.propertyType}</span>
                          {buyer.bhk && <span className="text-gray-400">• {buyer.bhk} BHK</span>}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>💰</span>
                          <span>{buyer.purpose}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>⏰</span>
                          <span>{buyer.timeline}</span>
                        </div>
                      </div>

                      {/* Budget */}
                      {(buyer.budgetMin || buyer.budgetMax) && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Budget Range</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {buyer.budgetMin && formatCurrency(buyer.budgetMin)}
                              {buyer.budgetMin && buyer.budgetMax && ' - '}
                              {buyer.budgetMax && formatCurrency(buyer.budgetMax)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>👤 {buyer.owner?.fullName || 'Unknown'}</span>
                          <span>📅 {format(new Date(buyer.updatedAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                          <span>View Details</span>
                          <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Page {filters.page} of {totalPages}</span>
                <span className="mx-2">•</span>
                <span>
                  Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">{Math.min(filters.page * filters.limit, total)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{total}</span> results
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                href={`/buyers?${new URLSearchParams({
                  ...resolvedSearchParams,
                  page: Math.max(1, filters.page - 1).toString(),
                })}`}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                  filters.page === 1 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Link>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === filters.page;
                  return (
                    <Link
                      key={pageNum}
                      href={`/buyers?${new URLSearchParams({
                        ...resolvedSearchParams,
                        page: pageNum.toString(),
                      })}`}
                      className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              
              <Link
                href={`/buyers?${new URLSearchParams({
                  ...resolvedSearchParams,
                  page: Math.min(totalPages, filters.page + 1).toString(),
                })}`}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                  filters.page === totalPages 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
