import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  BellOff,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Status } from "../backend";
import type {
  ChatMessage,
  CustomerChat,
  backendInterface as FullBackend,
} from "../backend.d";
import StatusBadge from "../components/StatusBadge";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useFileUpload } from "../hooks/useFileUpload";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllOrders,
  useGetOrderStats,
  useUpdateOrderStatus,
} from "../hooks/useQueries";

const ADMIN_MOBILE = "9053405019";
// Credentials stored as encoded tokens - never log these
const _AP = atob("UmFraGk1MDUw");
const SESSION_KEY = "paidedit_admin_session";

/** Constant-time string comparison to prevent timing attacks */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function verifyAdminCredentials(mobile: string, password: string): boolean {
  return secureCompare(mobile, ADMIN_MOBILE) && secureCompare(password, _AP);
}

function getPaymentStatusKey(orderId: bigint) {
  return `paidedit_payment_status_${orderId.toString()}`;
}

function loadPaymentStatus(orderId: bigint): "Paid" | "Unpaid" {
  const val = localStorage.getItem(getPaymentStatusKey(orderId));
  return val === "Paid" ? "Paid" : "Unpaid";
}

function _formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Play a pleasant 3-tone ascending chime using Web Audio API */
function playNewOrderChime() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const start = ctx.currentTime + i * 0.18;
      const end = start + 0.3;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.start(start);
      osc.stop(end);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch (_) {
    // Ignore if AudioContext not supported
  }
}

/** Request browser notification permission */
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

/** Show a browser notification for new order */
function showNewOrderNotification(count: number) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  try {
    new Notification("New Order! 🎬", {
      body: `You have ${count} order${count !== 1 ? "s" : ""} waiting. Check your admin panel.`,
      icon: "/assets/uploads/WhatsApp-Image-2026-03-13-at-12.04.16-PM-2-4.jpeg",
      tag: "new-order",
    });
  } catch (_) {
    // Ignore notification errors
  }
}

// Recharts custom tooltip
function _PlanTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-xs text-primary font-bold">
          {payload[0].value} orders
        </p>
      </div>
    );
  }
  return null;
}

export default function Admin() {
  const { actor } = useActor();
  const {
    identity: icIdentity,
    login: icLogin,
    loginStatus: icLoginStatus,
  } = useInternetIdentity();
  const isIcLoggedIn = !!icIdentity;
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(SESSION_KEY) === "true";
  });
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<"login" | "forgot" | "otp">(
    "login",
  );
  const [forgotMobile, setForgotMobile] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpError, setOtpError] = useState("");
  const [_paymentStatuses, setPaymentStatuses] = useState<
    Record<string, "Paid" | "Unpaid">
  >({});
  const [_approvedPayments, setApprovedPayments] = useState<Set<string>>(
    new Set(),
  );
  const [approvingPayment, setApprovingPayment] = useState<string | null>(null);
  const [backendPaymentStatuses, setBackendPaymentStatuses] = useState<
    import("../backend.d").PaymentStatusInfo[]
  >([]);
  const [paymentStatusesLoading, setPaymentStatusesLoading] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>(() =>
      "Notification" in window ? Notification.permission : "denied",
    );
  const [_activeTab, _setActiveTab] = useState("orders");

  // Track previous order count for new-order detection
  const prevOrderCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(SESSION_KEY, "true");
      requestNotificationPermission().then((perm) => {
        setNotifPermission(perm);
      });
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    const cleaned = mobile.replace(/\s+/g, "").trim();
    if (verifyAdminCredentials(cleaned, password)) {
      setIsAuthenticated(true);
      setLoginError("");
      toast.success("Admin login successful!");
    } else {
      setLoginError("Incorrect mobile number or password.");
    }
  };

  const handleSendOtp = () => {
    if (forgotMobile.replace(/\s+/g, "") !== ADMIN_MOBILE) {
      setOtpError("Mobile number not registered");
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000);
    setForgotStep("otp");
    setOtpError("");
  };

  const handleVerifyOtp = () => {
    if (!otpExpiry || Date.now() > otpExpiry) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }
    if (otpInput !== generatedOtp) {
      setOtpError("Incorrect OTP. Please try again.");
      return;
    }
    setIsAuthenticated(true);
    toast.success("Login successful via OTP!");
  };

  const handleRequestNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Notifications enabled! 🔔");
    } else if (perm === "denied") {
      toast.error("Notifications blocked. Enable from browser settings.");
    }
  };

  const { data: stats, isLoading: _statsLoading } = useGetOrderStats();
  const {
    data: orders,
    isLoading: _ordersLoading,
    isError: _ordersError,
    error: _ordersErrorMsg,
  } = useGetAllOrders();
  const { data: customers } = useQuery({
    queryKey: ["allCustomers"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return (await (actor as any).getAllCustomers()) as Array<{
          principal: { toString(): string };
          customerId: string;
          registeredAt: bigint;
        }>;
      } catch {
        return [];
      }
    },
    enabled: !!actor && isAuthenticated,
  });
  const _customerIdMap = (customers ?? []).reduce<Record<string, string>>(
    (acc, c) => {
      acc[c.principal.toString()] = c.customerId;
      return acc;
    },
    {},
  );
  const updateStatus = useUpdateOrderStatus();
  const [sendDialogOrder, setSendDialogOrder] = useState<{
    id: bigint;
    name: string;
    email: string;
  } | null>(null);
  const [_editedVideoFile, _setEditedVideoFile] = useState<File | null>(null);
  const [_editedVideoLink, _setEditedVideoLink] = useState<string | null>(null);
  const _sendFileInputRef = useRef<HTMLInputElement>(null);

  // ---- Support Chat State ----
  const [customerChats, setCustomerChats] = useState<CustomerChat[]>([]);
  const [activeChatSession, _setActiveChatSession] = useState<string | null>(
    null,
  );
  const [adminReplyText, setAdminReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const _chatBottomRef = useRef<HTMLDivElement>(null);
  const editedVideoInputRef = useRef<HTMLInputElement>(null);

  const BANNED_WORDS_ADMIN = [
    "chutya",
    "gandu",
    "louda",
    "madarchod",
    "mc",
    "bhosdk",
    "bhosd",
    "randi",
    "harami",
  ];

  const [_chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [_chatRetrying, setChatRetrying] = useState(false);
  const [_chatConnected, setChatConnected] = useState(false);
  const [_cancelledPayments, setCancelledPayments] = useState<
    Array<{
      orderId: string;
      customerName: string;
      customerId: string;
      plan: string;
      price: number;
      cancelledAt: string;
    }>
  >([]);

  useEffect(() => {
    const listKey = "paidedit_cancelled_orders";
    const ids: string[] = JSON.parse(localStorage.getItem(listKey) || "[]");
    const records = ids
      .map((id) => {
        const raw = localStorage.getItem(`paidedit_cancelled_${id}`);
        return raw ? JSON.parse(raw) : null;
      })
      .filter(Boolean);
    setCancelledPayments(records.reverse());
  }, []);

  // Load all payment statuses from backend every 5 seconds
  const refreshPaymentStatuses = useCallback(async () => {
    if (!actor || !isIcLoggedIn) return;
    setPaymentStatusesLoading(true);
    try {
      const statuses = await (
        actor as unknown as FullBackend
      ).getAllPaymentStatuses();
      setBackendPaymentStatuses(statuses);
      // Sync approvedPayments set
      const approvedSet = new Set(
        statuses
          .filter((s) => s.status === "Approved")
          .map((s) => s.orderId.toString()),
      );
      setApprovedPayments(approvedSet);
    } catch {
      // silent fail
    } finally {
      setPaymentStatusesLoading(false);
    }
  }, [actor, isIcLoggedIn]);

  useEffect(() => {
    if (!isAuthenticated || !actor || !isIcLoggedIn) return;
    refreshPaymentStatuses();
    const t = setInterval(refreshPaymentStatuses, 5000);
    return () => clearInterval(t);
  }, [refreshPaymentStatuses, isAuthenticated, actor, isIcLoggedIn]);

  const refreshChats = useCallback(async () => {
    if (!actor || !isIcLoggedIn) {
      setChatLoadError(null);
      return;
    }
    try {
      const chats = await (actor as unknown as FullBackend).getAllChats();
      setCustomerChats(chats);
      setChatConnected(true);
      setChatLoadError(null);
      setChatRetrying(false);
    } catch (_err) {
      setChatConnected(false);
      setChatRetrying(true);
      setChatLoadError("Reconnecting to chat...");
    }
  }, [actor, isIcLoggedIn]);

  useEffect(() => {
    if (!isAuthenticated || !actor || !isIcLoggedIn) return;
    refreshChats();
    const t = setInterval(refreshChats, 5000);
    return () => clearInterval(t);
  }, [refreshChats, isAuthenticated, actor, isIcLoggedIn]);

  const _handleAdminReply = async () => {
    const trimmed = adminReplyText.trim();
    if (!activeChatSession || !trimmed || !actor || replySending) return;
    const lower = trimmed.toLowerCase();
    if (BANNED_WORDS_ADMIN.some((w) => lower.includes(w))) {
      toast.error("Abusive language not allowed. Please be respectful.");
      return;
    }
    const targetChat = customerChats.find(
      (c) => c.customer.toString() === activeChatSession,
    );
    if (!targetChat) return;
    setReplySending(true);
    try {
      await (actor as unknown as FullBackend).sendAdminReply(
        targetChat.customer,
        trimmed,
      );
      setAdminReplyText("");
      await refreshChats();
    } catch {
      toast.error("Failed to send reply. Please try again.");
    } finally {
      setReplySending(false);
    }
  };

  const _sessionIds = customerChats.map((c) => c.customer.toString());
  const {
    uploadFile: uploadEditedVideo,
    uploadProgress: editedUploadProgress,
    isUploading: _editedUploading,
    uploadError: editedUploadError,
    clearUploadError: clearEditedUploadError,
  } = useFileUpload();

  // Detect new orders and trigger sound + notification
  useEffect(() => {
    if (!isAuthenticated || !orders) return;
    const currentCount = orders.length;

    if (isFirstLoadRef.current) {
      prevOrderCountRef.current = currentCount;
      isFirstLoadRef.current = false;
      return;
    }

    if (
      prevOrderCountRef.current !== null &&
      currentCount > prevOrderCountRef.current
    ) {
      playNewOrderChime();
      showNewOrderNotification(currentCount);
      toast.success(`🎬 New order received! Total: ${currentCount}`, {
        duration: 5000,
      });
    }

    prevOrderCountRef.current = currentCount;
  }, [orders, isAuthenticated]);

  // Load payment statuses when orders arrive
  useEffect(() => {
    if (!orders) return;
    const map: Record<string, "Paid" | "Unpaid"> = {};
    for (const order of orders) {
      map[order.id.toString()] = loadPaymentStatus(order.id);
    }
    setPaymentStatuses(map);
  }, [orders]);

  // Load backend payment approval statuses
  useEffect(() => {
    if (!orders || !actor || !isIcLoggedIn) return;
    const loadApprovals = async () => {
      try {
        const results = await Promise.all(
          orders.map(async (order) => {
            try {
              const approved = await (
                actor as unknown as FullBackend
              ).isPaymentApproved(order.id);
              return { id: order.id.toString(), approved };
            } catch {
              return { id: order.id.toString(), approved: false };
            }
          }),
        );
        const approvedSet = new Set(
          results.filter((r) => r.approved).map((r) => r.id),
        );
        setApprovedPayments(approvedSet);
        // Sync payment statuses: if backend says approved, mark as Paid
        setPaymentStatuses((prev) => {
          const updated = { ...prev };
          for (const id of approvedSet) {
            updated[id] = "Paid";
            localStorage.setItem(`paidedit_payment_status_${id}`, "Paid");
          }
          return updated;
        });
      } catch {
        // silent fail
      }
    };
    loadApprovals();
  }, [orders, actor, isIcLoggedIn]);

  const _togglePaymentStatus = useCallback((orderId: bigint) => {
    const key = orderId.toString();
    setPaymentStatuses((prev) => {
      const next = prev[key] === "Paid" ? "Unpaid" : "Paid";
      localStorage.setItem(getPaymentStatusKey(orderId), next);
      return { ...prev, [key]: next };
    });
  }, []);

  // Plans chart data
  const _plansChartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const planCounts: Record<string, number> = {};
    for (const order of orders) {
      const desc = order.description ?? "";
      let plan = "Other";
      if (desc.includes("₹999") || desc.includes("Free Fire 1 Month"))
        plan = "FF ₹999";
      else if (desc.includes("₹499")) plan = "3-Month ₹499";
      else if (desc.includes("₹149")) plan = "1-Month ₹149";
      else if (desc.includes("₹99")) plan = "HQ ₹99";
      else if (desc.includes("₹49")) plan = "Insta ₹49";
      else if (desc.includes("₹39") || desc.includes("Free Fire"))
        plan = "FF ₹39";
      planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    }
    return Object.entries(planCounts)
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const _CHART_COLORS = [
    "#a855f7",
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#0ea5e9",
    "#ec4899",
  ];

  const closeSendDialog = () => {
    setSendDialogOrder(null);
    _setEditedVideoFile(null);
    _setEditedVideoLink(null);
    clearEditedUploadError();
  };

  const _handleStatusChange = async (orderId: bigint, newStatus: Status) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success("Order status updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  };

  const _handleDownload = async (
    videoFileId: string,
    _videoFileName: string,
  ) => {
    try {
      const config = await loadConfig();
      const url = `${config.storage_gateway_url}/v1/blob/?blob_hash=${encodeURIComponent(videoFileId)}&owner_id=${encodeURIComponent(config.backend_canister_id)}&project_id=${encodeURIComponent(config.project_id)}`;
      window.open(url, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(`Could not download video: ${msg}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="card-glow bg-card border-border">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">
                {forgotStep === "login"
                  ? "Admin Login"
                  : forgotStep === "forgot"
                    ? "Forgot Password"
                    : "Verify OTP"}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1 font-bold">
                {forgotStep === "login"
                  ? "Enter your credentials to access the admin panel"
                  : forgotStep === "forgot"
                    ? "Enter your registered mobile number"
                    : "Enter the OTP shown below"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {forgotStep === "login" && (
                <>
                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-mobile-input"
                      className="text-sm font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Mobile Number
                    </label>
                    <div className="relative">
                      <Input
                        type={showMobile ? "text" : "password"}
                        placeholder="Enter mobile number"
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value);
                          setLoginError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="bg-input border-border pr-10 text-center tracking-widest text-lg font-mono"
                        maxLength={10}
                        id="admin-mobile-input"
                        data-ocid="admin.login.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowMobile(!showMobile)}
                        data-ocid="admin.login.toggle"
                      >
                        {showMobile ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-password-input"
                      className="text-sm font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLoginError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="bg-input border-border pr-10 text-center tracking-widest text-lg font-mono"
                        id="admin-password-input"
                        data-ocid="admin.login.password_input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        data-ocid="admin.login.password_toggle"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div
                      className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2 font-bold"
                      data-ocid="admin.login.error_state"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    onClick={handleLogin}
                    disabled={mobile.length < 10 || password.length === 0}
                    data-ocid="admin.login.submit_button"
                  >
                    <LogIn className="w-4 h-4 mr-2" /> Login
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      onClick={() => {
                        setForgotStep("forgot");
                        setOtpError("");
                        setForgotMobile("");
                      }}
                      data-ocid="admin.forgot.link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}

              {forgotStep === "forgot" && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="forgot-mobile-input"
                      className="text-sm font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Registered Mobile Number
                    </label>
                    <Input
                      id="forgot-mobile-input"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={forgotMobile}
                      onChange={(e) => {
                        setForgotMobile(e.target.value);
                        setOtpError("");
                      }}
                      className="bg-input border-border text-center tracking-widest text-lg font-mono"
                      maxLength={10}
                      data-ocid="admin.forgot.mobile_input"
                    />
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2 font-bold">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      {otpError}
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    onClick={handleSendOtp}
                    disabled={forgotMobile.length < 10}
                    data-ocid="admin.forgot.send_otp_button"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Send OTP
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      onClick={() => {
                        setForgotStep("login");
                        setOtpError("");
                      }}
                      data-ocid="admin.forgot.back_button"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}

              {forgotStep === "otp" && (
                <>
                  {/* OTP Display Card */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-4 text-center space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Your OTP Code
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-3xl font-mono font-black text-primary tracking-[0.3em]">
                        {generatedOtp}
                      </p>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedOtp);
                          toast.success("OTP copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold">
                      ⏱ This code expires in 5 minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="otp-input"
                      className="text-sm font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Enter OTP
                    </label>
                    <Input
                      id="otp-input"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        setOtpError("");
                      }}
                      className="bg-input border-border text-center tracking-[0.5em] text-xl font-mono"
                      maxLength={6}
                      data-ocid="admin.forgot.otp_input"
                    />
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2 font-bold">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      {otpError}
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    onClick={handleVerifyOtp}
                    disabled={otpInput.length !== 6}
                    data-ocid="admin.forgot.verify_button"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" /> Verify OTP & Login
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      onClick={() => {
                        setForgotStep("login");
                        setOtpError("");
                        setOtpInput("");
                        setGeneratedOtp("");
                      }}
                      data-ocid="admin.forgot.back_button"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // IC login step - show after password auth if IC identity not yet connected
  if (isAuthenticated && !isIcLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="card-glow bg-card border-border">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <CardTitle className="font-display text-2xl">
                Connect Backend
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1 font-bold">
                Step 2 of 2: Connect IC Identity for payment approvals & chat
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-400">
                    Step 1: Mobile + Password ✅
                  </p>
                  <p className="text-xs text-muted-foreground font-bold">
                    Credentials verified
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                <Shield className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Step 2: IC Identity Required
                  </p>
                  <p className="text-xs text-muted-foreground font-bold">
                    Required for payment approval and live chat
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                onClick={() => icLogin()}
                disabled={icLoginStatus === "logging-in"}
                data-ocid="admin.ic_login.primary_button"
              >
                {icLoginStatus === "logging-in" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" /> Connect IC Identity
                  </>
                )}
              </Button>
              <button
                type="button"
                className="w-full text-xs font-bold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                onClick={() => setIsAuthenticated(false)}
                data-ocid="admin.ic_login.cancel_button"
              >
                ← Back to Login
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const _statCards = [
    {
      label: "Total Orders",
      value: stats?.total ?? 0n,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0n,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "In Progress",
      value: stats?.inProgress ?? 0n,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0n,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <>
      {/* Admin-only top bar */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-13-at-12.04.16-PM-2-4.jpeg"
              alt="PAIDEDIT"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div>
              <span className="font-display font-bold text-base text-foreground">
                PAIDEDIT
              </span>
              <span className="ml-2 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={[
                "transition-colors",
                notifPermission === "granted"
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              onClick={handleRequestNotification}
              title={
                notifPermission === "granted"
                  ? "Notifications active"
                  : "Enable notifications"
              }
              data-ocid="admin.notification.toggle"
            >
              {notifPermission === "granted" ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 font-bold"
              onClick={() => {
                setIsAuthenticated(false);
                setMobile("");
                setPassword("");
                isFirstLoadRef.current = true;
                prevOrderCountRef.current = null;
              }}
              data-ocid="admin.logout_button"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-3.5rem)] py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display font-bold text-3xl sm:text-4xl mb-1">
              Admin <span className="gradient-text">Panel</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm">
              Manage all video editing orders
            </p>
          </motion.div>

          <div className="w-full">
            {/* ===== PAYMENTS TAB ===== */}
            <div>
              <div className="space-y-6">
                {/* Backend Payment Statuses - Live from IC */}
                <Card
                  className="card-glow bg-card border-border"
                  data-ocid="admin.payments.receiving.panel"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                      Live Payment Tracker
                      {backendPaymentStatuses.length > 0 && (
                        <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          {backendPaymentStatuses.length} entries
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={refreshPaymentStatuses}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1"
                        data-ocid="admin.payments.button"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                      </button>
                    </CardTitle>
                    {!isIcLoggedIn && (
                      <div className="flex items-center gap-2 text-orange-400 text-xs bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 font-bold mt-2">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        Connect IC Identity (Step 2 above) to view payment
                        statuses.
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Stats row */}
                    {backendPaymentStatuses.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 px-4 pb-4">
                        {[
                          {
                            label: "Processing",
                            color: "yellow",
                            count: backendPaymentStatuses.filter(
                              (s) => s.status === "Processing",
                            ).length,
                          },
                          {
                            label: "Approved",
                            color: "green",
                            count: backendPaymentStatuses.filter(
                              (s) => s.status === "Approved",
                            ).length,
                          },
                          {
                            label: "Cancelled",
                            color: "red",
                            count: backendPaymentStatuses.filter(
                              (s) => s.status === "Cancelled",
                            ).length,
                          },
                          {
                            label: "Rejected",
                            color: "rose",
                            count: backendPaymentStatuses.filter(
                              (s) => s.status === "Rejected",
                            ).length,
                          },
                          {
                            label: "Pending",
                            color: "gray",
                            count: backendPaymentStatuses.filter(
                              (s) => s.status === "Pending",
                            ).length,
                          },
                        ].map(({ label, color, count }) => (
                          <div
                            key={label}
                            className={`rounded-xl p-3 bg-${color === "yellow" ? "yellow" : color === "green" ? "green" : color === "red" ? "red" : color === "rose" ? "rose" : "muted"}-500/10 border border-${color === "yellow" ? "yellow" : color === "green" ? "green" : color === "red" ? "red" : color === "rose" ? "rose" : "border"}-500/20`}
                          >
                            <p
                              className={`text-xl font-black ${color === "yellow" ? "text-yellow-300" : color === "green" ? "text-green-300" : color === "red" ? "text-red-300" : color === "rose" ? "text-rose-300" : "text-muted-foreground"}`}
                            >
                              {count}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {paymentStatusesLoading &&
                    backendPaymentStatuses.length === 0 ? (
                      <div
                        className="p-4 space-y-3"
                        data-ocid="admin.payments.receiving.loading_state"
                      >
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : backendPaymentStatuses.length === 0 ? (
                      <div
                        className="p-10 text-center"
                        data-ocid="admin.payments.receiving.empty_state"
                      >
                        <p className="text-3xl mb-2">💰</p>
                        <p className="text-muted-foreground font-bold text-sm">
                          {isIcLoggedIn
                            ? "No payment activity yet. Customer payments will appear here in real-time."
                            : "Connect IC Identity to view payments."}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-muted-foreground text-xs font-bold">
                                Customer ID
                              </TableHead>
                              <TableHead className="text-muted-foreground text-xs font-bold">
                                Name
                              </TableHead>
                              <TableHead className="text-muted-foreground text-xs font-bold">
                                Amount
                              </TableHead>
                              <TableHead className="text-muted-foreground text-xs font-bold">
                                Status
                              </TableHead>
                              <TableHead className="text-muted-foreground text-xs font-bold hidden sm:table-cell">
                                Time
                              </TableHead>
                              <TableHead className="text-muted-foreground text-xs font-bold">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...backendPaymentStatuses]
                              .sort(
                                (a, b) =>
                                  Number(b.updatedAt) - Number(a.updatedAt),
                              )
                              .map((ps, idx) => {
                                const idStr = ps.orderId.toString();
                                const isProcessing = ps.status === "Processing";
                                const isApproved = ps.status === "Approved";
                                const isCancelled = ps.status === "Cancelled";
                                const isRejected = ps.status === "Rejected";
                                return (
                                  <TableRow
                                    key={idStr}
                                    className={`border-border ${isProcessing ? "hover:bg-orange-500/5 bg-orange-500/3" : isApproved ? "hover:bg-green-500/5" : isCancelled ? "hover:bg-red-500/5 bg-red-500/3" : isRejected ? "hover:bg-rose-500/5 bg-rose-500/3" : "hover:bg-muted/20"}`}
                                    data-ocid={`admin.payments.receiving.row.${idx + 1}`}
                                  >
                                    <TableCell>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {ps.customerId || "PAID-????"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-sm font-bold">
                                      {ps.contactName}
                                    </TableCell>
                                    <TableCell className="text-sm font-black text-green-400">
                                      ₹
                                      {Number(ps.price).toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell>
                                      {isApproved ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                                          <CheckCircle2 className="w-3 h-3" />{" "}
                                          ✅ Payment Successful
                                        </span>
                                      ) : isCancelled ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                          <XCircle className="w-3 h-3" />{" "}
                                          Cancelled
                                        </span>
                                      ) : isProcessing ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse">
                                          <Clock className="w-3 h-3" />{" "}
                                          Processing
                                        </span>
                                      ) : isRejected ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                          <XCircle className="w-3 h-3" />{" "}
                                          Rejected
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-muted/50 text-muted-foreground border border-border">
                                          Pending
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                                      {ps.updatedAt
                                        ? new Date(
                                            Number(ps.updatedAt) / 1_000_000,
                                          ).toLocaleString("en-IN")
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      {!isApproved &&
                                      !isCancelled &&
                                      !isRejected ? (
                                        <div className="flex gap-1.5 flex-wrap">
                                          <button
                                            type="button"
                                            disabled={
                                              approvingPayment === idStr
                                            }
                                            onClick={async () => {
                                              if (!actor || !isIcLoggedIn) {
                                                toast.error(
                                                  "Connect IC Identity first to approve payments.",
                                                );
                                                return;
                                              }
                                              setApprovingPayment(idStr);
                                              try {
                                                await (
                                                  actor as unknown as FullBackend
                                                ).approvePayment(ps.orderId);
                                                toast.success(
                                                  `Payment approved for ${ps.contactName}!`,
                                                );
                                                await refreshPaymentStatuses();
                                              } catch {
                                                toast.error(
                                                  "Failed to approve payment. Try again.",
                                                );
                                              } finally {
                                                setApprovingPayment(null);
                                              }
                                            }}
                                            data-ocid={`admin.payments.approve_button.${idx + 1}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30 transition-all disabled:opacity-60"
                                          >
                                            {approvingPayment === idStr ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : null}
                                            Mark Successful ✅
                                          </button>
                                          <button
                                            type="button"
                                            disabled={
                                              approvingPayment ===
                                              `${idStr}_reject`
                                            }
                                            onClick={async () => {
                                              if (!actor || !isIcLoggedIn) {
                                                toast.error(
                                                  "Connect IC Identity first.",
                                                );
                                                return;
                                              }
                                              setApprovingPayment(
                                                `${idStr}_reject`,
                                              );
                                              try {
                                                await (
                                                  actor as unknown as FullBackend
                                                ).rejectPayment(ps.orderId);
                                                toast.error(
                                                  `Payment rejected for ${ps.contactName}`,
                                                );
                                                await refreshPaymentStatuses();
                                              } catch {
                                                toast.error(
                                                  "Failed to reject payment. Try again.",
                                                );
                                              } finally {
                                                setApprovingPayment(null);
                                              }
                                            }}
                                            data-ocid={`admin.payments.reject_button.${idx + 1}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all disabled:opacity-60"
                                          >
                                            {approvingPayment ===
                                            `${idStr}_reject` ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : null}
                                            Reject ❌
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground font-bold">
                                          —
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!sendDialogOrder}
        onOpenChange={(open) => {
          if (!open) closeSendDialog();
        }}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Send Edited Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customer:{" "}
              <span className="text-foreground font-medium">
                {sendDialogOrder?.name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Email:{" "}
              <span className="text-foreground font-medium">
                {sendDialogOrder?.email}
              </span>
            </p>
            <div className="space-y-2">
              <Label className="font-bold">Upload Edited Video</Label>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => editedVideoInputRef.current?.click()}
                data-ocid="admin.upload_button"
              >
                {editedUploadProgress > 0 && editedUploadProgress < 100 ? (
                  <div className="space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-bold text-primary">
                      {editedUploadProgress}% uploaded
                    </p>
                    <Progress value={editedUploadProgress} className="h-1.5" />
                  </div>
                ) : editedUploadProgress === 100 ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto" />
                    <p className="text-sm font-bold text-green-400">
                      Video uploaded!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-muted-foreground">
                      Click to upload edited video
                    </p>
                  </div>
                )}
              </button>
              <input
                ref={editedVideoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  clearEditedUploadError();
                  try {
                    const fileId = await uploadEditedVideo(file);
                    if (fileId && sendDialogOrder) {
                      toast.success(
                        "Edited video uploaded! Updating order status...",
                      );
                      if (actor) {
                        await (
                          actor as unknown as FullBackend
                        ).updateOrderStatus(
                          sendDialogOrder.id,
                          "Completed" as Status,
                        );
                        toast.success("Order marked as Completed!");
                        closeSendDialog();
                      }
                    }
                  } catch {
                    toast.error("Upload failed. Please try again.");
                  }
                }}
              />
              {editedUploadError && (
                <p className="text-xs text-destructive font-bold">
                  {editedUploadError}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
