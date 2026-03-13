import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, Status } from "../backend";
import { useActor } from "./useActor";

export function useGetMyOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOrderStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    total: bigint;
    pending: bigint;
    completed: bigint;
    inProgress: bigint;
  }>({
    queryKey: ["orderStats"],
    queryFn: async () => {
      if (!actor)
        return { total: 0n, pending: 0n, completed: 0n, inProgress: 0n };
      return actor.getOrderStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      videoFileId: string;
      videoFileName: string;
      description: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitOrder(
        params.videoFileId,
        params.videoFileName,
        params.description,
        params.contactName,
        params.contactEmail,
        params.contactPhone,
      );
    },
    retry: (failureCount, error) => {
      const msg = error instanceof Error ? error.message : String(error);
      const isNetworkIssue =
        msg.toLowerCase().includes("polling") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("certificate");
      if (isNetworkIssue) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 10000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { orderId: bigint; status: Status }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateOrderStatus(
        params.orderId,
        params.status,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
    },
  });
}
