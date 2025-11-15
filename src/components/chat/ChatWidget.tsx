"use client";

import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import ChatWindow from "./ChatWindow";
import ChatHandler from "./ChatHandler";

export default function ChatWidget() {
  const { isOpen, toggleChat } = useChatStore();

  return (
    <>
      <ChatHandler />
      {isOpen && <ChatWindow />}

      <button
        onClick={toggleChat}
        className={`fixed bottom-5 right-5 h-12 w-12 flex items-center justify-center rounded-full z-[9999] transition-all
          backdrop-blur-md shadow-[0_4px_18px_rgba(0,0,0,0.25)]
          ${isOpen ? "bg-black/90 hover:bg-black" : "bg-black/80 hover:bg-black"}
        `}
      >
        {isOpen ? <X size={18} className="text-white" /> : <MessageCircle size={20} className="text-white" />}
      </button>
    </>
  );
}
