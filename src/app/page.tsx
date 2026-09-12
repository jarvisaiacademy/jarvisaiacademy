"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { useSidebar } from "@/hooks/use-sidebar";

export default function Home() {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => setIsLoginOpen(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100 font-sans selection:bg-[#9d5932] selection:text-white">
      {/* Animated Collapsible Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onToggle={toggle}
        isMobile={isMobile}
      />


      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-black relative">
        <GuestHeader
          sidebarOpen={isOpen}
          onToggleSidebar={toggle}
          onOpenLogin={handleOpenLogin}
        />

        <ChatCanvas />
      </main>

      {/* Reusable Login / Signup Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={handleCloseLogin}
        onSuccess={() => {
          console.log("Logged in successfully");
          setIsLoginOpen(false);
        }}
      />
    </div>
  );
}
