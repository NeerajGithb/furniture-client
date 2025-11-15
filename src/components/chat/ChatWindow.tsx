"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Settings, Trash2, Volume2, VolumeX, Mic, AlertCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";
import VoiceButton from "./VoiceButton";
import { useChatStore } from "@/stores/chat-store";
import { voiceService } from "@/lib/chat/voice-service";

export default function ChatWindow() {
  const {
    messages,
    isLoading,
    toggleChat,
    clearMessages,
    voiceEnabled,
    autoSpeak,
    setVoiceEnabled,
    setAutoSpeak,
    addMessage,
    setLoading
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'assistant' && autoSpeak && voiceService) {
      if (lastSpokenRef.current !== lastMessage.id) {
        voiceService?.stopSpeaking();
        setTimeout(() => {
          voiceService?.speak(lastMessage.content);
          lastSpokenRef.current = lastMessage.id;
        }, 200);
      }
    }
  }, [messages, autoSpeak]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError("");
    voiceService?.stopSpeaking();

    addMessage({ role: "user", content: text });
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      addMessage({
        role: "assistant",
        content: data.response || "I didn't understand that. Try asking differently."
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Connection error";
      setError(errorMsg);
      addMessage({
        role: "assistant",
        content: "I'm having trouble right now. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    voiceService?.stopSpeaking();
    lastSpokenRef.current = "";
    clearMessages();
    setError("");
  };

  return (
    <div className="
      fixed bottom-20 right-4 
      w-[330px] h-[480px]
      rounded-2xl overflow-hidden flex flex-col z-[9999]
      bg-white/80 backdrop-blur-xl border border-white/30
      shadow-[0_8px_32px_rgba(0,0,0,0.18)]
      animate-[fadeIn_0.25s_ease-out]
    ">
      <div className="bg-black/90 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <p className="text-[10px] opacity-70 leading-none">Here to help</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded-md hover:bg-white/20 transition"
            aria-label="Settings"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={toggleChat}
            className="p-1 rounded-md hover:bg-white/20 transition"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white px-3 py-3 border-b border-gray-200 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="font-medium">Voice Input</span>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative w-10 h-5 rounded-full transition ${
                voiceEnabled ? "bg-black" : "bg-gray-300"
              }`}
              aria-label="Toggle voice input"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                voiceEnabled ? "translate-x-5" : ""
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mic size={14} />
              <span className="font-medium">Auto Speak</span>
            </div>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`relative w-10 h-5 rounded-full transition ${
                autoSpeak ? "bg-black" : "bg-gray-300"
              }`}
              aria-label="Toggle auto speak"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                autoSpeak ? "translate-x-5" : ""
              }`} />
            </button>
          </div>

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded-md font-semibold transition"
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-2 flex items-start gap-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic size={20} className="text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-700">Start a conversation</p>
            <p className="text-[11px] opacity-80">Try: "How many sofas available?"</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex mb-3">
            <div className="bg-gray-100 rounded-xl px-3 py-2">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100"
            disabled={isLoading}
            maxLength={500}
          />

          {voiceEnabled && (
            <VoiceButton onTranscript={(text) => sendMessage(text)} />
          )}

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-300 text-xs transition"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}