import Navigation from '@/components/layout/navigation';
import AuthWrapper from '@/components/layout/auth-wrapper';
import NewBuyerForm from './new-buyer-form';

export default async function NewBuyerPage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">New Buyer Lead</h1>
              <p className="mt-2 text-sm text-gray-600">
                Add a new buyer lead to your database
              </p>
            </div>
            
            <NewBuyerForm />
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
