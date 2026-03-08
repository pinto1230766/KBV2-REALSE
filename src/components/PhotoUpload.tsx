import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface PhotoUploadProps {
  photoUrl?: string;
  onPhotoChange: (base64: string | undefined) => void;
  size?: "sm" | "md";
}

export function PhotoUpload({ photoUrl, onPhotoChange, size = "md" }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB max
    const reader = new FileReader();
    reader.onload = () => onPhotoChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const dim = size === "sm" ? "w-16 h-16" : "w-20 h-20";

  return (
    <div className="flex items-center gap-3">
      <div className={`${dim} rounded-xl overflow-hidden bg-muted flex items-center justify-center relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors`}
        onClick={() => inputRef.current?.click()}
      >
        {photoUrl ? (
          <>
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <Camera className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      {photoUrl && (
        <button
          type="button"
          onClick={() => onPhotoChange(undefined)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
        >
          <X className="w-4 h-4 text-destructive" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
