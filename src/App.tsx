import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  User, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Compass, 
  Clock, 
  ArrowRight,
  Image as ImageIcon,
  Camera as CameraIcon,
  FileText as FileIcon
} from "lucide-react";
import BrandingHeader from "./components/BrandingHeader";
import VoiceControlRibbon from "./components/VoiceControlRibbon";
import { 
  UploadedFile, 
  TeachingPersona, 
  LectureResponse, 
  SummarizeResponse, 
  QuizQuestion, 
  NavTab, 
  QuizMode 
} from "./types";

export default function App() {
  // Navigation & General state
  const [activeTab, setActiveTab] = useState<NavTab>("lecture");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Tab A states: Lecture
  const [teachingPersona, setTeachingPersona] = useState<TeachingPersona>("simple");
  const [lectureResponse, setLectureResponse] = useState<LectureResponse | null>(null);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState<boolean>(false);
  const [lectureError, setLectureError] = useState<string | null>(null);

  // Tab B states: Summarizer
  const [summarizeResponse, setSummarizeResponse] = useState<SummarizeResponse | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  // Tab C states: Quiz Arena
  const [quizMode, setQuizMode] = useState<QuizMode>("solo");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Active quiz gameplay state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [scores, setScores] = useState({ solo: 0, playerA: 0, playerB: 0 });
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<"playerA" | "playerB">("playerA");
  const [quizDone, setQuizDone] = useState<boolean>(false);
  const [scorePulse, setScorePulse] = useState<boolean>(false);

  // Input file triggers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Handle all synthetic audio voice cancel triggers
  const stopAudioSpeech = () => {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.log("Speech cancel error:", e);
    }
  };

  // Change tabs seamlessly
  const handleTabChange = (tab: NavTab) => {
    stopAudioSpeech();
    setActiveTab(tab);
  };

  // Input file processing unified helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase();
      const validExtensions = ["pdf", "txt", "md", "png", "jpg", "jpeg", "webp"];
      if (extension && !validExtensions.includes(extension)) {
        alert("Unsupported format. Please upload PDF, TXT, MD, or an Image.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile({
          name: file.name,
          mimeType: file.type || `application/${extension || "octet-stream"}`,
          data: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ----------------------------------------------------------------
  // Unified Action Handler for Teach Me
  // ----------------------------------------------------------------
  const handleTeachMe = () => {
    stopAudioSpeech();

    if (activeTab === "lecture") {
      generateLecture();
    } else if (activeTab === "summarizer") {
      generateSummary();
    } else if (activeTab === "quiz") {
      generateQuiz();
    }
  };

  // ----------------------------------------------------------------
  // API Call triggers
  // ----------------------------------------------------------------
  const generateLecture = async () => {
    if (!customPrompt && !uploadedFile) {
      setLectureError("Please type a topic or question, or add a file first.");
      return;
    }
    setLectureError(null);
    setIsGeneratingLecture(true);
    setLectureResponse(null);

    try {
      const response = await fetch("/api/lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: customPrompt,
          file: uploadedFile,
          persona: teachingPersona
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We ran into an issue making your lesson.");
      }
      setLectureResponse(data);
    } catch (err: any) {
      setLectureError(err?.message || "Something went wrong. Let's try again!");
    } finally {
      setIsGeneratingLecture(false);
    }
  };

  const generateSummary = async () => {
    if (!customPrompt && !uploadedFile) {
      setSummarizeError("Please type a topic or add a file first.");
      return;
    }
    setSummarizeError(null);
    setIsGeneratingSummary(true);
    setSummarizeResponse(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: customPrompt,
          file: uploadedFile
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We ran into an issue making your summary.");
      }
      setSummarizeResponse(data);
    } catch (err: any) {
      setSummarizeError(err?.message || "Something went wrong. Let's try again!");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateQuiz = async () => {
    if (!customPrompt && !uploadedFile) {
      setQuizError("Please type a topic or add a file first to build a quiz.");
      return;
    }
    setQuizError(null);
    setIsGeneratingQuiz(true);
    setQuizQuestions([]);
    setQuizDone(false);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: customPrompt,
          file: uploadedFile
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We ran into an issue making your quiz.");
      }
      
      if (Array.isArray(data) && data.length > 0) {
        setQuizQuestions(data);
        // Reset scores
        setScores({ solo: 0, playerA: 0, playerB: 0 });
        setCurrentPlayerTurn("playerA");
      } else {
        throw new Error("We received an unexpected quiz layout. Please try again.");
      }
    } catch (err: any) {
      setQuizError(err?.message || "Failed to create your questions. Let's try again!");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // ----------------------------------------------------------------
  // Interactive Quiz Game Rules
  // ----------------------------------------------------------------
  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(index);
  };

  const submitQuizAnswer = () => {
    if (selectedOptionIndex === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOptionIndex === question.correctIndex;

    // Trigger score pulse visual
    setScorePulse(true);
    setTimeout(() => setScorePulse(false), 600);

    // Update score
    if (quizMode === "solo") {
      if (isCorrect) {
        setScores(prev => ({ ...prev, solo: prev.solo + 10 }));
      }
    } else {
      // Brother VS Mode
      if (currentPlayerTurn === "playerA") {
        if (isCorrect) {
          setScores(prev => ({ ...prev, playerA: prev.playerA + 10 }));
        }
      } else {
        if (isCorrect) {
          setScores(prev => ({ ...prev, playerB: prev.playerB + 10 }));
        }
      }
    }
  };

  const proceedNextQuestion = () => {
    // Alternate turn for VS Mode
    if (quizMode === "vs") {
      setCurrentPlayerTurn(prev => prev === "playerA" ? "playerB" : "playerA");
    }

    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizDone(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScores({ solo: 0, playerA: 0, playerB: 0 });
    setCurrentPlayerTurn("playerA");
    setQuizDone(false);
  };

  // Stop synthetic audio on tab navigate or unmount
  useEffect(() => {
    stopAudioSpeech();
    return () => {
      stopAudioSpeech();
    };
  }, [activeTab]);

  // ----------------------------------------------------------------
  // Helper Renders for Active Panels
  // ----------------------------------------------------------------
  
  const renderLectureContent = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Ambient output voice block */}
        {lectureResponse && (
          <VoiceControlRibbon 
            textToSpeak={`Lesson: ${lectureResponse.moduleTitle}. Explanation: ${lectureResponse.explanation}. Takeaway: ${lectureResponse.keyTakeaway}`} 
            onActiveTab={activeTab} 
          />
        )}

        {/* Core display Area */}
        <div className="p-5 space-y-6">
          {lectureError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col gap-1.5 shadow-sm">
              <strong className="font-bold">Error:</strong>
              <span>{lectureError}</span>
            </div>
          )}

          {lectureResponse && (
            <div className="space-y-6 animate-fade-in">
              {/* Title block */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50/70 to-white border border-sky-200/50 shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">Active Study Topic</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                  {lectureResponse.moduleTitle}
                </h2>
                <div className="flex gap-4 mt-3 pt-3 border-t border-sky-100 text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sky-500" /> 5 Min Read</span>
                  <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-sky-500" /> Universal Tutor</span>
                </div>
              </div>

              {/* Core explanation */}
              <div className="p-6 rounded-2xl bg-white border border-sky-100/80 leading-relaxed text-sm sm:text-base text-slate-700 space-y-4 shadow-sm font-sans">
                <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase tracking-widest block mb-2">Lesson Material</span>
                <div className="whitespace-pre-line text-slate-700 leading-relaxed text-sm sm:text-base">
                  {lectureResponse.explanation}
                </div>
              </div>

              {/* Key Takeaway Banner */}
              <div className="p-6 rounded-2xl border-l-8 border-emerald-500 bg-emerald-50/40 backdrop-blur-md shadow-sm">
                <div className="flex gap-3 items-start">
                  <Sparkles className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Key Benefit</span>
                    <p className="text-sm sm:text-base font-medium text-slate-800 mt-1 italic">
                      "{lectureResponse.keyTakeaway}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Lesson Status Dashboard */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-sky-100 bg-white shadow-sm font-sans">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Study Pace Tone</p>
                  <p className="text-sm font-bold text-slate-700 mt-1 capitalize">
                    {teachingPersona === "simple" ? "Stories & Analogies" : teachingPersona === "fast" ? "Accelerated Outline" : "Deep Dive Synthesis"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-sky-100 bg-white shadow-sm flex items-center justify-between font-sans">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Regional Restrictions</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">None (Universal Expert)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSummaryContent = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Speech Control Ribbon */}
        {summarizeResponse && (
          <VoiceControlRibbon 
            textToSpeak={`Overview: ${summarizeResponse.overview}. Key facts to note: ${summarizeResponse.bulletPoints.join(". ")}. Takeaway: ${summarizeResponse.mainTakeaway}`} 
            onActiveTab={activeTab} 
          />
        )}

        <div className="p-5 space-y-6">
          {summarizeError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col gap-1.5 shadow-sm">
              <strong className="font-bold">Error:</strong>
              <span>{summarizeError}</span>
            </div>
          )}

          {summarizeResponse && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white border border-sky-100/80 shadow-sm space-y-3">
                <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase tracking-widest block">Summary Highlights</span>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                  {summarizeResponse.overview}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-4">
                <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase tracking-widest block">Crucial Facts</span>
                <div className="grid grid-cols-1 gap-4">
                  {summarizeResponse.bulletPoints.map((bp, i) => (
                    <div 
                      key={i}
                      className="flex gap-4 text-sm sm:text-base text-slate-700 bg-sky-50/20 p-4 rounded-xl border border-sky-100/50 items-start hover:border-sky-300 hover:bg-sky-50 transition-all duration-300"
                    >
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-xs font-bold text-sky-705">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-relaxed font-sans">{bp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border-l-8 border-sky-500 bg-sky-50/30 shadow-sm">
                <div className="flex gap-3 items-start">
                  <Sparkles className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-sky-600 uppercase tracking-wide block">Primary Lesson Takeaway</span>
                    <p className="text-sm sm:text-base font-bold text-slate-800 mt-1">
                      {summarizeResponse.mainTakeaway}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuizContent = () => {
    return (
      <div className="flex flex-col h-full font-sans">
        {/* Score and Turn ribbon */}
        {quizQuestions.length > 0 && (
          <div className="px-5 py-3 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Scores:</span>
              {quizMode === "solo" ? (
                <div className={`px-4 py-1 rounded-xl bg-sky-500 text-white font-bold text-xs ${scorePulse ? "animate-bounce scale-110" : ""} transition-all shadow-sm`}>
                  Score: {scores.solo}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold">
                  <span className={`px-2.5 py-1 rounded-lg border ${currentPlayerTurn === "playerA" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white text-slate-500"}`}>
                    Brother A Correct: {scores.playerA}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border ${currentPlayerTurn === "playerB" ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white text-slate-500"}`}>
                    Brother B Correct: {scores.playerB}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-sky-700">
              Question {currentQuestionIndex + 1} / {quizQuestions.length}
            </div>
          </div>
        )}

        <div className="p-5 space-y-6">
          {quizError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col gap-1.5 shadow-sm">
              <strong className="font-bold">Error:</strong>
              <span>{quizError}</span>
            </div>
          )}

          {quizQuestions.length > 0 && !quizDone && (
            <div className="space-y-6">
              {quizMode === "vs" && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 text-xs sm:text-sm text-slate-800 font-bold flex items-center justify-between select-none">
                  <span>Current Active Player: {currentPlayerTurn === "playerA" ? "👨‍🏫 Brother A" : "🧑‍💻 Brother B"}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Pass & Play</span>
                </div>
              )}

              {/* Question card */}
              <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm space-y-3">
                <span className="text-[10px] sm:text-xs font-bold text-sky-500 uppercase tracking-wide block">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                  {quizQuestions[currentQuestionIndex].question}
                </h2>
              </div>

              {/* Options list */}
              <div className="grid grid-cols-1 gap-3">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSubmitted = isAnswerSubmitted;
                  const isCorrectAnswer = idx === quizQuestions[currentQuestionIndex].correctIndex;
                  const isSelectedAnswer = idx === selectedOptionIndex;

                  let optClass = "w-full text-left p-4 rounded-xl border-2 font-bold text-sm sm:text-base flex items-center gap-4 transition-all duration-300 relative select-none cursor-pointer ";
                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      optClass += "bg-emerald-500/10 border-emerald-500 text-emerald-800 shadow-md ring-2 ring-emerald-500/30";
                    } else if (isSelectedAnswer) {
                      optClass += "bg-rose-500/10 border-rose-500 text-rose-800 ring-2 ring-rose-500/20";
                    } else {
                      optClass += "bg-white border-slate-200 text-slate-400 opacity-60";
                    }
                  } else {
                    if (isSelectedAnswer) {
                      optClass += "bg-sky-500/10 border-sky-500 text-sky-800 shadow-md translate-x-1";
                    } else {
                      optClass += "bg-white border-sky-100/50 hover:bg-sky-50/50 text-slate-700";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={optClass}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold transition-all ${
                        isSubmitted && isCorrectAnswer
                          ? "bg-emerald-500 text-white"
                          : isSubmitted && isSelectedAnswer
                          ? "bg-rose-500 text-white"
                          : idx === selectedOptionIndex
                          ? "bg-sky-500 text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {letters[idx]}
                      </span>

                      <span className="flex-1 text-left">{option}</span>

                      {isSubmitted && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isSubmitted && isSelectedAnswer && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-4 pt-3 border-t border-sky-100">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={submitQuizAnswer}
                    disabled={selectedOptionIndex === null}
                    className="py-2.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-sky-400/30 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={proceedNextQuestion}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {quizDone && (
            <div className="text-center p-6 space-y-6 max-w-md mx-auto select-none animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 mx-auto flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-800">Quiz Over!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Excellent work! You've successfully addressed all testing checkpoints.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-sky-200/60 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Game Summary Scoreboard</span>
                
                {quizMode === "solo" ? (
                  <div className="text-2xl font-black text-sky-700">
                    {scores.solo} <span className="text-xs font-bold text-slate-400">Points Earned</span>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-150">
                      <span className="font-bold text-slate-600">Brother A Points:</span>
                      <strong className="text-slate-900 text-sm">{scores.playerA} pt</strong>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-150">
                      <span className="font-bold text-slate-600">Brother B Points:</span>
                      <strong className="text-slate-900 text-sm">{scores.playerB} pt</strong>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-600 pt-2 border-t border-slate-100">
                      {scores.playerA > scores.playerB ? "🏆 Brother A Wins!" : scores.playerB > scores.playerA ? "🏆 Brother B Wins!" : "🤝 Perfect Draw!"}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={restartQuiz}
                className="mx-auto py-2.5 px-5 rounded-xl border-2 border-sky-300 text-sky-700 font-bold text-xs uppercase tracking-wider hover:bg-sky-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------
  // Helper Active-Data and Generating Checkers
  // ----------------------------------------------------------------
  const isCurrentlyWorking = isGeneratingLecture || isGeneratingSummary || isGeneratingQuiz;
  const hasResultLoaded = 
    (activeTab === "lecture" && lectureResponse) ||
    (activeTab === "summarizer" && summarizeResponse) ||
    (activeTab === "quiz" && quizQuestions.length > 0);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden flex flex-col bg-gradient-to-tr from-sky-100/70 via-slate-50 to-white text-slate-800 font-sans select-none">
      
      {/* 1. BRANDING HEADER WITH BANNER & TAB NAVIGATION IN CORNER */}
      <BrandingHeader activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Inputs for files, cameras, and documents directly registered */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.txt,.md"
      />

      {/* 2. DYNAMIC SPLIT LAYOUT (LOCK SCROLLING VIEWPORTS) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:grid md:grid-cols-12 md:gap-6 md:p-6 p-4">
        
        {/* LEFT PANEL: The Input Zone (col-span-5) */}
        <div className="flex-shrink-0 shrink-0 md:col-span-5 bg-white/45 backdrop-blur-xl border border-sky-200/60 p-4 md:p-6 rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.06)] flex flex-col justify-between overflow-hidden h-[45dvh] md:h-full gap-2.5 md:gap-4 relative">
          
          {/* Top Button Row */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 text-sky-700 hover:text-sky-800 text-xs font-bold tracking-tight transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-transparent"
              >
                <ImageIcon className="w-4 h-4 text-sky-500" />
                <span>Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 text-sky-700 hover:text-sky-800 text-xs font-bold tracking-tight transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-transparent"
              >
                <CameraIcon className="w-4 h-4 text-sky-500" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 hover:bg-sky-50 text-sky-700 hover:text-sky-800 text-xs font-bold tracking-tight transition-all shadow-sm active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-transparent"
              >
                <FileIcon className="w-4 h-4 text-sky-500" />
                <span>Doc</span>
              </button>
            </div>

            {/* Selected File Feedback Badge */}
            {uploadedFile && (
              <div className="flex items-center justify-between p-2 px-3 rounded-xl border border-sky-100 bg-sky-50/40 text-xs animate-fade-in">
                <span className="font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[240px]">
                  📎 {uploadedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-rose-500 hover:text-rose-600 font-bold ml-2 text-[10px] uppercase tracking-wide cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Center Textarea Segment */}
          <div className="flex-1 min-h-0 flex flex-col">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="What would you like to learn about today?"
              className="w-full flex-grow p-4 bg-white border border-sky-200/60 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-transparent rounded-2xl text-slate-800 placeholder-slate-400 font-semibold text-sm sm:text-base resize-none shadow-sm"
            />
          </div>

          {/* Bottom Row Controls with Select & Teach Button */}
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-sky-100/30 shrink-0 select-none">
            {/* Persona picker */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-slate-500 hidden xs:inline">Persona:</span>
              <select
                value={teachingPersona}
                onChange={(e) => setTeachingPersona(e.target.value as TeachingPersona)}
                className="bg-sky-50/50 border border-sky-200/60 text-sky-700 hover:text-sky-800 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-transparent leading-snug"
              >
                <option value="simple">Simple (ELI5)</option>
                <option value="deep">Thorough (Deep Dive)</option>
                <option value="fast">Fast (Accelerated)</option>
              </select>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleTeachMe}
              disabled={isCurrentlyWorking || (!customPrompt.trim() && !uploadedFile)}
              className="px-5 py-2.5 sm:py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-400/25 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <BookOpen className="w-4 h-4" />
              <span>Teach Me</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: The Board / Output Zone (col-span-7) */}
        <div className="flex-1 md:col-span-7 bg-white/45 backdrop-blur-xl border border-sky-200/60 rounded-3xl shadow-[0_8px_32px_rgba(14,165,233,0.06)] flex flex-col overflow-hidden h-full min-h-0 mt-4 md:mt-0 relative pb-safe">
          
          <div className="flex-1 overflow-y-auto scrollbar-none h-full min-h-0">
            
            {/* Spinning/Generating Loading overlays */}
            {isCurrentlyWorking && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
                <p className="text-sm font-semibold text-sky-600 animate-pulse">
                  {isGeneratingLecture 
                    ? "Analyzing content and drafting your lesson..." 
                    : isGeneratingSummary 
                    ? "Condensing content and drafting bullet points..." 
                    : "Creating questions based on your material..."
                  }
                </p>
              </div>
            )}

            {/* Active Output elements */}
            {!isCurrentlyWorking && hasResultLoaded && (
              <div className="h-full min-h-0">
                {activeTab === "lecture" && renderLectureContent()}
                {activeTab === "summarizer" && renderSummaryContent()}
                {activeTab === "quiz" && renderQuizContent()}
              </div>
            )}

            {/* In-Arena special Mode selection row when Arena is active but questions not started */}
            {!isCurrentlyWorking && !hasResultLoaded && activeTab === "quiz" && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100">
                    <HelpCircle className="w-7 h-7 text-sky-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800">Ready for your Quiz Challenge?</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Select your pass & play mode below, configure text inputs or photos on the left, and click Teach Me to start!
                    </p>
                  </div>
                </div>

                {/* PASS & PLAY VS SOLO MODE PILLS */}
                <div className="flex items-center justify-between p-1.5 bg-slate-100/80 rounded-2xl border border-sky-200/60 select-none max-w-md mx-auto">
                  <button
                    onClick={() => setQuizMode("solo")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-transparent ${
                      quizMode === "solo"
                        ? "bg-white text-sky-700 shadow-sm border border-sky-100/30"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Play Alone</span>
                  </button>
                  <button
                    onClick={() => setQuizMode("vs")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-transparent ${
                      quizMode === "vs"
                        ? "bg-white text-sky-700 shadow-sm border border-sky-100/30"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Play with Brother</span>
                  </button>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50/50 border border-slate-200/50 text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">How it works</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold text-sky-600">Alone Mode</p>
                      <p className="text-slate-500 mt-0.5">Solve questions solo to practice and earn personal points.</p>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-600">Brother Mode</p>
                      <p className="text-slate-500 mt-0.5">Turn-based gameplay to compete with your brother alternately!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Empty State view */}
            {!isCurrentlyWorking && !hasResultLoaded && activeTab !== "quiz" && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6 space-y-4 animate-fade-in select-none">
                <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100 shadow-inner">
                  <Sparkles className="w-8 h-8 text-sky-400 animate-pulse" />
                </div>
                <p className="text-[15px] font-bold text-slate-500 leading-normal max-w-xs sm:max-w-md">
                  {activeTab === "lecture" 
                    ? "Your lecture will appear here after you click Teach Me" 
                    : "Your summary will appear here after you click Teach Me"
                  }
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
