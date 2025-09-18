
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  cookies().set('session', '', { maxAge: -1 });
  return NextResponse.json({ status: 'success' }, { status: 200 });
}
