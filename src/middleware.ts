import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Completely disable the middleware for now and let client-side
// authentication handle redirects
export function middleware(request: NextRequest) {
  console.log('[Middleware] Path:', request.nextUrl.pathname);
  
  // Let all requests pass through - we'll handle auth in the components
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 