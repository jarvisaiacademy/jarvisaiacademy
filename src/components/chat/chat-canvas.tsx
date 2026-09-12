"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { PromptCapsule } from "./prompt-capsule";

const sampleConversation: ChatMessage[] = [
  {
    id: "sample-user-1",
    role: "user",
    content: "hii am new here my age is 90yo",
  },
  {
    id: "sample-ai-1",
    role: "assistant",
    content:
      "Hi! 😊 It’s lovely to meet you. Welcome!\n\nWhether you’re 90 or simply having a little fun with me, you’re very welcome here. I can help with things like answering questions, explaining technology, writing messages, telling stories, learning new things, or just having a conversation.\n\nWhat would you like to do today? 🌷",
  },
];

const topicResponses: Record<string, string> = {
  courses:
    "Here are the flagship programs offered at **Jarvis AI Academy**:\n\n1. **Frontend Engineering**: HTML5, CSS3, JavaScript, Tailwind CSS, and React JS.\n2. **Backend Engineering**: Python, FastAPI, Django, REST APIs, and Authentication.\n3. **Database Engineering**: MySQL, PostgreSQL, and MongoDB.\n4. **Full-Stack AI Integration**: End-to-end web apps with LLMs, agentic workflows, and cloud deployment.\n\nWhich technology stack interests you the most?",
  super10:
    "⚡ **Super10 Elite Batch** is our signature, high-intensity career transition program.\n\n- **Batch Size**: Strictly limited to 10 candidates.\n- **Focus**: Live industry projects, personalized 1-on-1 code reviews, and mock technical interviews.\n- **Outcome**: 100% Job Placement Guarantee with hiring partners in Pune and remote.\n\nWould you like to check your eligibility for the upcoming batch?",
  testimonials:
    "🏆 **Student Success Stories & Placements**:\n\nOur alumni have secured developer roles across leading tech companies:\n- *\"Transitioned from non-tech to Full Stack Developer in 5 months. The 1-on-1 mentorship made all the difference!\"* — **Pooja S.**\n- *\"The Super10 program helped me crack a 12 LPA backend engineering offer!\"* — **Rahul M.**\n\nWould you like to read more reviews or see recent placement packages?",
  certificate:
    "🛡️ **Certificate Verification**:\n\nEvery graduate from **Jarvis AI Academy** receives a cryptographically verifiable digital certificate with a unique credential ID.\n\nEmployers can instantly verify credentials by entering the Certificate ID at our verification portal. Do you have a certificate ID you would like to verify right now?",
  enquiry:
    "📞 **Admissions & Counselor Connect**:\n\nOur academic counselors are available to guide you on your tech journey:\n- **Phone**: +91 84828 31723\n- **Location**: Pune, Maharashtra, India\n- **Hours**: Mon – Sat, 9:00 AM – 7:00 PM IST\n\nFeel free to share what career goals you have, and I can also connect you with our lead instructor!",
};

interface ChatCanvasProps {
  onAttach?: () => void;
  onVoiceStart?: () => void;
  activeTopic?: string | null;
  onTopicHandled?: () => void;
  resetSignal?: number;
}

export function ChatCanvas({
  onAttach,
  onVoiceStart,
  activeTopic,
  onTopicHandled,
  resetSignal,
}: ChatCanvasProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleConversation);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handle New Chat reset
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setMessages([]);
    }
  }, [resetSignal]);

  // Handle topic click from sidebar
  useEffect(() => {
    if (activeTopic) {
      const topicPrompts: Record<string, string> = {
        courses: "Tell me about the available courses at Jarvis AI Academy",
        super10: "What is the Super10 Elite Batch and how can I qualify?",
        testimonials: "Show me student reviews and placement testimonials",
        certificate: "How do I verify a certificate issued by Jarvis AI Academy?",
        enquiry: "I'd like to get in touch with an admissions counselor",
      };

      const userText = topicPrompts[activeTopic] || `Tell me about ${activeTopic}`;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      const replyContent =
        topicResponses[activeTopic] ||
        `Here is information about **${activeTopic}** at Jarvis AI Academy. How can I assist you further?`;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now() + 1}`,
        role: "assistant",
        content: replyContent,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      onTopicHandled?.();
    }
  }, [activeTopic, onTopicHandled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptSubmit = (prompt: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulated contextual AI reply
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let reply = `I'd love to help you with "${prompt}"! Let's explore that together. Is there any specific area you'd like to dive into first?`;

      if (lower.includes("course") || lower.includes("learn") || lower.includes("fees")) {
        reply = topicResponses.courses;
      } else if (lower.includes("super10") || lower.includes("batch")) {
        reply = topicResponses.super10;
      } else if (lower.includes("placement") || lower.includes("job") || lower.includes("review")) {
        reply = topicResponses.testimonials;
      } else if (lower.includes("certificate") || lower.includes("verify")) {
        reply = topicResponses.certificate;
      } else if (lower.includes("contact") || lower.includes("counselor") || lower.includes("enquiry")) {
        reply = topicResponses.enquiry;
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <ChatMessages messages={messages} />
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Sticky Bottom Prompt Capsule */}
      <div className="w-full px-4 pb-4 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent shrink-0">
        <PromptCapsule
          onSubmit={handlePromptSubmit}
          onAttach={onAttach}
          onVoiceStart={onVoiceStart}
          placeholder="Ask ChatGPT"
          showThink={false}
        />
      </div>
    </div>
  );
}
