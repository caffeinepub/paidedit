import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface Order {
    id: bigint;
    videoFileName: string;
    status: Status;
    contactName: string;
    userId: Principal;
    createdAt: bigint;
    description: string;
    updatedAt: bigint;
    contactEmail: string;
    price: bigint;
    contactPhone: string;
    videoFileId: string;
}
export enum Status {
    Cancelled = "Cancelled",
    InProgress = "InProgress",
    Completed = "Completed",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserRole(): Promise<UserRole>;
    getMyOrders(): Promise<Array<Order>>;
    getOrder(orderId: bigint): Promise<Order | null>;
    getOrderStats(): Promise<{
        total: bigint;
        pending: bigint;
        completed: bigint;
        inProgress: bigint;
    }>;
    isCallerAdmin(): Promise<boolean>;
    submitOrder(videoFileId: string, videoFileName: string, description: string, contactName: string, contactEmail: string, contactPhone: string): Promise<bigint>;
    updateOrderStatus(orderId: bigint, status: Status): Promise<Result>;
}
