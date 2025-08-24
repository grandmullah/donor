import type { Metadata } from "next";
import "./globals.css";
import Web3Provider from "@/components/Web3Provider";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Blood Donor System - Rare Blood Donor Portal",
  description:
    "A blockchain-powered platform that rewards donors and saves lives through transparent, privacy-focused blood donation management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <Header />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(20px)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#667eea",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
