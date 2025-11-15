export class VoiceService {
  private recognition: any;
  private synthesis: SpeechSynthesis | undefined;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-IN';
        this.recognition.maxAlternatives = 1;
      }
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    const setVoices = () => {
      this.voices = this.synthesis!.getVoices();
    };

    setVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = setVoices;
    }
  }

  private getFemaleVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.voices = this.synthesis?.getVoices() || [];
    }

    const femaleVoice = this.voices.find(v => 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('heera') ||
       v.name.toLowerCase().includes('karen')) &&
      v.lang.startsWith('en')
    );

    return femaleVoice || this.voices.find(v => v.lang === 'en-IN' || v.lang === 'en-US') || null;
  }

  startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    this.stopSpeaking();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        onResult(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMsg = 'Voice input failed';
      if (event.error === 'no-speech') errorMsg = 'No speech detected';
      else if (event.error === 'audio-capture') errorMsg = 'Microphone not available';
      else if (event.error === 'not-allowed') errorMsg = 'Microphone permission denied';
      
      onError?.(errorMsg);
    };

    this.recognition.onend = () => {
      // Auto-reset listening state
    };

    try {
      this.recognition.start();
    } catch (err) {
      onError?.('Failed to start voice recognition');
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  speak(text: string) {
    if (!this.synthesis || !text.trim()) return;

    this.synthesis.cancel();

    setTimeout(() => {
      if (!this.synthesis) return;

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      const voice = this.getFemaleVoice();
      if (voice) {
        this.currentUtterance.voice = voice;
      }

      this.currentUtterance.lang = 'en-IN';
      this.currentUtterance.rate = 0.95;
      this.currentUtterance.pitch = 1.1;
      this.currentUtterance.volume = 1;

      this.currentUtterance.onerror = (e) => {
        console.error('Speech error:', e);
        this.currentUtterance = null;
      };

      this.currentUtterance.onend = () => {
        this.currentUtterance = null;
      };

      this.synthesis.speak(this.currentUtterance);
    }, 100);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }
}

export const voiceService = typeof window !== 'undefined' ? new VoiceService() : null;