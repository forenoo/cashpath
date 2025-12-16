"use client";

import { useCallback, useState } from "react";
import { useTRPC } from "@/trpc/client";

export type UploadProgress = {
  stage: "idle" | "generating-url" | "uploading" | "complete" | "error";
  progress: number;
  message: string;
};

export function useReceiptUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  const trpc = useTRPC();

  const uploadReceipt = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        setUploadProgress({
          stage: "generating-url",
          progress: 20,
          message: "Mempersiapkan upload...",
        });

        const { uploadUrl, publicUrl } =
          await trpc.storage.generateUploadUrl.mutate({
            filename: file.name,
            contentType: file.type,
          });

        setUploadProgress({
          stage: "uploading",
          progress: 50,
          message: "Mengunggah gambar...",
        });

        const response = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          mode: "cors",
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload gagal: ${response.status}`);
        }

        setUploadProgress({
          stage: "complete",
          progress: 100,
          message: "Upload berhasil!",
        });

        return publicUrl;
      } catch (error) {
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Upload gagal",
        });
        return null;
      }
    },
    [trpc],
  );

  const reset = useCallback(() => {
    setUploadProgress({ stage: "idle", progress: 0, message: "" });
  }, []);

  return {
    uploadReceipt,
    uploadProgress,
    isUploading:
      uploadProgress.stage === "generating-url" ||
      uploadProgress.stage === "uploading",
    reset,
  };
}
