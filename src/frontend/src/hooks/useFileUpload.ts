import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(console.warn);
      }
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
      return hash;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, uploadProgress, isUploading, uploadError };
}
