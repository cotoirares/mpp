"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../../../context/SessionContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { login, user, isLoading } = useSession();

  useEffect(() => {
    // If already authenticated, redirect to home
    if (!isLoading && user) {
      console.log("User already logged in, redirecting to home");
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);
    
    try {
      await login(email, password);
      console.log("Login successful, redirecting to home");
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If checking authentication status, show loading indicator
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If already authenticated, show redirecting message
  if (user) {
    return <div className="flex justify-center items-center h-screen">Already logged in. Redirecting to home...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
          disabled={isLoggingIn}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
          disabled={isLoggingIn}
        />
        <button 
          type="submit" 
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${isLoggingIn ? 'opacity-75 cursor-not-allowed' : ''}`}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
        <div className="mt-4 text-center">
          <a href="/register" className="text-blue-600 hover:underline">Don't have an account? Register</a>
        </div>
      </form>
    </div>
  );
} 