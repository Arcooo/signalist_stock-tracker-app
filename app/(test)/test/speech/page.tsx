'use client';

import { useEffect, useRef, useState } from 'react';

// Optional props
type SpeechToTextProps = {
  lang?: string; // e.g. "en-US", "es-ES"
};

export default function SpeechToText({ lang = 'en-US' }: SpeechToTextProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      setTranscript(text);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-2">
        <p>Your browser does not support Speech Recognition (Web Speech API).</p>
        <p>Try Chrome on desktop for best results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <button
        type="button"
        onClick={toggleListening}
        className={`px-4 py-2 rounded-md border text-sm font-medium
          ${isListening ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}
        `}
      >
        {isListening ? 'Stop listening' : 'Start listening'}
      </button>

      <div className="border rounded-md p-3 min-h-[80px] text-sm whitespace-pre-wrap bg-gray-50">
        {transcript || 'Your transcript will appear here...'}
      </div>
    </div>
  );
}