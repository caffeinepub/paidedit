import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetryPhase = "idle" | "waiting" | "uploading";

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryPhase, setRetryPhase] = useState<RetryPhase>("idle");
  const [retryCountdown, setRetryCountdown] = useState(0);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setRetryCount(0);
    setRetryPhase("uploading");
    setRetryCountdown(0);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          setRetryCount(attempt);
          setUploadProgress(0);
          // Show countdown during wait
          const delaySec = RETRY_DELAY_MS / 1000;
          setRetryPhase("waiting");
          setRetryCountdown(delaySec);
          for (let s = delaySec; s > 0; s--) {
            setRetryCountdown(s);
            await sleep(1000);
          }
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
        return hash;
      } catch (_err) {
        if (attempt >= MAX_RETRIES) {
          break;
        }
        // Will retry
      }
    }

    const friendlyMsg = `Upload failed after ${MAX_RETRIES} attempts. Please check your connection and try again.`;
    setUploadError(friendlyMsg);
    setRetryCount(0);
    setRetryPhase("idle");
    setIsUploading(false);
    throw new Error(friendlyMsg);
  }, []);

  const clearUploadError = useCallback(() => setUploadError(null), []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    uploadError,
    retryCount,
    retryPhase,
    retryCountdown,
    clearUploadError,
  };
}
