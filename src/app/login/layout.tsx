import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Bodhi Edu Hub",
  description: "Log in to your Bodhi Edu Hub account to access your student portal, seat allocation, and attendance tracking.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
