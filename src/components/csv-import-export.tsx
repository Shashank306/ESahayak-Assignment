'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CsvImportExport() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/buyers/import', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportSuccess(`Successfully imported ${result.successCount} buyers. ${result.errorCount} rows had errors.`);
      
      if (result.errors && result.errors.length > 0) {
        setImportError(`Errors:\n${result.errors.map((e: { row: number; error: string }) => `Row ${e.row}: ${e.error}`).join('\n')}`);
      }

      // Refresh the page to show new data
      router.refresh();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // First check if user is authenticated on client side
      console.log('Checking client-side authentication...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Client session:', session ? `User ${session.user.email}` : 'No session');
      console.log('Client error:', error);
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }
      
      // Build export URL with current filters
      const exportUrl = new URL('/api/buyers/export', window.location.origin);
      
      console.log('Current window location:', window.location.origin);
      console.log('Export URL:', exportUrl.toString());
      
      // Copy all current search parameters to the export URL
      searchParams.forEach((value, key) => {
        exportUrl.searchParams.set(key, value);
      });
      
      console.log('Final export URL:', exportUrl.toString());
      console.log('Exporting with filters:', exportUrl.searchParams.toString());
      
      const response = await fetch(exportUrl.toString(), {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || `Export failed (${response.status})`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buyers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-white to-green-50 rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-lg">📊</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import & Export</h3>
            <p className="text-sm text-gray-800">Manage buyer data with CSV files</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">📥</span>
            <h4 className="text-lg font-medium text-gray-900">Import Buyers</h4>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xl">📄</span>
                </div>
                <div>
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-green-600 hover:text-green-500">
                      Choose CSV file
                    </span>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      aria-label="Choose CSV file to import"
                      aria-describedby="csv-help"
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                  <p className="text-xs text-gray-700 mt-1">or drag and drop</p>
                </div>
              </div>
            </div>

            <div id="csv-help" className="text-xs text-gray-700 space-y-1">
              <p>• Maximum 200 rows per import</p>
              <p>• Required headers: fullName, phone, city, propertyType, purpose, timeline, source</p>
              <p>• Optional: email, bhk, budgetMin, budgetMax, notes, tags, status</p>
            </div>

            {isImporting && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 text-blue-600">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Importing...</span>
                </div>
              </div>
            )}

            {importSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center">
                  <span className="text-green-400 text-sm mr-2">✅</span>
                  <p className="text-sm text-green-800">{importSuccess}</p>
                </div>
              </div>
            )}

            {importError && (
              <div 
                role="alert"
                aria-live="polite"
                className="rounded-lg bg-red-50 border border-red-200 p-3"
              >
                <div className="flex items-start">
                  <span className="text-red-400 text-sm mr-2 mt-0.5" aria-hidden="true">❌</span>
                  <div>
                    <p className="text-sm text-red-800 font-medium">Import Errors</p>
                    <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">{importError}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">📤</span>
            <h4 className="text-lg font-medium text-gray-900">Export Buyers</h4>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-800">
              <p>Export your current filtered buyer list as a CSV file.</p>
              <p className="mt-2">The export will include all visible buyers with their complete information.</p>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              aria-label={isExporting ? "Exporting CSV file, please wait" : "Export current filtered buyers as CSV file"}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <span className="mr-2">📊</span>
                  Export CSV
                </>
              )}
            </button>

            <div className="text-xs text-gray-700 space-y-1">
              <p>• Exports current filtered results</p>
              <p>• Includes all buyer information</p>
              <p>• File format: CSV (Excel compatible)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}