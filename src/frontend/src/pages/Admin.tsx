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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function formatDate(ns: bigint) {
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
  const [paymentStatuses, setPaymentStatuses] = useState<
    Record<string, "Paid" | "Unpaid">
  >({});
  const [approvedPayments, setApprovedPayments] = useState<Set<string>>(
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
  const [activeTab, setActiveTab] = useState("orders");

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
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorMsg,
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
  const customerIdMap = (customers ?? []).reduce<Record<string, string>>(
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
  const [activeChatSession, setActiveChatSession] = useState<string | null>(
    null,
  );
  const [adminReplyText, setAdminReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
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

  const [chatLoadError, setChatLoadError] = useState<string | null>(null);
  const [_chatRetrying, setChatRetrying] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [cancelledPayments, setCancelledPayments] = useState<
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

  const handleAdminReply = async () => {
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

  const sessionIds = customerChats.map((c) => c.customer.toString());
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

  const togglePaymentStatus = useCallback((orderId: bigint) => {
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

  const handleStatusChange = async (orderId: bigint, newStatus: Status) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success("Order status updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  };

  const handleDownload = async (
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

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 bg-muted/30 border border-border">
              <TabsTrigger
                value="orders"
                className="font-bold gap-1.5"
                data-ocid="admin.orders.tab"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Orders
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="font-bold gap-1.5"
                data-ocid="admin.plans.tab"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Plans
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="font-bold gap-1.5"
                data-ocid="admin.stats.tab"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Stats
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="font-bold gap-1.5"
                data-ocid="admin.payments.tab"
              >
                <CreditCard className="w-3.5 h-3.5" /> Payments
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="font-bold gap-1.5 text-destructive data-[state=active]:text-destructive"
                data-ocid="admin.cancelled.tab"
              >
                ❌ Cancelled{" "}
                {cancelledPayments.length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                    {cancelledPayments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ===== ORDERS TAB ===== */}
            <TabsContent value="orders">
              <Card
                className="card-glow bg-card border-border"
                data-ocid="admin.table"
              >
                <CardHeader>
                  <CardTitle className="font-display text-2xl">
                    All Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {ordersLoading ? (
                    <div
                      className="p-6 space-y-3"
                      data-ocid="admin.loading_state"
                    >
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : ordersError ? (
                    <div
                      className="p-12 text-center"
                      data-ocid="admin.error_state"
                    >
                      <p className="text-destructive text-sm font-medium mb-2">
                        Could not load orders.
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {ordersErrorMsg instanceof Error
                          ? ordersErrorMsg.message
                          : "Please check your connection and try again."}
                      </p>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div
                      className="p-12 text-center"
                      data-ocid="admin.empty_state"
                    >
                      <p className="text-muted-foreground font-bold">
                        No orders yet. Orders from customers will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-xs font-medium">
                              ID
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium">
                              Customer
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                              Email
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium">
                              Video
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden lg:table-cell">
                              Description
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium">
                              Status
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                              Payment
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                              Pay Status
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                              Date
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium hidden sm:table-cell">
                              Approve
                            </TableHead>
                            <TableHead className="text-muted-foreground text-xs font-medium">
                              Update
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order, idx) => {
                            const payStatus =
                              paymentStatuses[order.id.toString()] ?? "Unpaid";
                            const isPaid = payStatus === "Paid";
                            const isPremiumOrder =
                              order.description?.includes("\u20b9499") ||
                              order.description?.includes("\u20b9999");
                            const isPayApproved = approvedPayments.has(
                              order.id.toString(),
                            );
                            return (
                              <TableRow
                                key={order.id.toString()}
                                className="border-border hover:bg-muted/10"
                                data-ocid={`admin.row.${idx + 1}`}
                              >
                                <TableCell className="text-xs text-muted-foreground font-mono">
                                  #{order.id.toString()}
                                </TableCell>
                                <TableCell className="text-sm font-medium max-w-[160px]">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate max-w-[90px] font-bold">
                                        {order.contactName}
                                      </span>
                                      {isPremiumOrder && (
                                        <span
                                          title="Premium Member"
                                          style={{
                                            filter:
                                              "drop-shadow(0 0 4px #a855f7)",
                                            fontSize: "14px",
                                          }}
                                        >
                                          💎
                                        </span>
                                      )}
                                    </div>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 w-fit">
                                      {customerIdMap[
                                        order.userId?.toString() ?? ""
                                      ] ?? "PAID-????"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[140px] truncate">
                                  {order.contactEmail}
                                </TableCell>
                                <TableCell className="text-xs max-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate max-w-[90px]">
                                      {order.videoFileName}
                                    </span>
                                    {order.videoFileId && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-primary"
                                        onClick={() =>
                                          handleDownload(
                                            order.videoFileId,
                                            order.videoFileName,
                                          )
                                        }
                                        title="Download video"
                                        data-ocid="admin.download_button"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 shrink-0 text-green-500 hover:text-green-400"
                                      onClick={() =>
                                        setSendDialogOrder({
                                          id: order.id,
                                          name: order.contactName,
                                          email: order.contactEmail,
                                        })
                                      }
                                      title="Send edited video to customer"
                                      data-ocid="admin.send_button"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-[180px]">
                                  <p className="line-clamp-2">
                                    {order.description}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={order.status} />
                                </TableCell>
                                <TableCell className="text-xs font-semibold text-green-400 hidden sm:table-cell whitespace-nowrap">
                                  ₹{Number(order.price).toLocaleString("en-IN")}
                                </TableCell>
                                {/* Pay Status Toggle */}
                                <TableCell className="hidden sm:table-cell">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePaymentStatus(order.id)
                                    }
                                    data-ocid={`admin.payment_status_toggle.${idx + 1}`}
                                    className={[
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border",
                                      isPaid
                                        ? "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25"
                                        : "bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25",
                                    ].join(" ")}
                                    title={`Mark as ${isPaid ? "Unpaid" : "Paid"}`}
                                  >
                                    {isPaid ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                    {payStatus}
                                  </button>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                  {formatDate(order.createdAt)}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {isPayApproved ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
                                      ✅ Approved
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={
                                        approvingPayment === order.id.toString()
                                      }
                                      onClick={async () => {
                                        if (!actor || !isIcLoggedIn) {
                                          toast.error(
                                            "Connect IC Identity first to approve payments.",
                                          );
                                          return;
                                        }
                                        const idStr = order.id.toString();
                                        setApprovingPayment(idStr);
                                        try {
                                          await (
                                            actor as unknown as FullBackend
                                          ).approvePayment(order.id);
                                          setApprovedPayments((prev) => {
                                            const next = new Set(prev);
                                            next.add(idStr);
                                            return next;
                                          });
                                          // Also sync localStorage Paid status
                                          setPaymentStatuses((prev) => ({
                                            ...prev,
                                            [idStr]: "Paid",
                                          }));
                                          localStorage.setItem(
                                            `paidedit_payment_status_${order.id}`,
                                            "Paid",
                                          );
                                          toast.success(
                                            `Payment approved for ${order.contactName}!`,
                                          );
                                        } catch {
                                          toast.error(
                                            "Failed to approve payment. Try again.",
                                          );
                                        } finally {
                                          setApprovingPayment(null);
                                        }
                                      }}
                                      data-ocid={`admin.approve_button.${idx + 1}`}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer border bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-60"
                                    >
                                      {approvingPayment ===
                                      order.id.toString() ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : null}
                                      Approve
                                    </button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={order.status as string}
                                    onValueChange={(val) => {
                                      handleStatusChange(
                                        order.id,
                                        val as Status,
                                      );
                                    }}
                                  >
                                    <SelectTrigger
                                      className="w-32 h-7 text-xs border-border bg-muted/30"
                                      data-ocid={`admin.status_select.${idx + 1}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                      <SelectItem
                                        value="Pending"
                                        className="text-xs font-bold"
                                      >
                                        Pending
                                      </SelectItem>
                                      <SelectItem
                                        value="InProgress"
                                        className="text-xs font-bold"
                                      >
                                        In Progress
                                      </SelectItem>
                                      <SelectItem
                                        value="Completed"
                                        className="text-xs font-bold"
                                      >
                                        Completed
                                      </SelectItem>
                                      <SelectItem
                                        value="Cancelled"
                                        className="text-xs font-bold"
                                      >
                                        Cancelled
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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

              {/* Live Support Chat */}
              <Card
                className="card-glow bg-card border-border mt-8"
                data-ocid="admin.chat.panel"
              >
                <CardHeader>
                  <CardTitle className="font-display text-2xl flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-violet-400" />
                    Live Support Chat
                    {sessionIds.length > 0 && (
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {sessionIds.length} conversation
                        {sessionIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1.5 text-xs font-bold">
                      <CircleDot
                        className={`w-3 h-3 ${chatConnected ? "text-green-400" : isIcLoggedIn ? "text-yellow-400" : "text-muted-foreground"}`}
                      />
                      <span
                        className={
                          chatConnected
                            ? "text-green-400"
                            : isIcLoggedIn
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                        }
                      >
                        {chatConnected
                          ? "Connected"
                          : isIcLoggedIn
                            ? "Reconnecting..."
                            : "Not Connected"}
                      </span>
                    </span>
                  </CardTitle>
                  {!isIcLoggedIn ? (
                    <div
                      className="flex items-center gap-2 text-orange-400 text-xs bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 font-bold mt-2"
                      data-ocid="admin.chat.loading_state"
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      Connect IC Identity (Step 2 above) to view customer chats.
                    </div>
                  ) : chatLoadError ? (
                    <div
                      className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 font-bold mt-2"
                      data-ocid="admin.chat.error_state"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      {chatLoadError}
                      <button
                        onClick={refreshChats}
                        className="ml-auto text-xs underline hover:no-underline font-bold"
                        type="button"
                        data-ocid="admin.chat.button"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {sessionIds.length === 0 ? (
                    <div
                      className="text-center py-12"
                      data-ocid="admin.chat.empty_state"
                    >
                      <p className="text-4xl mb-3">💬</p>
                      <p className="text-muted-foreground font-bold">
                        No customer messages yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        When customers send a message via the chat widget, it
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 h-96">
                      {/* Conversation list */}
                      <div className="w-52 shrink-0 border border-border/50 rounded-xl overflow-hidden flex flex-col">
                        <p className="text-xs font-bold text-muted-foreground px-3 py-2 bg-muted/20 border-b border-border/50">
                          Customers
                        </p>
                        <div className="flex-1 overflow-y-auto">
                          {customerChats.map((cc, idx) => {
                            const sid = cc.customer.toString();
                            const msgs = cc.messages;
                            const last = msgs[msgs.length - 1];
                            const unread = msgs.some((m) => !m.fromAdmin);
                            return (
                              <button
                                key={sid}
                                type="button"
                                onClick={() => setActiveChatSession(sid)}
                                className={`w-full text-left px-3 py-2.5 border-b border-border/30 hover:bg-muted/30 transition-colors ${activeChatSession === sid ? "bg-violet-500/15 border-l-2 border-l-violet-500" : ""}`}
                                data-ocid={`admin.chat.item.${idx + 1}`}
                              >
                                <p className="text-xs font-bold text-foreground truncate">
                                  {unread && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1.5 shrink-0" />
                                  )}
                                  User {sid.slice(0, 16)}...
                                </p>
                                {last && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {last.fromAdmin ? "You: " : ""}
                                    {last.text}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message area */}
                      <div className="flex-1 border border-border/50 rounded-xl flex flex-col overflow-hidden">
                        {!activeChatSession ? (
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground font-bold">
                              ← Select a conversation
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="px-3 py-2 bg-violet-500/10 border-b border-violet-500/20 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-sm">
                                👤
                              </div>
                              <p className="text-xs font-bold text-violet-300">
                                User {activeChatSession.slice(0, 16)}...
                              </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                              {(
                                customerChats.find(
                                  (c) =>
                                    c.customer.toString() === activeChatSession,
                                )?.messages ?? []
                              ).map((msg) => (
                                <div
                                  key={msg.id.toString()}
                                  className={`flex ${msg.fromAdmin ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-xl px-3 py-2 ${
                                      msg.fromAdmin
                                        ? "bg-violet-600/70 text-white rounded-tr-sm"
                                        : "bg-muted/50 border border-border/50 text-foreground rounded-tl-sm"
                                    }`}
                                  >
                                    {!msg.fromAdmin && (
                                      <p className="text-[10px] font-bold text-violet-400 mb-0.5">
                                        Customer
                                      </p>
                                    )}
                                    <p className="text-xs font-bold leading-snug">
                                      {msg.text}
                                    </p>
                                    <p className="text-[10px] mt-0.5 opacity-60">
                                      {new Date(
                                        Number(msg.timestamp / 1_000_000n),
                                      ).toLocaleTimeString("en-IN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div ref={chatBottomRef} />
                            </div>
                            <div className="p-3 border-t border-border/50 flex gap-2">
                              <input
                                type="text"
                                value={adminReplyText}
                                onChange={(e) =>
                                  setAdminReplyText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAdminReply();
                                }}
                                placeholder="Type a reply..."
                                className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50"
                                data-ocid="admin.chat.input"
                              />
                              <Button
                                type="button"
                                onClick={handleAdminReply}
                                disabled={
                                  !adminReplyText.trim() || replySending
                                }
                                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-3"
                                data-ocid="admin.chat.submit_button"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== PAYMENTS TAB ===== */}
            <TabsContent value="payments">
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
                                          Approved
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
                                            Approve ✅
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
            </TabsContent>

            <TabsContent value="plans">
              <div className="space-y-4">
                <Card className="card-glow bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">
                      Plan Overview
                    </CardTitle>
                    <p className="text-muted-foreground font-bold text-sm">
                      Current pricing and plan structure
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          name: "Free Fire Video Edit",
                          price: 50,
                          videos: "1 video",
                          validity: "Single edit",
                          badge: "🎮",
                        },
                        {
                          name: "High Quality Video",
                          price: 99,
                          videos: "4 videos/day",
                          validity: "1 day",
                          badge: "📹",
                        },
                        {
                          name: "15 Day Premium",
                          price: 149,
                          videos: "2 videos/day",
                          validity: "15 days",
                          badge: "💎",
                          premium: true,
                        },
                        {
                          name: "Free Fire 15 Day Package",
                          price: 499,
                          videos: "2 videos/day",
                          validity: "15 days",
                          badge: "🔥",
                          premium: true,
                        },
                        {
                          name: "Free Fire 1 Month",
                          price: 999,
                          videos: "2 videos/day",
                          validity: "1 month",
                          badge: "👑",
                          premium: true,
                        },
                      ].map((plan) => (
                        <Card
                          key={plan.name}
                          className={`border ${plan.premium ? "border-violet-500/40 bg-violet-500/5" : "border-border bg-muted/20"}`}
                        >
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-2xl">{plan.badge}</span>
                              {plan.premium && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="font-black text-foreground text-sm">
                              {plan.name}
                            </p>
                            <p className="text-2xl font-black text-primary mt-1">
                              ₹{plan.price}
                            </p>
                            <p className="text-xs text-muted-foreground font-bold mt-1">
                              {plan.videos} • {plan.validity}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Orders",
                      value: orders?.length ?? 0,
                      icon: ClipboardList,
                      color: "primary",
                    },
                    {
                      label: "Pending",
                      value:
                        orders?.filter((o) => o.status === "Pending").length ??
                        0,
                      icon: Clock,
                      color: "orange",
                    },
                    {
                      label: "In Progress",
                      value:
                        orders?.filter((o) => o.status === "InProgress")
                          .length ?? 0,
                      icon: TrendingUp,
                      color: "blue",
                    },
                    {
                      label: "Completed",
                      value:
                        orders?.filter((o) => o.status === "Completed")
                          .length ?? 0,
                      icon: CheckCircle2,
                      color: "green",
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card
                      key={label}
                      className="card-glow bg-card border-border"
                    >
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon
                            className={`w-4 h-4 ${color === "orange" ? "text-orange-400" : color === "blue" ? "text-blue-400" : color === "green" ? "text-green-400" : "text-primary"}`}
                          />
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {label}
                          </p>
                        </div>
                        <p className="text-3xl font-black text-foreground">
                          {value}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="card-glow bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">
                      Revenue Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-xs font-bold text-green-400 uppercase mb-1">
                          Total Revenue (Approved)
                        </p>
                        <p className="text-2xl font-black text-green-300">
                          ₹
                          {backendPaymentStatuses
                            .filter((s) => s.status === "Approved")
                            .reduce((sum, s) => sum + Number(s.price), 0)
                            .toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <p className="text-xs font-bold text-orange-400 uppercase mb-1">
                          Processing
                        </p>
                        <p className="text-2xl font-black text-orange-300">
                          ₹
                          {backendPaymentStatuses
                            .filter((s) => s.status === "Processing")
                            .reduce((sum, s) => sum + Number(s.price), 0)
                            .toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cancelled">
              <Card
                className="card-glow bg-card border-border"
                data-ocid="admin.cancelled_payments.section"
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-2xl flex items-center gap-2">
                      ❌ Cancelled Payments
                      {backendPaymentStatuses.filter(
                        (s) => s.status === "Cancelled",
                      ).length > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-sm rounded-full px-2 py-0.5">
                          {
                            backendPaymentStatuses.filter(
                              (s) => s.status === "Cancelled",
                            ).length
                          }
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground font-bold text-sm mt-1">
                      Customers who cancelled before completing payment
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {backendPaymentStatuses.filter(
                    (s) => s.status === "Cancelled",
                  ).length === 0 ? (
                    <div
                      className="p-8 text-center text-muted-foreground font-bold"
                      data-ocid="admin.cancelled_payments.empty_state"
                    >
                      No cancelled payments yet
                    </div>
                  ) : (
                    <Table data-ocid="admin.cancelled_payments.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">
                            Customer ID
                          </TableHead>
                          <TableHead className="font-bold">
                            Customer Name
                          </TableHead>
                          <TableHead className="font-bold">Amount</TableHead>
                          <TableHead className="font-bold">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backendPaymentStatuses
                          .filter((s) => s.status === "Cancelled")
                          .map((ps, idx) => (
                            <TableRow
                              key={ps.orderId.toString()}
                              className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                              data-ocid={`admin.cancelled_payments.row.${idx + 1}`}
                            >
                              <TableCell className="font-bold text-destructive">
                                {ps.customerId || "—"}
                              </TableCell>
                              <TableCell className="font-bold">
                                {ps.contactName}
                              </TableCell>
                              <TableCell className="font-bold text-destructive">
                                ₹{Number(ps.price).toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="font-bold text-muted-foreground text-xs">
                                {ps.updatedAt
                                  ? new Date(
                                      Number(ps.updatedAt) / 1_000_000,
                                    ).toLocaleString("en-IN")
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
