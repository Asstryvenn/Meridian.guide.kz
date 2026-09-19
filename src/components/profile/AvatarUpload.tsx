"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useApp } from "@/lib/store/app-store";
import { getSupabase } from "@/lib/supabase/client";

interface AvatarUploadProps {
  value?: string | null;
  onChange?: (url: string) => void;
  fallbackInitial?: string;
  disabled?: boolean;
}

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function AvatarUpload({
  value,
  onChange,
  fallbackInitial,
  disabled = false,
}: AvatarUploadProps) {
  const { user, profile, updateProfile } = useApp();
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = previewUrl || value || profile.avatarUrl || null;
  const initial = (fallbackInitial || profile.fullName || user?.email || "U").charAt(0).toUpperCase();

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleContainerClick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || uploading) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      notify({
        tone: "error",
        title: "Unsupported image format",
        body: "Please upload a PNG, JPEG, or WebP image.",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      notify({
        tone: "error",
        title: "Image too large",
        body: "File size exceeds the 5MB limit.",
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const supabase = getSupabase();
      let resolvedUrl = objectUrl;

      if (supabase && user?.id) {
        const fileExt = file.name.split(".").pop() || "png";
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            resolvedUrl = publicData.publicUrl;
          }
        }
      }

      if (resolvedUrl === objectUrl) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (dataUrl) {
            updateProfile({ avatarUrl: dataUrl });
            onChange?.(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      } else {
        updateProfile({ avatarUrl: resolvedUrl });
        onChange?.(resolvedUrl);
      }

      notify({
        tone: "success",
        title: "Avatar updated",
        body: "Your profile photo has been refreshed.",
      });
    } catch {
      notify({
        tone: "error",
        title: "Upload error",
        body: "Could not save your photo. Please try again.",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload profile avatar"
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        className="w-24 h-24 rounded-full border-2 border-emerald-500/20 bg-white/[0.03] overflow-hidden relative group select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Profile Avatar"
            width={96}
            height={96}
            unoptimized
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-neutral-300">
            {initial}
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-emerald-400" />
          ) : (
            <>
              <Camera size={18} className="mb-0.5 text-neutral-200" />
              <span className="text-[10px] font-medium tracking-wide uppercase text-neutral-200">
                Change
              </span>
            </>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}

export default AvatarUpload;
