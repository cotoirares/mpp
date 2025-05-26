import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennis-app-backend-1o0q.onrender.com/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header required" },
        { status: 401 }
      );
    }

    // Forward the request to your backend
    const response = await fetch(`${API_URL}/api/auth/2fa/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Return the response from the backend
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 