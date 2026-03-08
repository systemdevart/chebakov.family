import { NextRequest, NextResponse } from 'next/server';

const USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'chebakov';
const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'family2024';

export function checkBasicAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin API"' }
      }
    );
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username !== USERNAME || password !== PASSWORD) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  return null; // Auth successful
}
