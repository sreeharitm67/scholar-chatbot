import React from "react";
import { BookOpen, Layers, HelpCircle } from "lucide-react";
import { NavTab } from "../types";

interface BrandingHeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function BrandingHeader({ activeTab, setActiveTab }: BrandingHeaderProps) {
  return (
    <header className="w-full shrink-0 flex flex-col">
      {/* Dynamic Top Banner */}
      <div className="w-full py-2 px-4 text-center bg-white/30 backdrop-blur-md border-b border-sky-200/40">
        <span className="text-xs font-semibold tracking-widest uppercase bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 bg-clip-text text-transparent">
          Built by Sreehari Tm
        </span>
      </div>

      {/* Main Branding and Tab Navigation Row */}
      <div className="w-full py-4 px-6 md:px-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sky-100/40 bg-white/10 backdrop-blur-sm">
        {/* Title and Subtitle */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight text-sky-900 leading-tight uppercase font-sans">
            SCHOLAR CHATBOT
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-sky-600 mt-0.5">
            Your friendly AI study helper & easy explainer
          </p>
        </div>

        {/* Top-Right Tab Navigation */}
        <div className="flex items-center self-start sm:self-center bg-slate-100/80 p-1 border border-sky-100/60 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("lecture")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 ${
              activeTab === "lecture"
                ? "bg-sky-500 text-white shadow-md shadow-sky-400/30 font-extrabold"
                : "text-slate-600 hover:text-sky-600"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Lecture</span>
          </button>

          <button
            onClick={() => setActiveTab("summarizer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 ${
              activeTab === "summarizer"
                ? "bg-sky-500 text-white shadow-md shadow-sky-400/30 font-extrabold"
                : "text-slate-600 hover:text-sky-600"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 ${
              activeTab === "quiz"
                ? "bg-sky-500 text-white shadow-md shadow-sky-400/30 font-extrabold"
                : "text-slate-600 hover:text-sky-600"
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Arena</span>
          </button>
        </div>
      </div>
    </header>
  );
}
