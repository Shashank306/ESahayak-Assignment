'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage('Check your email for the login link!');
        setIsSuccess(true);
      }
    } catch {
      setMessage('An error occurred. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white text-2xl font-bold">🏠</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Buyer Lead Intake
          </h2>
          <p className="text-gray-600">
            Enter your email to receive a magic link for secure login
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                <span className="mr-2">📧</span>
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-label="Email address"
                  aria-describedby={message && !isSuccess ? "login-error" : undefined}
                  aria-invalid={!!(message && !isSuccess)}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white ${
                    message && !isSuccess ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">📧</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Magic Link...
                </>
              ) : isSuccess ? (
                <>
                  <span className="mr-2">✅</span>
                  Link Sent!
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Send Magic Link
                </>
              )}
            </button>

            {message && (
              <div 
                id="login-error"
                role="alert"
                aria-live="polite"
                className={`rounded-lg p-4 border ${
                  isSuccess 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`text-xl ${
                      isSuccess ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isSuccess ? '✅' : '⚠️'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isSuccess ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isSuccess ? 'Success!' : 'Error'}
                    </p>
                    <p className={`mt-1 text-sm ${
                      isSuccess ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400 text-xl">📬</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      Next Steps
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      Check your email inbox and click the magic link to sign in. The link will expire in 1 hour.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
