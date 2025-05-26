"use client";
import { useSession } from "@/context/SessionContext";
import TwoFactorSettings from "@/components/TwoFactorSettings";

export default function SettingsPage() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Please log in to access settings.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Role:</span> {user.role}</p>
            <p><span className="font-semibold">2FA Status:</span> {user.twoFactorEnabled ? 
              <span className="text-green-600">Enabled</span> : 
              <span className="text-red-600">Disabled</span>
            }</p>
          </div>
        </div>
        
        <TwoFactorSettings />
      </div>
    </div>
  );
} 