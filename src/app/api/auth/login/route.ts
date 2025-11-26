
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!idToken) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const decodedToken = await auth().verifyIdToken(idToken);
    const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });
    
    cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
    
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
