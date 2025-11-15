import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';
import { voiceService } from '@/lib/chat/voice-service';
import { useChatStore } from '@/stores/chat-store';

export default function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { isListening, setListening } = useChatStore();
  const [error, setError] = useState('');

  const toggleVoice = () => {
    if (!voiceService) {
      setError('Voice not supported');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setListening(false);
      setError('');
    } else {
      setListening(true);
      setError('');
      
      voiceService.startListening(
        (text) => {
          if (text.trim()) {
            onTranscript(text);
          }
          setListening(false);
          setError('');
        },
        (errorMsg) => {
          setError(errorMsg);
          setListening(false);
          setTimeout(() => setError(''), 3000);
        }
      );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleVoice}
        className={`px-3 py-2 rounded-md transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        aria-label={isListening ? 'Stop voice' : 'Start voice'}
      >
        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
      
      {error && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}