import React, { useEffect, useState } from "react";
import { Volume2, Square, Headphones, HelpCircle } from "lucide-react";

interface VoiceControlRibbonProps {
  textToSpeak: string;
  onActiveTab: string;
}

export default function VoiceControlRibbon({ textToSpeak, onActiveTab }: VoiceControlRibbonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop reading if tab changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [onActiveTab]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      // Exhaustive clean to remove markup tags/symbols to prevent stuttering
      const strippedText = textToSpeak
        .replace(/[#*`_~\-+>\[\]()|]/g, " ") // replace markdown characters
        .replace(/\\n/g, " ")                // remove escaped newlines
        .replace(/\s+/g, " ")                // normalize spaces
        .trim();

      if (!strippedText) return;

      const utterance = new SpeechSynthesisUtterance(strippedText);
      utterance.lang = "en-US";

      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-sky-100/40 bg-sky-50/20 backdrop-blur-md rounded-t-2xl">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 tracking-wide uppercase">
        <Headphones className="w-3.5 h-3.5" />
        Read Aloud
      </div>
      
      <div className="flex items-center gap-2">
        {isPlaying && (
          <span className="hidden sm:inline-block text-[10px] text-sky-600 font-medium animate-pulse">
            Reading aloud now...
          </span>
        )}
        <button
          onClick={togglePlayback}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 ${
            isPlaying
              ? "bg-sky-500/10 border-sky-400 text-sky-700 animate-pulse-border shadow-[0_0_12px_rgba(14,165,233,0.2)]"
              : "bg-white/60 border-sky-200/50 hover:bg-sky-100/30 text-slate-700"
          }`}
          title={isPlaying ? "Stop Reading" : "Read Aloud"}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-sky-600 stroke-none" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
