"use client";

import { RegisterForm } from "./register-form";
import { AuthShell } from "@/components/auth/auth-shell";

export function RegisterShell() {
  return (
    <AuthShell maxWidth="max-w-[32rem]">
      <RegisterForm />
    </AuthShell>
  );
}

