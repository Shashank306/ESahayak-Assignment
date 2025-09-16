'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    console.log('=== AUTH CALLBACK PAGE LOADED ===');
    console.log('Current URL:', window.location.href);
    console.log('Hash:', window.location.hash);
    
    const handleAuth = async () => {
      try {
        setStatus('Processing authentication...');
        console.log('Processing authentication...');
        
        // Wait a bit for Supabase to process the URL
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/auth/login?error=Authentication failed';
          }, 2000);
          return;
        }
        
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
          setStatus('Authentication successful! Redirecting...');
          console.log('About to redirect to /buyers');
          
          // Use a longer delay to ensure the redirect happens
          setTimeout(() => {
            console.log('Redirecting now...');
            window.location.href = '/buyers';
          }, 2000);
        } else {
          console.log('No session found');
          setStatus('No session found. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/auth/login?error=No session found';
          }, 2000);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('Authentication error. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/auth/login?error=Authentication error';
        }, 2000);
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we verify your identity</p>
        <p className="mt-2 text-xs text-gray-400">Check console for debug info</p>
      </div>
    </div>
  );
}