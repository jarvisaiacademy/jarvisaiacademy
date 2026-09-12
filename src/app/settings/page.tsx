"use client";

import { useRouter } from "next/navigation";
import { SettingsPage } from "@/components/settings/settings-page";

export default function SettingsRoute() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return <SettingsPage onBack={handleBack} />;
}
