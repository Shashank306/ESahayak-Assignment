import { createServerSupabaseClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/buyers');
  }

  return <LoginForm />;
}
