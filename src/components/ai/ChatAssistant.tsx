'use client';

import { useState, useRef, useEffect } from 'react';
import VoiceRecorder from './VoiceRecorder';
import ProductCard from '../product/ProductCard';
import { Product } from '@/types/Product';
import { useProfileStore } from '@/stores/profileStore';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  products?: Product[];
}

interface ChatResponse {
  reply: string;
  intent: string;
  filters: Record<string, string>;
  products: Product[];
  error?: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { uploadChatImage, uploadingImage } = useProfileStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = input, image: string | null = selectedImage): Promise<void> => {
    if (!text?.trim() && !image) return;

    const userMsg: Message = { 
      role: 'user', 
      text: text || 'Find furniture similar to this image', 
      image: image || undefined 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text || 'Find similar products', imageUrl: image, sessionId })
      });

      const data: ChatResponse = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: data.reply,
          products: data.products
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const result = await uploadChatImage(file);
    if (result.success && result.url) {
      setSelectedImage(result.url);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceInput = (transcript: string): void => {
    setInput(transcript);
    handleSend(transcript);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 group"
          aria-label="Open AI Assistant"
        >
          <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[440px] h-[620px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden backdrop-blur-xl">
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-5 rounded-t-3xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-tight">AI Assistant</h3>
                  <p className="text-xs text-white/80 font-medium">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center py-16 animate-fadeIn">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg transform hover:scale-105 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-bold text-xl text-gray-900 mb-2">How can I assist you?</h4>
                <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">Ask me anything or upload an image to discover similar furniture pieces</p>
                
                <div className="mt-8 grid grid-cols-1 gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => handleSend('Show me modern sofas')}
                    className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <p className="text-sm font-medium text-gray-900">🛋️ Show modern sofas</p>
                  </button>
                  <button
                    onClick={() => handleSend('Find minimalist chairs')}
                    className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <p className="text-sm font-medium text-gray-900">💺 Find minimalist chairs</p>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-md'
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Uploaded" className="rounded-xl mb-3 max-h-48 w-full object-cover shadow-md" />
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.products.map(product => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-slideUp">
                <div className="bg-white rounded-2xl px-5 py-4 border border-gray-200 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {selectedImage && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
              <div className="relative inline-block group">
                <img src={selectedImage} alt="Selected" className="h-24 rounded-xl border-2 border-gray-200 shadow-lg" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:from-red-600 hover:to-pink-700 transition-all shadow-lg hover:scale-110 active:scale-95"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="p-5 border-t border-gray-200 bg-white rounded-b-3xl">
            <div className="flex items-center gap-2.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all disabled:opacity-50 group hover:scale-105 active:scale-95"
                disabled={loading || uploadingImage}
                aria-label="Upload image"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              
              <VoiceRecorder onTranscript={handleVoiceInput} disabled={loading} />
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-gray-400 transition-all"
                disabled={loading}
              />
              
              <button
                onClick={() => handleSend()}
                disabled={loading || (!input.trim() && !selectedImage)}
                className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </>
  );
}