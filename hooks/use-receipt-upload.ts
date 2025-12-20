"use client";

import { useMutation } from "@tanstack/react-query";
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

  const generateUploadUrlMutation = useMutation(
    trpc.storage.generateUploadUrl.mutationOptions(),
  );

  const uploadReceipt = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        setUploadProgress({
          stage: "generating-url",
          progress: 20,
          message: "Mempersiapkan upload...",
        });

        const result = await generateUploadUrlMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
        });

        if (!result.uploadUrl) {
          throw new Error("Failed to generate upload URL");
        }

        setUploadProgress({
          stage: "uploading",
          progress: 50,
          message: "Mengunggah gambar...",
        });

        const response = await fetch(result.uploadUrl, {
          method: "PUT",
          body: file,
          mode: "cors",
          headers: {
            "Content-Type": file.type,
          },
        });

        console.log("[Receipt Upload] Upload response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          throw new Error(
            `Upload gagal: ${response.status} - ${response.statusText}`,
          );
        }

        setUploadProgress({
          stage: "complete",
          progress: 100,
          message: "Upload berhasil!",
        });

        return result.publicUrl;
      } catch (error) {
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Upload gagal",
        });
        return null;
      }
    },
    [generateUploadUrlMutation],
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
