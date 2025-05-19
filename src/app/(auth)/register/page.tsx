"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../../../context/SessionContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useSession();

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
    setSuccess(false);
    setIsRegistering(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      
      setSuccess(true);
      console.log("Registration successful, redirecting to login");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Registration failed");
    } finally {
      setIsRegistering(false);
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
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">Registration successful! Redirecting...</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
          disabled={isRegistering || success}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
          disabled={isRegistering || success}
        />
        <button 
          type="submit" 
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 ${(isRegistering || success) ? 'opacity-75 cursor-not-allowed' : ''}`}
          disabled={isRegistering || success}
        >
          {isRegistering ? 'Registering...' : 'Register'}
        </button>
        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">Already have an account? Login</a>
        </div>
      </form>
    </div>
  );
} 