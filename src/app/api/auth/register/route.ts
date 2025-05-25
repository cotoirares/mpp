import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennis-app-backend-1o0q.onrender.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to your backend
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // Return the response from the backend
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 