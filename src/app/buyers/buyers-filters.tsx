'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

export default function BuyersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [timeline, setTimeline] = useState(searchParams.get('timeline') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'updatedAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (city) params.set('city', city);
    if (propertyType) params.set('propertyType', propertyType);
    if (status) params.set('status', status);
    if (timeline) params.set('timeline', timeline);
    if (sortBy !== 'updatedAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    router.push(`/buyers?${params.toString()}`);
  }, [debouncedSearch, city, propertyType, status, timeline, sortBy, sortOrder, router]);

  const clearFilters = () => {
    setSearch('');
    setCity('');
    setPropertyType('');
    setStatus('');
    setTimeline('');
    setSortBy('updatedAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = city || propertyType || status || timeline || search || sortBy !== 'updatedAt' || sortOrder !== 'desc';

  return (
    <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-lg">🔍</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
            <p className="text-sm text-gray-800">Find buyers by name, location, or other criteria</p>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <span className="mr-2">🗑️</span>
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="space-y-2">
          <label htmlFor="search" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">🔍</span>
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone, or email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* City */}
        <div className="space-y-2">
          <label htmlFor="city" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">📍</span>
            City
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="">All Cities</option>
            <option value="Chandigarh">🏛️ Chandigarh</option>
            <option value="Mohali">🏢 Mohali</option>
            <option value="Zirakpur">🏘️ Zirakpur</option>
            <option value="Panchkula">🏗️ Panchkula</option>
            <option value="Other">🌍 Other</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <label htmlFor="propertyType" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">🏠</span>
            Property Type
          </label>
          <select
            id="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="">All Types</option>
            <option value="Apartment">🏢 Apartment</option>
            <option value="Villa">🏡 Villa</option>
            <option value="Plot">📐 Plot</option>
            <option value="Office">🏢 Office</option>
            <option value="Retail">🏪 Retail</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label htmlFor="status" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">📊</span>
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="">All Statuses</option>
            <option value="New">🆕 New</option>
            <option value="Qualified">✅ Qualified</option>
            <option value="Contacted">📞 Contacted</option>
            <option value="Visited">🏠 Visited</option>
            <option value="Negotiation">🤝 Negotiation</option>
            <option value="Converted">🎉 Converted</option>
            <option value="Dropped">❌ Dropped</option>
          </select>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <label htmlFor="timeline" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">⏰</span>
            Timeline
          </label>
          <select
            id="timeline"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="">All Timelines</option>
            <option value="0-3m">⚡ 0-3 months</option>
            <option value="3-6m">📅 3-6 months</option>
            <option value=">6m">📆 More than 6 months</option>
            <option value="Exploring">🔍 Exploring</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label htmlFor="sortBy" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">📋</span>
            Sort By
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="updatedAt">🕒 Last Updated</option>
            <option value="createdAt">📅 Created Date</option>
            <option value="fullName">👤 Name</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <label htmlFor="sortOrder" className="flex items-center text-sm font-medium text-gray-900">
            <span className="mr-2">🔄</span>
            Order
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900"
          >
            <option value="desc">⬇️ Descending</option>
            <option value="asc">⬆️ Ascending</option>
          </select>
        </div>

        {/* Active Filters Count */}
        <div className="flex items-end">
          <div className="w-full bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {[city, propertyType, status, timeline, search, sortBy !== 'updatedAt' ? 1 : 0, sortOrder !== 'desc' ? 1 : 0].filter(Boolean).length}
            </div>
            <div className="text-sm text-gray-800">Active Filters</div>
          </div>
        </div>
      </div>
    </div>
  );
}
