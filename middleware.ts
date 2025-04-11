import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if the request path is for /api or /ai routes
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAiRoute = request.nextUrl.pathname.startsWith('/ai')

  // If the route needs to be protected
  if (isApiRoute || isAiRoute) {
    // Get the access token from cookies
    const accessToken = request.cookies.get('Access')

    // If no access token exists, redirect to login
    if (!accessToken?.value) {
      // Create the URL to redirect to login page
      const loginUrl = new URL('/login', request.url)
      
      // Add the original URL as a parameter to redirect back after login
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      
      // Redirect to the login page
      return NextResponse.redirect(loginUrl)
    }
  }

  // Continue to the route if authenticated or not a protected route
  return NextResponse.next()
}

// Configure the middleware to apply only to specific paths
export const config = {
  matcher: ['/api/:path*', '/ai/:path*'],
} 