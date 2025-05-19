"use client";
import Link from "next/link";
import { useSession } from "../context/SessionContext";

export default function Navbar() {
  const { user, logout } = useSession();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">Tennis App</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <>
                <span className="mr-4 text-gray-600">Welcome, {user.email}</span>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-4"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 