'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBuyerSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

// Custom schema for the form without default values
const formCreateBuyerSchema = createBuyerSchema.omit({ status: true, tags: true }).extend({
  status: z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']).optional(),
  tags: z.string().optional(), // Allow tags as string in the form
});

type FormCreateBuyer = z.infer<typeof formCreateBuyerSchema>;

export default function NewBuyerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormCreateBuyer>({
    resolver: zodResolver(formCreateBuyerSchema),
    defaultValues: {
      status: 'New',
    },
  });

  const propertyType = watch('propertyType');

  const onSubmit = async (data: FormCreateBuyer) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Convert form data to API format
      const submitData = {
        ...data,
        status: data.status || 'New',
        // Convert tags string to array
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };

      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to create buyer (${response.status})`);
      }

      const result = await response.json();
      router.push(`/buyers/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50 rounded-xl border border-gray-200 shadow-lg">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Buyer Lead</h2>
              <p className="text-gray-700 font-medium">Fill in the details to add a new buyer to your database</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 border-2 border-red-300 p-6 shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-bold text-red-900">Error</h3>
                  <div className="mt-2 text-base font-medium text-red-800">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">👤</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">✏️</span>
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  {...register('fullName')}
                  aria-label="Full name"
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  aria-invalid={!!errors.fullName}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter the buyer's full name"
                />
                {errors.fullName && (
                  <div 
                    id="fullName-error"
                    role="alert"
                    aria-live="polite"
                    className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg"
                  >
                    <span className="mr-2" aria-hidden="true">❌</span>
                    {errors.fullName.message}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-600">
                  <span className="mr-2">📧</span>
                  Email Address <span className="text-gray-400 ml-1">(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  aria-label="Email address"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter email address (optional)"
                />
                {errors.email && (
                  <div 
                    id="email-error"
                    role="alert"
                    aria-live="polite"
                    className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded"
                  >
                    <span className="mr-1" aria-hidden="true">❌</span>
                    {errors.email.message}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">📱</span>
                  Phone Number <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  aria-label="Phone number"
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  aria-invalid={!!errors.phone}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <div 
                    id="phone-error"
                    role="alert"
                    aria-live="polite"
                    className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg"
                  >
                    <span className="mr-2" aria-hidden="true">❌</span>
                    {errors.phone.message}
                  </div>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <label htmlFor="city" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">📍</span>
                  City <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="city"
                  {...register('city')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select a city</option>
                  <option value="Chandigarh">🏛️ Chandigarh</option>
                  <option value="Mohali">🏢 Mohali</option>
                  <option value="Zirakpur">🏘️ Zirakpur</option>
                  <option value="Panchkula">🏗️ Panchkula</option>
                  <option value="Other">🌍 Other</option>
                </select>
                {errors.city && (
                  <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="mr-2">❌</span>
                    {errors.city.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Property Information Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">🏠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Property Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Type */}
              <div className="space-y-2">
                <label htmlFor="propertyType" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">🏢</span>
                  Property Type <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="propertyType"
                  {...register('propertyType')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.propertyType ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select property type</option>
                  <option value="Apartment">🏢 Apartment</option>
                  <option value="Villa">🏡 Villa</option>
                  <option value="Plot">📐 Plot</option>
                  <option value="Office">🏢 Office</option>
                  <option value="Retail">🏪 Retail</option>
                </select>
                {errors.propertyType && (
                  <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="mr-2">❌</span>
                    {errors.propertyType.message}
                  </div>
                )}
              </div>

              {/* BHK (conditionally rendered) */}
              {['Apartment', 'Villa'].includes(propertyType as string) && (
                <div className="space-y-2">
                  <label htmlFor="bhk" className="flex items-center text-sm font-bold text-gray-900">
                    <span className="mr-2">🏠</span>
                    BHK <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="bhk"
                    {...register('bhk')}
                    className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.bhk ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select BHK</option>
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="Studio">Studio</option>
                  </select>
                  {errors.bhk && (
                    <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                      <span className="mr-2">❌</span>
                      {errors.bhk.message}
                    </div>
                  )}
                </div>
              )}

              {/* Purpose */}
              <div className="space-y-2">
                <label htmlFor="purpose" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">💰</span>
                  Purpose <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="purpose"
                  {...register('purpose')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.purpose ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select purpose</option>
                  <option value="Buy">💵 Buy</option>
                  <option value="Rent">🏠 Rent</option>
                </select>
                {errors.purpose && (
                  <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="mr-2">❌</span>
                    {errors.purpose.message}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <label htmlFor="timeline" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">⏰</span>
                  Timeline <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="timeline"
                  {...register('timeline')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.timeline ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select timeline</option>
                  <option value="0-3m">⚡ 0-3 Months</option>
                  <option value="3-6m">📅 3-6 Months</option>
                  <option value=">6m">📆 Greater than 6 Months</option>
                  <option value="Exploring">🔍 Just Exploring</option>
                </select>
                {errors.timeline && (
                  <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="mr-2">❌</span>
                    {errors.timeline.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-lg">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Budget Information <span className="text-gray-400 font-normal">(optional)</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget Min */}
              <div className="space-y-2">
                <label htmlFor="budgetMin" className="flex items-center text-sm font-medium text-gray-600">
                  <span className="mr-2">💵</span>
                  Budget Minimum <span className="text-gray-400 ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  id="budgetMin"
                  {...register('budgetMin', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    errors.budgetMin ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter minimum budget (₹)"
                />
                {errors.budgetMin && (
                  <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    <span className="mr-1">❌</span>
                    {errors.budgetMin.message}
                  </div>
                )}
              </div>

              {/* Budget Max */}
              <div className="space-y-2">
                <label htmlFor="budgetMax" className="flex items-center text-sm font-medium text-gray-600">
                  <span className="mr-2">💎</span>
                  Budget Maximum <span className="text-gray-400 ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  id="budgetMax"
                  {...register('budgetMax', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    errors.budgetMax ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter maximum budget (₹)"
                />
                {errors.budgetMax && (
                  <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    <span className="mr-1">❌</span>
                    {errors.budgetMax.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-lg">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Additional Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source */}
              <div className="space-y-2">
                <label htmlFor="source" className="flex items-center text-sm font-bold text-gray-900">
                  <span className="mr-2">📊</span>
                  Lead Source <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="source"
                  {...register('source')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border-2 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.source ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <option value="">Select source</option>
                  <option value="Website">🌐 Website</option>
                  <option value="Referral">👥 Referral</option>
                  <option value="Walk-in">🚶 Walk-in</option>
                  <option value="Call">📞 Call</option>
                  <option value="Other">🔍 Other</option>
                </select>
                {errors.source && (
                  <div className="flex items-center text-sm font-semibold text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                    <span className="mr-2">❌</span>
                    {errors.source.message}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="flex items-center text-sm font-medium text-gray-600">
                  <span className="mr-2">📈</span>
                  Lead Status <span className="text-gray-400 ml-1">(defaults to New)</span>
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                    errors.status ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="New">🆕 New</option>
                  <option value="Qualified">✅ Qualified</option>
                  <option value="Contacted">📞 Contacted</option>
                  <option value="Visited">🏠 Visited</option>
                  <option value="Negotiation">🤝 Negotiation</option>
                  <option value="Converted">🎉 Converted</option>
                  <option value="Dropped">❌ Dropped</option>
                </select>
                {errors.status && (
                  <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    <span className="mr-1">❌</span>
                    {errors.status.message}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-5 space-y-2">
              <label htmlFor="notes" className="flex items-center text-sm font-medium text-gray-600">
                <span className="mr-2">📝</span>
                Additional Notes <span className="text-gray-400 ml-1">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 resize-none ${
                  errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter any additional notes about this buyer lead..."
              ></textarea>
              {errors.notes && (
                <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  <span className="mr-1">❌</span>
                  {errors.notes.message}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-5 space-y-2">
              <label htmlFor="tags" className="flex items-center text-sm font-medium text-gray-600">
                <span className="mr-2">🏷️</span>
                Tags <span className="text-gray-400 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                id="tags"
                {...register('tags')}
                className={`w-full px-4 py-3 text-gray-900 text-base border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200 ${
                  errors.tags ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter tags separated by commas (e.g., hot, urgent, 2bhk)"
              />
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="mr-2">💡</span>
                  <strong>Tip:</strong> Separate multiple tags with commas (e.g., &quot;hot, urgent, 2bhk&quot;)
                </p>
              </div>
              {errors.tags && (
                <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  <span className="mr-1">❌</span>
                  {errors.tags.message}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-base font-semibold border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Creating buyer lead, please wait" : "Create new buyer lead"}
              className="px-8 py-3 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Lead...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Create Buyer Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}