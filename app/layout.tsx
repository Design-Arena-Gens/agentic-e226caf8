import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Robot Arm IK",
  description: "Interactive robot arm inverse kinematics demo"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
