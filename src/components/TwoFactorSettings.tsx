"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/context/SessionContext";
import toast from "react-hot-toast";

export default function TwoFactorSettings() {
  const { user, token } = useSession();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const setup2FA = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to setup 2FA");
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setBackupCodes(data.backupCodes);
      setShowSetup(true);
      toast.success("2FA setup initiated. Scan the QR code with your authenticator app.");
    } catch (error: any) {
      toast.error(error.message || "Failed to setup 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async () => {
    if (!token || !verificationCode) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to enable 2FA");
      }

      toast.success("2FA enabled successfully!");
      setShowSetup(false);
      setVerificationCode("");
      // Refresh the page to update user state
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!token || !verificationCode) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to disable 2FA");
      }

      toast.success("2FA disabled successfully!");
      setShowDisable(false);
      setVerificationCode("");
      // Refresh the page to update user state
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to manage 2FA settings.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Status: {user.twoFactorEnabled ? (
            <span className="text-green-600 font-semibold">Enabled</span>
          ) : (
            <span className="text-red-600 font-semibold">Disabled</span>
          )}
        </p>
        <p className="text-sm text-gray-500">
          Two-factor authentication adds an extra layer of security to your account.
        </p>
      </div>

      {!user.twoFactorEnabled && !showSetup && (
        <button
          onClick={setup2FA}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Setting up..." : "Enable 2FA"}
        </button>
      )}

      {user.twoFactorEnabled && !showDisable && (
        <button
          onClick={() => setShowDisable(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Disable 2FA
        </button>
      )}

      {showSetup && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto mb-4" />
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              2. Enter the 6-digit code from your authenticator app:
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              maxLength={6}
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              3. Save these backup codes in a safe place:
            </p>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={enable2FA}
              disabled={isLoading || !verificationCode}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Enabling..." : "Enable 2FA"}
            </button>
            <button
              onClick={() => {
                setShowSetup(false);
                setVerificationCode("");
                setQrCodeUrl("");
                setBackupCodes([]);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDisable && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Disable Two-Factor Authentication</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Enter a 6-digit code from your authenticator app or use a backup code:
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code or backup code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={disable2FA}
              disabled={isLoading || !verificationCode}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </button>
            <button
              onClick={() => {
                setShowDisable(false);
                setVerificationCode("");
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 