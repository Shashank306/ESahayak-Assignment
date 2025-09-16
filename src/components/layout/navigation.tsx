'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/loading';

export default function Navigation() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Check user role
          try {
            const response = await fetch(`/api/admin/check-user?email=${session.user.email}`);
            console.log('Role check response status:', response.status);
            
            if (response.ok) {
              const userData = await response.json();
              console.log('User role check result:', userData);
              
              if (userData.found && userData.user) {
                setUserRole(userData.user.role);
              } else {
                console.log('User not found in database, defaulting to user role');
                setUserRole('user');
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              console.error('Failed to check user role:', response.status, errorData);
              setUserRole('user'); // Default to user role on error
            }
          } catch (fetchError) {
            console.error('Error fetching user role:', fetchError);
            setUserRole('user'); // Default to user role on error
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          getUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Buyers', href: ROUTES.BUYERS },
    { name: 'New Lead', href: ROUTES.NEW_BUYER },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: '🛡️' },
    { name: 'Set Admin', href: ROUTES.SET_ADMIN, icon: '👑' },
  ];

  // Only show admin items if user is admin
  const allNavItems = userRole === 'admin' ? [...navItems, ...adminItems] : navItems;

  // Debug logging
  console.log('Navigation state:', { userRole, allNavItems: allNavItems.length, isAdmin: userRole === 'admin' });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href={ROUTES.BUYERS} 
              className="flex items-center space-x-2"
              aria-label="Go to buyers page"
            >
              <span className="text-2xl" aria-hidden="true">🏠</span>
              <span className="text-xl font-bold text-gray-900">Buyer Lead Intake</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {allNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.icon 
                      ? 'text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  aria-label={`Go to ${item.name}`}
                  aria-current={typeof window !== 'undefined' && window.location.pathname === item.href ? 'page' : undefined}
                >
                  <span className="flex items-center space-x-1">
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.name}</span>
                  </span>
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2"
                aria-label="Toggle mobile menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {userRole === 'admin' ? (
                    <>
                      <span className="text-lg" aria-hidden="true">🛡️</span>
                      <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                        Admin
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  aria-label="Sign out"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSignOut();
                    }
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {allNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.icon 
                    ? 'text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={`Go to ${item.name}`}
              >
                <span className="flex items-center space-x-2">
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.name}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
