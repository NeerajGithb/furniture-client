'use client';

import { Message } from "@/stores/chat-store";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 ${
          isUser
            ? 'bg-black text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <span className={`text-[10px] mt-1.5 block ${
          isUser ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {message.timestamp.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}