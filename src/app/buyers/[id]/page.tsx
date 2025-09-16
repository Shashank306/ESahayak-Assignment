import { Suspense } from 'react';
import Navigation from '@/components/layout/navigation';
import AuthWrapper from '@/components/layout/auth-wrapper';
import BuyerDetail from './buyer-detail';

interface BuyerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BuyerDetailPage({ params }: BuyerDetailPageProps) {
  const { id } = await params;
  
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Suspense fallback={<div>Loading buyer details...</div>}>
              <BuyerDetail buyerId={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
