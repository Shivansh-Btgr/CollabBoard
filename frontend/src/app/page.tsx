import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { COOKIE_NAME_JWT_TOKEN } from '@/constants';

export default async function Page() {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get(COOKIE_NAME_JWT_TOKEN);
  
  // Redirect to dashboard if logged in, otherwise to login
  if (jwtToken) {
    redirect('/dashboard');
  } else {
    redirect('/auth/signin');
  }
}
