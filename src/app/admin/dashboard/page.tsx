'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';   


export default function AdminDashboard() {
  // const [user, setUser] = useState(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Get current user from Supabase
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error || !supabaseUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setUser(supabaseUser);

      // Check user role in our database
      const response = await fetch(`/api/admin/check-user?email=${supabaseUser.email}`);
      const data = await response.json();
      
      if (data.found) {
        setUserRole(data.user.role);
      } else {
        setUserRole('not_found');
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Not Logged In</h2>
            <p className="mt-2 text-gray-600">Please log in to access admin features</p>
            <Link 
              href="/auth/login" 
              className="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          
          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1">
                    {userRole === 'admin' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🛡️ Admin
                      </span>
                    ) : userRole === 'user' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        👤 User
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ❓ Unknown
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userRole === 'admin' ? '✅ Full Access' : '🔒 Limited Access'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Features */}
          {userRole === 'admin' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Edit Any Buyer</h3>
                  <p className="text-sm text-green-600 mt-1">Can edit buyers created by any user</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Delete Any Buyer</h3>
                  <p className="text-sm text-green-600 mt-1">Can delete buyers created by any user</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Manage Users</h3>
                  <p className="text-sm text-green-600 mt-1">Can set other users as admin</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Export All Data</h3>
                  <p className="text-sm text-green-600 mt-1">Can export all buyers with filters</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">Import Data</h3>
                  <p className="text-sm text-green-600 mt-1">Can import CSV files</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800">View All Buyers</h3>
                  <p className="text-sm text-green-600 mt-1">Can see buyers from all users</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/buyers" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              View Buyers
            </Link>
            {userRole === 'admin' && (
              <Link 
                href="/admin/set-admin" 
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Manage Admins
              </Link>
            )}
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
