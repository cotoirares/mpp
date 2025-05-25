import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    return NextResponse.json({
      message: "Register API endpoint - Please deploy backend separately",
      status: "not implemented"
    }, { status: 501 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 