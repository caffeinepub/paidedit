import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export const MAX_FILE_SIZE_MB = 1000;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetryPhase = "idle" | "waiting" | "uploading";
export type ErrorKind = "network" | "server" | null;

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorKind, setUploadErrorKind] = useState<ErrorKind>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryPhase, setRetryPhase] = useState<RetryPhase>("idle");
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [isOfflineState, setIsOfflineState] = useState(false);

  const uploadFile = useCallback(
    async (file: File, options?: { fastMode?: boolean }): Promise<string> => {
      const maxRetries = options?.fastMode ? 3 : 8;
      const baseDelay = options?.fastMode ? 300 : 5000;

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadErrorKind(null);
      setRetryCount(0);
      setRetryPhase("uploading");
      setRetryCountdown(0);
      setIsOfflineState(false);

      let lastErr: unknown = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            setRetryCount(attempt);
            setUploadProgress(0);
            setRetryPhase("waiting");

            const delayMs = options?.fastMode
              ? baseDelay
              : Math.min(baseDelay * attempt, 40_000);

            setRetryCountdown(Math.round(delayMs / 1000));
            await sleep(delayMs);
            setRetryPhase("uploading");
            setRetryCountdown(0);
          }

          const config = await loadConfig();
          const agent = await HttpAgent.create({
            host: config.backend_host,
            shouldFetchRootKey: !!config.backend_host?.includes("localhost"),
          });
          const storageClient = new StorageClient(
            config.bucket_name,
            config.storage_gateway_url,
            config.backend_canister_id,
            config.project_id,
            agent,
          );
          const bytes = new Uint8Array(await file.arrayBuffer());
          const { hash } = await storageClient.putFile(bytes, (pct) => {
            setUploadProgress(pct);
          });
          setRetryCount(0);
          setRetryPhase("idle");
          setIsUploading(false);
          setIsOfflineState(false);
          return hash;
        } catch (err) {
          lastErr = err;
          if (attempt >= maxRetries) break;
        }
      }

      const isNetworkErr =
        lastErr instanceof Error &&
        (lastErr.message.toLowerCase().includes("network") ||
          lastErr.message.toLowerCase().includes("fetch") ||
          lastErr.message.toLowerCase().includes("failed to fetch") ||
          lastErr.message.toLowerCase().includes("abort") ||
          lastErr.message.toLowerCase().includes("timeout"));

      const friendlyMsg = isNetworkErr
        ? "Upload failed after multiple attempts. Please move to a stronger signal area and try again."
        : "Upload failed. The server is busy — please try again in a moment.";

      setUploadError(friendlyMsg);
      setUploadErrorKind(isNetworkErr ? "network" : "server");
      setRetryCount(0);
      setRetryPhase("idle");
      setIsUploading(false);
      setIsOfflineState(false);
      throw new Error(friendlyMsg);
    },
    [],
  );

  const clearUploadError = useCallback(() => {
    setUploadError(null);
    setUploadErrorKind(null);
  }, []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    uploadError,
    uploadErrorKind,
    retryCount,
    retryPhase,
    retryCountdown,
    isOfflineState,
    clearUploadError,
  };
}
