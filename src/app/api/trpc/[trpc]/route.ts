import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

// TODO: Update the following imports to the correct paths if these files exist
// import { env } from "@/env";
// import { appRouter } from "@/server/api/root";
// import { createTRPCContext } from "@/server/api/trpc";

// The following code is commented out because the required imports are missing.
/*
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tennis-app-backend-1o0q.onrender.com/api';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const response = await fetch(`${API_URL}/api/trpc${url.search}`, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(req.headers),
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("tRPC error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    
    const response = await fetch(`${API_URL}/api/trpc${url.search}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(req.headers),
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("tRPC error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
