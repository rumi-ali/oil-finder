"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large (max 10MB)");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Identification failed");
      }

      const data = await res.json();

      if (!data.make || data.confidence === "low") {
        setError(data.reasoning || "Could not identify vehicle from this image. Try a clearer photo.");
        setUploading(false);
        return;
      }

      const query = [data.make, data.model, data.year]
        .filter(Boolean)
        .join(" ");
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } catch {
      setError("Could not identify vehicle. Try a clearer photo or type the car name instead.");
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="w-full max-w-[580px] mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-card-border" />
        <span className="text-xs text-muted/50 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-card-border" />
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          uploading
            ? "border-accent/30 bg-accent-dim"
            : "border-card-border hover:border-accent/50 hover:bg-accent-dim/50"
        }`}
      >
        {preview && uploading ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Uploaded car"
              className="w-24 h-24 object-cover rounded-lg opacity-70"
            />
            <div className="flex items-center gap-2 text-sm text-accent">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Identifying vehicle...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">&#x1F4F7;</span>
            <span className="text-sm text-muted">
              Upload a photo of your car
            </span>
            <span className="text-xs text-muted/50">
              Drop an image or click to browse
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
