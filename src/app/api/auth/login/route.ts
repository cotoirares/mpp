import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennis-app-backend-1o0q.onrender.com/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward the request to your backend
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    // If successful, handle cookies
    if (response.ok) {
      const nextResponse = NextResponse.json(data, {
        status: response.status,
      });
      
      // Set token in cookie if it exists in the response
      if (data.token) {
        nextResponse.cookies.set("token", data.token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 // 24 hours
        });
      }
      
      return nextResponse;
    }
    
    // Return error response as is
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 