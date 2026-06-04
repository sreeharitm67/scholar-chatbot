import React, { useRef, useState } from "react";
import { Upload, Camera, FileText, X, Sparkles, Loader } from "lucide-react";
import { UploadedFile } from "../types";

interface MultimodalUploadProps {
  onFileLoaded: (file: UploadedFile | null) => void;
  selectedFile: UploadedFile | null;
}

export default function MultimodalUpload({ onFileLoaded, selectedFile }: MultimodalUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    // Validate file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["pdf", "txt", "md", "png", "jpg", "jpeg", "webp"];
    if (extension && !validExtensions.includes(extension)) {
      alert("Unsupported format. Please upload PDF, TXT, MD, or an Image.");
      setIsLoading(false);
      return;
    }

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onFileLoaded({
        name: file.name,
        mimeType: file.type || `application/${extension || "octet-stream"}`,
        data: dataUrl,
      });
      setIsLoading(false);
    };

    reader.onerror = () => {
      alert("Error reading file.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Visual Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          Add File or Photo
        </label>
        {selectedFile && (
          <button
            onClick={() => onFileLoaded(null)}
            className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold uppercase flex items-center gap-1 transition-all"
          >
            Remove File <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main vault area */}
      {!selectedFile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* File system search vault */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerUpload}
            className={`cursor-pointer transition-all duration-300 relative select-none rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed text-center min-h-[148px] ${
              isDragging
                ? "border-sky-500 bg-sky-50/65 scale-98"
                : "border-sky-200 bg-white hover:border-sky-500 hover:bg-sky-50/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,image/*"
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-7 h-7 text-sky-500 animate-spin" />
                <span className="text-sm text-sky-600 font-semibold">Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-sky-500 mb-2" />
                <span className="text-base font-bold text-slate-800">Add File</span>
                <span className="text-xs text-slate-500 mt-1">PDF, TXT, MD, or image</span>
              </>
            )}
          </div>

          {/* HTML5 Image Capture premium storage vault button */}
          <div
            onClick={triggerCamera}
            className="cursor-pointer transition-all duration-300 relative rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-sky-300 bg-gradient-to-br from-sky-50/50 to-sky-100/30 text-center min-h-[148px] shadow-[0_6px_20px_rgba(14,165,233,0.08)] hover:shadow-cyan-200/50 hover:border-sky-500 group overflow-hidden"
          >
            {/* Ambient sky radial glow */}
            <div className="absolute inset-0 bg-radial-gradient from-sky-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
            />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center border-2 border-sky-300 group-hover:border-sky-500 group-hover:scale-110 transition-all duration-300 mb-2">
                <Camera className="w-6 h-6 text-sky-600" />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-sky-700 to-sky-500 bg-clip-text text-transparent">
                Take Photo
              </span>
              <span className="text-xs text-sky-600 font-semibold mt-1">
                Snap physical notebooks
              </span>
            </div>

            {/* Glowing Loader Ribbon */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-300 to-sky-500 animate-pulse" />
          </div>
        </div>
      ) : (
        /* Selected file badge screen */
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-sky-200/40 bg-sky-50/30 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 py-1 px-2.5 rounded-bl-lg bg-sky-100 text-[9px] font-bold uppercase tracking-wider text-sky-700">
            Selected File
          </div>
          <div className="p-2.5 rounded-lg bg-sky-500 text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-12">
            <h4 className="text-xs font-bold text-slate-700 truncate pr-4">
              {selectedFile.name}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">
              {selectedFile.mimeType}
            </p>
          </div>
          <button
            onClick={() => onFileLoaded(null)}
            className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            title="Remove File"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
