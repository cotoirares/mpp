import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { User } from "@/backend/models/user.model";
import { UserRole } from "@/types/user";
import connectDB from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create a response
    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role as UserRole
      },
      token
    });
    
    // Set cookie in the response
    response.cookies.set("token", token, {
      httpOnly: false, // Set to false so middleware can access it
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 