"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import type { ReceiptScanResult } from "@/trpc/server/routers/receipt";

export type ScanProgress = {
  stage:
    | "idle"
    | "preparing"
    | "uploading"
    | "analyzing"
    | "complete"
    | "error";
  progress: number;
  message: string;
};

export type { ReceiptScanResult };

type CategoryInput = {
  id: string;
  name: string;
  type: string;
};

type WalletInput = {
  id: string;
  name: string;
};

export function useReceiptScanner() {
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trpc = useTRPC();

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const simulateProgress = useCallback(
    (
      startProgress: number,
      targetProgress: number,
      duration: number,
      stage: ScanProgress["stage"],
      message: string
    ) => {
      return new Promise<void>((resolve) => {
        clearProgressInterval();
        setScanProgress({ stage, progress: startProgress, message });

        const increment = (targetProgress - startProgress) / (duration / 50);
        let currentProgress = startProgress;

        progressIntervalRef.current = setInterval(() => {
          currentProgress += increment;
          if (currentProgress >= targetProgress) {
            currentProgress = targetProgress;
            clearProgressInterval();
            setScanProgress({ stage, progress: targetProgress, message });
            resolve();
          } else {
            setScanProgress({
              stage,
              progress: Math.round(currentProgress),
              message,
            });
          }
        }, 50);
      });
    },
    [clearProgressInterval]
  );

  const scanMutation = useMutation({
    ...trpc.receipt.scan.mutationOptions(),
    onMutate: async () => {
      // Stage 1: Preparing
      await simulateProgress(
        0,
        20,
        400,
        "preparing",
        "Mempersiapkan gambar..."
      );
      // Stage 2: Uploading
      await simulateProgress(20, 40, 300, "uploading", "Mengunggah gambar...");
      // Stage 3: Start analyzing
      setScanProgress({
        stage: "analyzing",
        progress: 50,
        message: "Menganalisis struk dengan AI...",
      });

      return undefined;
    },
    onSuccess: async () => {
      clearProgressInterval();
      // Stage 4: Complete
      await simulateProgress(80, 100, 300, "complete", "Selesai!");
    },
    onError: (error) => {
      clearProgressInterval();
      setScanProgress({
        stage: "error",
        progress: 0,
        message: error.message || "Terjadi kesalahan saat memindai struk",
      });
    },
  });

  const scanReceipt = useCallback(
    async (
      file: File,
      categories: CategoryInput[],
      wallets: WalletInput[]
    ): Promise<ReceiptScanResult | null> => {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await scanMutation.mutateAsync({
          image: base64,
          mimeType: file.type,
          categories,
          wallets,
        });

        return result;
      } catch {
        return null;
      }
    },
    [scanMutation]
  );

  const reset = useCallback(() => {
    clearProgressInterval();
    setScanProgress({ stage: "idle", progress: 0, message: "" });
    scanMutation.reset();
  }, [clearProgressInterval, scanMutation]);

  return {
    scanReceipt,
    scanProgress,
    isScanning: scanMutation.isPending,
    scanResult: scanMutation.data ?? null,
    error: scanMutation.error?.message ?? null,
    reset,
  };
}
