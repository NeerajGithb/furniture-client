import { create } from 'zustand';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ChatStore = {
  isOpen: boolean;
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  toggleChat: () => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setListening: (listening: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setAutoSpeak: (enabled: boolean) => void;
  clearMessages: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  isListening: false,
  voiceEnabled: false,
  autoSpeak: false,
  
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }]
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setListening: (listening) => set({ isListening: listening }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setAutoSpeak: (enabled) => set({ autoSpeak: enabled }),
  clearMessages: () => set({ messages: [] })
}));