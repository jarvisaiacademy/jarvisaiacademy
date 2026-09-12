"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";

export default function Home() {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => setIsLoginOpen(false);

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100 font-sans selection:bg-[#9d5932] selection:text-white">
        {/* Animated Collapsible Sidebar */}
        <Sidebar
          isOpen={isOpen}
          onToggle={toggle}
          isMobile={isMobile}
          onSelectSection={(topic) => setActiveTopic(topic)}
          onNewChat={() => setResetSignal((prev) => prev + 1)}
        />

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col h-screen min-w-0 bg-black relative">
          <GuestHeader
            sidebarOpen={isOpen}
            onToggleSidebar={toggle}
            onOpenLogin={handleOpenLogin}
          />

          <ChatCanvas
            activeTopic={activeTopic}
            onTopicHandled={() => setActiveTopic(null)}
            resetSignal={resetSignal}
          />
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
    </ToastProvider>
  );
}
