'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { executeAction } from '@/lib/chat/action-executor';
import { voiceService } from '@/lib/chat/voice-service';
import { useChatStore } from '@/stores/chat-store';
import { useProductStore } from '@/stores/productStore';

export default function ChatHandler() {
  const router = useRouter();
  const { messages, autoSpeak } = useChatStore();

  // ✅ Pull real categories from store / API
  const { categories, subcategories } = useProductStore();

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage?.role === 'assistant') {
      const checkForIntent = async () => {
        try {
          const userMessage = messages[messages.length - 2];
          if (!userMessage) return;

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage.content,
              history: messages.slice(0, -1).map(m => ({ 
                role: m.role, 
                content: m.content 
              }))
            })
          });

          const data = await response.json();
          
          if (data.intent) {
            executeAction(
              data.intent,
              router,
              categories,       // ✅ Pass categories from DB
              subcategories     // ✅ Pass subcategories from DB
            );
          }

          if (voiceService && autoSpeak) {
            voiceService.speak(lastMessage.content);
          }
        } catch (error) {
          console.error('Action execution error:', error);
        }
      };

      checkForIntent();
    }
  }, [messages, router, autoSpeak, categories, subcategories]);

  return null;
}
