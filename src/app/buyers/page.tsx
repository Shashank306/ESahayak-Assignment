import { Suspense } from 'react';
import Navigation from '@/components/layout/navigation';
import AuthWrapper from '@/components/layout/auth-wrapper';
import BuyersList from './buyers-list';
import BuyersFilters from './buyers-filters';
import CsvImportExport from '@/components/csv-import-export';

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  console.log('Buyers page loading...');

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Buyer Leads</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and track your buyer leads
              </p>
              <p className="mt-2 text-sm text-green-600">
                ✅ Page loaded successfully! Authentication is working.
              </p>
            </div>
            
            <Suspense fallback={<div>Loading filters...</div>}>
              <BuyersFilters />
            </Suspense>

            <div className="mb-6">
              <CsvImportExport />
            </div>
            
            <Suspense fallback={<div>Loading buyers...</div>}>
              <BuyersList searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
