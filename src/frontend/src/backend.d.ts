import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentStatusInfo {
    status: string;
    contactName: string;
    orderId: bigint;
    updatedAt: bigint;
    customerId: string;
    price: bigint;
}
export interface CustomerChat {
    customer: Principal;
    messages: Array<ChatMessage>;
    customerId: string;
}
export interface ChatMessage {
    id: bigint;
    customerPrincipal: Principal;
    text: string;
    timestamp: bigint;
    fromAdmin: boolean;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface CustomerProfile {
    principal: Principal;
    customerId: string;
    registeredAt: bigint;
}
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
export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}
export enum PaymentStatus {
    Approved = "Approved",
    Cancelled = "Cancelled",
    Processing = "Processing",
    Pending = "Pending"
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
    approvePayment(orderId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelPayment(orderId: bigint): Promise<void>;
    rejectPayment(orderId: bigint): Promise<void>;
    getAllChats(): Promise<Array<CustomerChat>>;
    getAllCustomers(): Promise<Array<CustomerProfile>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllPaymentStatuses(): Promise<Array<PaymentStatusInfo>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyChat(): Promise<Array<ChatMessage>>;
    getMyOrders(): Promise<Array<Order>>;
    getMyProfile(): Promise<CustomerProfile | null>;
    getOrder(orderId: bigint): Promise<Order | null>;
    getOrderStats(): Promise<{
        total: bigint;
        pending: bigint;
        completed: bigint;
        inProgress: bigint;
    }>;
    getPaymentStatus(orderId: bigint): Promise<PaymentStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isPaymentApproved(orderId: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selfRegister(): Promise<string>;
    sendAdminReply(customerPrincipal: Principal, text: string): Promise<Result>;
    sendCustomerMessage(text: string): Promise<Result>;
    setPaymentProcessing(orderId: bigint): Promise<void>;
    submitOrder(videoFileId: string, videoFileName: string, description: string, contactName: string, contactEmail: string, contactPhone: string): Promise<bigint>;
    updateOrderStatus(orderId: bigint, status: Status): Promise<Result>;
}
