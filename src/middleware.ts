
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from './lib/firebase/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // If trying to access admin routes
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      // Verify the session cookie. This throws an error if it's not valid.
      await auth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      // Session cookie is invalid. Redirect to login page.
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear the invalid cookie
      response.cookies.set('session', '', { maxAge: -1 });
      return response;
    }
  }

  // If logged in, redirect from login page to admin
  if (pathname === '/login' && sessionCookie) {
     try {
      await auth().verifySessionCookie(sessionCookie, true);
      return NextResponse.redirect(new URL('/admin', request.url));
    } catch (error) {
       // Invalid cookie, let them stay on login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
