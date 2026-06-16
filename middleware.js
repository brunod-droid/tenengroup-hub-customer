import { NextResponse } from 'next/server';

function decodeBase64(value) {
  return atob(value);
}

export function middleware(request) {
  const auth = request.headers.get('authorization');
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;

  if (auth) {
    const token = auth.split(' ')[1] || '';
    const [user, pass] = decodeBase64(token).split(':');

    if (user === username && pass === password) {
      return NextResponse.next();
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected Site"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
