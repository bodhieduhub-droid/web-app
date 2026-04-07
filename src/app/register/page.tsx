import { RegisterShell } from "./register-shell";

export const metadata = {
  title: "Enquiry | Bodhi Edu Hub",
  description: "Send an enquiry to Bodhi Edu Hub Reading Hub and get contacted for seat allocation.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const params = await searchParams;

  return <RegisterShell openOnLoad={params.open === "1"} />;
}
