import { db, buyers, users, buyerHistory } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import BuyerDetailForm from './buyer-detail-form';
import BuyerHistory from './buyer-history';

interface BuyerDetailProps {
  buyerId: string;
}

export default async function BuyerDetail({ buyerId }: BuyerDetailProps) {
  // Get buyer details
  const [buyer] = await db
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
      source: buyers.source,
      status: buyers.status,
      notes: buyers.notes,
      tags: buyers.tags,
      ownerId: buyers.ownerId,
      createdAt: buyers.createdAt,
      updatedAt: buyers.updatedAt,
      owner: {
        fullName: users.fullName,
      },
    })
    .from(buyers)
    .leftJoin(users, eq(buyers.ownerId, users.id))
    .where(eq(buyers.id, buyerId))
    .limit(1);

  if (!buyer) {
    notFound();
  }

  // Get buyer history
  const history = await db
    .select({
      id: buyerHistory.id,
      changedAt: buyerHistory.changedAt,
      diff: buyerHistory.diff,
      changedBy: {
        fullName: users.fullName,
      },
    })
    .from(buyerHistory)
    .leftJoin(users, eq(buyerHistory.changedBy, users.id))
    .where(eq(buyerHistory.buyerId, buyerId))
    .orderBy(desc(buyerHistory.changedAt))
    .limit(5);

  // For now, allow all authenticated users to edit (we'll handle ownership client-side)
  const canEdit = true;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{buyer.fullName}</h1>
              <p className="text-sm text-gray-500">
                Created by {buyer.owner?.fullName || 'Unknown'} on{' '}
                {new Date(buyer.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                buyer.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                buyer.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                buyer.status === 'Visited' ? 'bg-purple-100 text-purple-800' :
                buyer.status === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                buyer.status === 'Converted' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {buyer.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{buyer.phone}</dd>
                </div>
                {buyer.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{buyer.email}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="text-sm text-gray-900">{buyer.city}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                  <dd className="text-sm text-gray-900">{buyer.propertyType}</dd>
                </div>
                {buyer.bhk && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">BHK</dt>
                    <dd className="text-sm text-gray-900">{buyer.bhk}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                  <dd className="text-sm text-gray-900">{buyer.purpose}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                  <dd className="text-sm text-gray-900">{buyer.timeline}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="text-sm text-gray-900">{buyer.source}</dd>
                </div>
              </dl>
            </div>
          </div>

          {(buyer.budgetMin || buyer.budgetMax) && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Budget</h3>
              <div className="text-sm text-gray-900">
                {buyer.budgetMin && new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(buyer.budgetMin)}
                {buyer.budgetMin && buyer.budgetMax && ' - '}
                {buyer.budgetMax && new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(buyer.budgetMax)}
              </div>
            </div>
          )}

          {buyer.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{buyer.notes}</p>
            </div>
          )}

          {buyer.tags && buyer.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {buyer.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="px-6 py-4 border-t border-gray-200">
            <BuyerDetailForm buyer={buyer} />
          </div>
        )}
      </div>

      <BuyerHistory history={history} />
    </div>
  );
}
