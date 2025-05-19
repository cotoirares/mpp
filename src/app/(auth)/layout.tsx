import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "../../context/SessionContext";

export const metadata = {
  title: "Tennis App - Authentication",
  description: "Login or register to the Tennis App",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">Tennis App</h1>
        <p className="text-gray-600 mt-2">Manage Tennis Players and Tournaments</p>
      </div>
      {children}
    </div>
  );
} 