import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  IndianRupee,
  Loader2,
  MessageCircle,
  Smartphone,
  Video,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitOrder } from "../hooks/useQueries";

const UPI_ID = "s79576@ptyes";
const DAILY_UPLOAD_LIMIT = 10;
const PLAN_7_DAILY_LIMIT = 3;
const LIMITED_PLAN_IDS = [2, 5, 6, 7];
const PREMIUM_PLAN_IDS = [5, 6, 7];

const STEP_LABELS = [
  "Select Plan",
  "Your Details",
  "Send Video",
  "Send Money",
  "Verification",
  "Approved!",
];

function getTodayKey() {
  return `paidedit_upload_count_${new Date().toISOString().slice(0, 10)}`;
}
function getDailyUploads(): number {
  try {
    return Number.parseInt(localStorage.getItem(getTodayKey()) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}
function incrementDailyUploads() {
  try {
    const key = getTodayKey();
    const cur = getDailyUploads();
    localStorage.setItem(key, String(cur + 1));
  } catch {
    // ignore
  }
}

const PLANS = [
  {
    id: 0,
    name: "Free Fire Video Edit",
    subtitle: "Gaming Highlights • ₹50",
    price: 50,
    features: ["Free Fire highlights", "Gaming effects", "Music sync"],
    highlight: false,
    fireHot: true,
  },
  {
    id: 2,
    name: "High Quality Video",
    subtitle: "Full HD • 4 Videos • Valid 1 Day",
    price: 99,
    features: [
      "4 videos per day",
      "Full HD quality",
      "Color Grading + Effects",
      "Valid for 1 day",
    ],
  },
  {
    id: 5,
    name: "Free Fire 15 Day Package",
    subtitle: "Free Fire Only • 15 Days",
    price: 499,
    features: [
      "Free Fire edits only",
      "2 videos per day",
      "15 days validity",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: 6,
    name: "Free Fire 1 Month",
    subtitle: "Unlimited Gaming Edits • Best Offer",
    price: 999,
    features: [
      "Unlimited Free Fire edits",
      "Priority delivery",
      "24/7 support",
    ],
    highlight: false,
    bestOffer: true,
  },
  {
    id: 7,
    name: "15 Day Premium",
    subtitle: "2 videos/day • Premium 15 Days",
    price: 149,
    features: ["2 videos per day", "Premium quality", "Diamond status"],
    highlight: false,
    isPremium15: true,
  },
];

const UPI_APPS = [
  {
    id: "gpay",
    name: "Google Pay",
    shortName: "GPay",
    color: "#1A73E8",
    bgClass: "bg-white",
    textClass: "text-blue-600",
    borderClass: "border-blue-500/30 hover:border-blue-500/60",
    deepLink: (price: number) =>
      `gpay://upi/pay?pa=${UPI_ID}&pn=PAIDEDIT&am=${price}&cu=INR`,
    logo: "/assets/uploads/WhatsApp-Image-2026-03-13-at-2.49.37-PM-1--2.jpeg",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    shortName: "PhonePe",
    color: "#6739B7",
    bgClass: "bg-white",
    textClass: "text-purple-600",
    borderClass: "border-purple-500/30 hover:border-purple-500/60",
    deepLink: (price: number) =>
      `phonepe://pay?pa=${UPI_ID}&pn=PAIDEDIT&am=${price}&cu=INR`,
    logo: "/assets/uploads/WhatsApp-Image-2026-03-13-at-2.49.37-PM-3.jpeg",
  },
  {
    id: "paytm",
    name: "Paytm",
    shortName: "Paytm",
    color: "#00B9F1",
    bgClass: "bg-white",
    textClass: "text-sky-600",
    borderClass: "border-sky-500/30 hover:border-sky-500/60",
    deepLink: (price: number) =>
      `paytmmp://pay?pa=${UPI_ID}&pn=PAIDEDIT&am=${price}&cu=INR`,
    logo: "/assets/uploads/WhatsApp-Image-2026-03-13-at-2.49.36-PM-1.jpeg",
  },
  {
    id: "fampay",
    name: "FamPay",
    shortName: "FamPay",
    color: "#FFCD05",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-400/30 hover:border-yellow-400/60",
    deepLink: (price: number) =>
      `upi://pay?pa=${UPI_ID}&pn=PAIDEDIT&am=${price}&cu=INR`,
    logo: null,
  },
];

export default function Submit() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const navigate = useNavigate();
  const { actor } = useActor();
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState(1);
  const [contactName, setContactName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [dailyUploads, setDailyUploads] = useState(getDailyUploads);
  const [orderId, setOrderId] = useState<bigint | null>(null);
  const recordPaymentCancelled = useCallback(() => {
    if (!orderId) return;
    const key = `paidedit_cancelled_${orderId.toString()}`;
    const record = {
      orderId: orderId.toString(),
      customerName: contactName || "Unknown",
      customerId: customerId || "",
      plan:
        (PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0])?.name || "",
      price:
        (PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0])?.price || 0,
      cancelledAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(record));
    const listKey = "paidedit_cancelled_orders";
    const existing: string[] = JSON.parse(
      localStorage.getItem(listKey) || "[]",
    );
    if (!existing.includes(orderId.toString())) {
      existing.push(orderId.toString());
      localStorage.setItem(listKey, JSON.stringify(existing));
    }
    // Also notify backend
    if (actor) {
      (actor as any).cancelPayment(orderId).catch(() => {});
    }
  }, [orderId, contactName, customerId, selectedPlanId, actor]);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null,
  );
  const [screenshotSubmitted, setScreenshotSubmitted] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submitOrder = useSubmitOrder();

  // Auto-register user when actor & identity are available
  useEffect(() => {
    if (!actor || !identity) return;
    (actor as any)
      .selfRegister()
      .then((id: string) => {
        setCustomerId(id);
      })
      .catch(() => {});
  }, [actor, identity]);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0];
  const isLimitedPlan = LIMITED_PLAN_IDS.includes(selectedPlanId);
  const planDailyLimit =
    selectedPlanId === 7 ? PLAN_7_DAILY_LIMIT : DAILY_UPLOAD_LIMIT;
  const remainingToday = Math.max(0, planDailyLimit - dailyUploads);
  const limitReached = isLimitedPlan && remainingToday === 0;
  const isPremiumPlan = PREMIUM_PLAN_IDS.includes(selectedPlanId);
  const finalPrice = Math.max(0, selectedPlan.price - promoDiscount);

  // Poll for payment approval on step 5
  useEffect(() => {
    if (step !== 5 || !orderId) return;
    pollRef.current = setInterval(async () => {
      const key = `paidedit_payment_approved_${orderId.toString()}`;
      if (localStorage.getItem(key) === "true") {
        setPaymentApproved(true);
        if (pollRef.current) clearInterval(pollRef.current);
        setStep(6);
        return;
      }
      if (actor) {
        try {
          const approved = await (actor as any).isPaymentApproved(orderId);
          if (approved) {
            setPaymentApproved(true);
            if (pollRef.current) clearInterval(pollRef.current);
            setStep(6);
          }
        } catch {
          // ignore
        }
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, orderId, actor]);

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setUpiCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setUpiCopied(false), 2000);
    });
  };

  const handleUpiAppClick = (deepLink: string) => {
    window.location.href = deepLink;
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "PAID200") {
      if (selectedPlan.price >= 200) {
        setPromoDiscount(150);
        setPromoApplied(true);
        toast.success("Promo code applied! ₹150 off.");
      } else {
        toast.error("Promo code PAID200 is only valid on plans above ₹200.");
      }
    } else {
      toast.error("Invalid promo code.");
    }
  };

  const handleWhatsAppSend = () => {
    const premiumLabel = isPremiumPlan
      ? " [PREMIUM - FREE VIDEO INCLUDED]"
      : "";
    const msg = encodeURIComponent(
      `Hello PAIDEDIT!${premiumLabel} My name is ${contactName}, Customer ID: ${customerId || "pending"}. Plan: ${selectedPlan.name} - ₹${finalPrice}. I want to send my video for editing.`,
    );
    window.open(`https://wa.me/919817056622?text=${msg}`, "_blank");
    setWhatsappOpened(true);
  };

  const handleVideoSent = async () => {
    setOrderSubmitting(true);
    try {
      if (actor) {
        try {
          await (actor as any).selfRegister();
        } catch {}
      }
      // Try to save order in backend, but always proceed to payment regardless
      try {
        const result = await submitOrder.mutateAsync({
          videoFileId: "whatsapp",
          videoFileName: `${selectedPlan.name}-video`,
          description: `${selectedPlan.name} - ₹${finalPrice}`,
          contactName,
          contactEmail: `${mobileNumber}@customer.paidedit`,
          contactPhone: mobileNumber,
        });
        if (result && typeof result === "object" && "id" in result) {
          setOrderId((result as { id: bigint }).id);
        }
      } catch {
        // Backend save failed silently — still proceed to payment
      }
      if (isLimitedPlan) {
        incrementDailyUploads();
        setDailyUploads(getDailyUploads());
      }
      if (isPremiumPlan) {
        localStorage.setItem("paidedit_premium_plan", selectedPlan.name);
      }
      toast.success("Video sent! Please complete payment now.");
      setStep(4);
    } catch {
      // Even if everything fails, still go to payment
      toast.success("Video sent! Please complete payment now.");
      setStep(4);
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="card-glow w-full max-w-md bg-card border-border text-center">
            <CardContent className="p-10">
              <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-6">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display font-bold text-2xl mb-3">
                Login Required
              </h2>
              <p className="text-muted-foreground text-sm mb-8 font-bold">
                Please log in to submit a video for editing.
              </p>
              <button
                onClick={login}
                disabled={isLoggingIn}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold h-12 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
                data-ocid="submit.primary_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 48 48"
                    role="img"
                    aria-label="Google"
                  >
                    <title>Google</title>
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                )}
                Sign in with Google
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ---- Step Indicator ----
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-1">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                      ? "gradient-primary text-white shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              <span
                className={`text-[9px] font-bold whitespace-nowrap hidden sm:block ${
                  active
                    ? "text-primary"
                    : done
                      ? "text-green-400"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-4 sm:w-8 mx-1 rounded-full ${
                  done ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-3">
            Submit Your <span className="gradient-text">Video</span>
          </h1>
          <p className="text-muted-foreground text-lg font-bold">
            Follow the steps below to order your edit.
          </p>
          {customerId && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30">
              <span className="text-[10px] font-bold text-violet-400">
                Customer ID:
              </span>
              <span className="text-[11px] font-bold text-violet-200">
                {customerId}
              </span>
            </div>
          )}
        </motion.div>

        <StepIndicator />

        <AnimatePresence mode="wait">
          {/* ── STEP 1: SELECT PLAN ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    Choose a Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {PLANS.map((plan) => {
                      const isPrem = PREMIUM_PLAN_IDS.includes(plan.id);
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          data-ocid={`submit.plan.item.${plan.id}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative rounded-xl border-2 p-4 text-left cursor-pointer transition-all duration-200 ${
                            selectedPlanId === plan.id
                              ? "fireHot" in plan && plan.fireHot
                                ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50"
                                : "bestOffer" in plan && plan.bestOffer
                                  ? "border-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/50"
                                  : plan.highlight
                                    ? "border-amber-500 bg-amber-500/10"
                                    : "border-primary bg-primary/10"
                              : "fireHot" in plan && plan.fireHot
                                ? "border-orange-500/60 bg-orange-500/5 hover:border-orange-500/80"
                                : "bestOffer" in plan && plan.bestOffer
                                  ? "border-yellow-400/60 bg-yellow-400/5 hover:border-yellow-400/80"
                                  : "border-border bg-muted/10 hover:border-primary/40"
                          }`}
                        >
                          {"fireHot" in plan && plan.fireHot && (
                            <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white animate-pulse">
                              🔥 HOT
                            </span>
                          )}
                          {plan.highlight &&
                            !("fireHot" in plan && plan.fireHot) &&
                            !("bestOffer" in plan && plan.bestOffer) && (
                              <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                                BEST DEAL
                              </span>
                            )}
                          {"bestOffer" in plan && plan.bestOffer && (
                            <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-black animate-pulse">
                              🏆 BEST OFFER
                            </span>
                          )}
                          {isPrem && (
                            <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-0.5">
                              💎 PREMIUM
                            </span>
                          )}
                          {selectedPlanId === plan.id && (
                            <span className="absolute top-3 right-3">
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  isPrem
                                    ? "text-purple-400"
                                    : "bestOffer" in plan && plan.bestOffer
                                      ? "text-yellow-400"
                                      : plan.highlight
                                        ? "text-amber-400"
                                        : "text-primary"
                                }`}
                              />
                            </span>
                          )}
                          <div className="flex items-end gap-1 mb-2">
                            <IndianRupee
                              className={`w-4 h-4 mb-0.5 ${
                                selectedPlanId === plan.id
                                  ? isPrem
                                    ? "text-purple-400"
                                    : "fireHot" in plan && plan.fireHot
                                      ? "text-orange-400"
                                      : "bestOffer" in plan && plan.bestOffer
                                        ? "text-yellow-400"
                                        : plan.highlight
                                          ? "text-amber-400"
                                          : "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`font-display font-extrabold text-2xl leading-none ${
                                selectedPlanId === plan.id
                                  ? isPrem
                                    ? "text-purple-300"
                                    : "fireHot" in plan && plan.fireHot
                                      ? "text-orange-400"
                                      : "bestOffer" in plan && plan.bestOffer
                                        ? "text-yellow-300"
                                        : plan.highlight
                                          ? "text-amber-300"
                                          : "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {plan.price}
                            </span>
                          </div>
                          <p className="font-bold text-sm mb-1">{plan.name}</p>
                          <p className="text-muted-foreground text-xs mb-2 font-semibold">
                            {plan.subtitle}
                          </p>
                          <ul className="space-y-1">
                            {plan.features.map((feat) => (
                              <li
                                key={feat}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold"
                              >
                                <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                                {feat}
                              </li>
                            ))}
                          </ul>
                          {LIMITED_PLAN_IDS.includes(plan.id) && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-2 py-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Max{" "}
                              {plan.id === 2
                                ? 4
                                : plan.id === 7
                                  ? 2
                                  : plan.id === 5
                                    ? 2
                                    : 2}{" "}
                              videos/day
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isLimitedPlan && limitReached && (
                    <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-500/10 p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-red-400">
                        Daily limit reached ({planDailyLimit}/{planDailyLimit}).
                        Come back tomorrow.
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={limitReached}
                    className="w-full gradient-primary border-0 text-white font-bold h-12 hover:opacity-90 transition-opacity"
                    data-ocid="submit.primary_button"
                  >
                    Continue — {selectedPlan.name} ₹{selectedPlan.price}
                    {isPremiumPlan && " 💎"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: YOUR DETAILS ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Your Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Your Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-12 font-semibold"
                      data-ocid="submit.name_input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Mobile Number *</Label>
                    <Input
                      placeholder="Enter your mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      type="tel"
                      className="h-12 font-semibold"
                      data-ocid="submit.mobile_input"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-12 font-bold"
                      data-ocid="submit.cancel_button"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!contactName.trim() || !mobileNumber.trim()}
                      className="flex-[2] gradient-primary border-0 text-white font-bold h-12 hover:opacity-90 transition-opacity"
                      data-ocid="submit.primary_button"
                    >
                      Continue →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 3: SEND VIDEO ON WHATSAPP ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <span className="text-2xl">📱</span>
                    Send Your Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customerId && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30">
                      <span className="text-xs font-bold text-violet-400">
                        Customer ID:
                      </span>
                      <span className="text-sm font-bold text-violet-200">
                        {customerId}
                      </span>
                    </div>
                  )}

                  <div className="rounded-2xl bg-green-500/10 border-2 border-green-500/30 p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-500 mx-auto flex items-center justify-center">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="font-bold text-base">
                      Send your video to our WhatsApp business account
                    </p>
                    <p className="text-muted-foreground text-sm font-semibold">
                      Click the button below — your video will be sent directly
                      to our team for editing.
                    </p>
                    <button
                      type="button"
                      onClick={handleWhatsAppSend}
                      className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold h-14 rounded-xl text-base transition-colors shadow-lg shadow-green-500/30"
                      data-ocid="submit.primary_button"
                    >
                      <span className="text-2xl">📲</span>
                      Open WhatsApp & Send Video
                    </button>
                  </div>

                  {whatsappOpened && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-center">
                        <p className="text-sm font-bold text-blue-300">
                          ✅ After sending the video on WhatsApp, click below:
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleVideoSent}
                        disabled={orderSubmitting || submitOrder.isPending}
                        className="w-full gradient-primary border-0 text-white font-bold h-12 hover:opacity-90 transition-opacity"
                        data-ocid="submit.confirm_button"
                      >
                        {orderSubmitting || submitOrder.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                            Submitting Order...
                          </>
                        ) : (
                          "✅ I have sent the video"
                        )}
                      </Button>
                    </motion.div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full h-12 font-bold"
                    data-ocid="submit.cancel_button"
                  >
                    ← Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 4: SEND MONEY (UPI PAYMENT) ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    Complete Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <div className="rounded-2xl bg-primary/10 border-2 border-primary/30 p-5 text-center">
                    <p className="text-sm font-bold text-muted-foreground mb-1">
                      Amount to Pay
                    </p>
                    <p className="font-display font-extrabold text-5xl text-primary">
                      ₹{finalPrice}
                    </p>
                    {promoApplied && (
                      <p className="text-xs font-bold text-green-400 mt-1">
                        🎉 PAID200 applied — ₹150 off!
                      </p>
                    )}
                  </div>

                  {/* Promo code */}
                  {!promoApplied && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code (e.g. PAID200)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-10 font-semibold"
                        data-ocid="submit.promo_input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyPromo}
                        className="font-bold whitespace-nowrap"
                        data-ocid="submit.promo_button"
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                  {/* UPI ID */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      UPI ID
                    </p>
                    <div className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border p-3">
                      <span className="flex-1 font-bold text-sm font-mono">
                        {UPI_ID}
                      </span>
                      <button
                        type="button"
                        onClick={copyUpi}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                        data-ocid="submit.copy_button"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {upiCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Scan QR Code to Pay
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQrModalOpen(true)}
                        className="focus:outline-none"
                        data-ocid="submit.qr_code"
                      >
                        <img
                          src="/assets/uploads/WhatsApp-Image-2026-03-13-at-9.22.44-PM-1.jpeg"
                          alt="UPI QR Code"
                          className="w-52 h-52 rounded-xl object-cover bg-white p-2 mx-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                        />
                      </button>
                      <p className="text-xs font-bold text-muted-foreground text-center">
                        Scan with any UPI app &nbsp;·&nbsp;{" "}
                        <span className="text-primary">Tap to enlarge</span>
                      </p>
                    </div>
                  </div>

                  {/* Payment Apps */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Pay via App
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() =>
                            handleUpiAppClick(app.deepLink(finalPrice))
                          }
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all font-bold ${app.borderClass} bg-muted/10 hover:bg-muted/30`}
                          data-ocid={`submit.payment.${app.id}.button`}
                        >
                          {app.logo ? (
                            <img
                              src={app.logo}
                              alt={app.name}
                              className="w-9 h-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                              F
                            </div>
                          )}
                          <span className="text-sm font-bold">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank limit tip */}
                  <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-2">
                    <p className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Bank Limit Error? Try These:
                    </p>
                    <ul className="space-y-1">
                      <li className="text-xs font-semibold text-muted-foreground">
                        • Switch to a different UPI app (e.g. PhonePe → Google
                        Pay)
                      </li>
                      <li className="text-xs font-semibold text-muted-foreground">
                        • Check/increase your bank's UPI daily limit in your
                        bank app
                      </li>
                      <li className="text-xs font-semibold text-muted-foreground">
                        • Daily UPI limits reset at midnight
                      </li>
                      <li className="text-xs font-semibold text-muted-foreground">
                        • Contact support if the issue persists
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        recordPaymentCancelled();
                        setStep(3);
                      }}
                      className="flex-1 h-12 font-bold"
                      data-ocid="submit.cancel_button"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        if (actor && orderId) {
                          (actor as any)
                            .setPaymentProcessing(orderId)
                            .catch(() => {});
                        }
                        setStep(5);
                      }}
                      className="flex-[2] gradient-primary border-0 text-white font-bold h-12 hover:opacity-90"
                      data-ocid="submit.confirm_button"
                    >
                      ✅ I have paid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 5: VERIFICATION TIMER ── */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Screenshot Upload Card */}
              <Card className="card-glow bg-card border-border border-green-500/30">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-400" />
                    Upload Payment Screenshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {screenshotSubmitted ? (
                    <div
                      className="rounded-xl bg-green-500/15 border-2 border-green-500/50 p-5 text-center space-y-2"
                      data-ocid="submit.screenshot.success_state"
                    >
                      <div className="text-3xl">✅</div>
                      <p className="font-bold text-green-300 text-lg">
                        Screenshot submitted!
                      </p>
                      <p className="text-sm font-semibold text-green-400">
                        Waiting for admin verification...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label
                        className="flex flex-col items-center justify-center gap-3 w-full h-32 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                        htmlFor="screenshot-upload"
                      >
                        {screenshotPreview ? (
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            className="h-28 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-primary/60" />
                            <span className="text-sm font-bold text-muted-foreground">
                              Tap to select payment screenshot
                            </span>
                          </>
                        )}
                      </label>
                      <input
                        id="screenshot-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        data-ocid="submit.screenshot.upload_button"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setScreenshotFile(file);
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setScreenshotPreview(url);
                          } else {
                            setScreenshotPreview(null);
                          }
                        }}
                      />
                      <Button
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
                        disabled={!screenshotFile}
                        data-ocid="submit.screenshot.submit_button"
                        onClick={() => {
                          if (!screenshotFile) return;
                          setScreenshotSubmitted(true);
                          toast.success(
                            "Screenshot submitted! Admin will verify shortly.",
                          );
                        }}
                      >
                        Submit Screenshot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Payment Verification in Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-lg">
                      Verifying your payment...
                    </p>
                    <p className="text-muted-foreground text-sm font-semibold">
                      Your payment is being verified by our team. This usually
                      takes a few minutes.
                    </p>
                  </div>

                  {paymentApproved ? (
                    <div
                      className="rounded-xl bg-green-500/15 border-2 border-green-500/50 p-5 text-center space-y-2"
                      data-ocid="submit.payment.success_state"
                    >
                      <div className="text-3xl">✅</div>
                      <p className="text-lg font-black text-green-300">
                        Payment Successful!
                      </p>
                      <p className="text-sm font-bold text-green-400">
                        Your order is confirmed. Redirecting...
                      </p>
                      {customerId && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 mt-2">
                          <span className="text-xs font-bold text-green-400">
                            ID:
                          </span>
                          <span className="text-sm font-black text-green-200">
                            {customerId}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-bold text-green-400">
                        Waiting for admin verification...
                      </span>
                    </div>
                  )}

                  {customerId && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/15 border border-violet-500/30">
                      <span className="text-xs font-bold text-violet-400">
                        Customer ID:
                      </span>
                      <span className="text-sm font-bold text-violet-200">
                        {customerId}
                      </span>
                    </div>
                  )}

                  {orderId !== null && (
                    <div className="rounded-xl bg-muted/20 border border-border p-3">
                      <p className="text-xs font-bold text-muted-foreground">
                        Order ID
                      </p>
                      <p className="text-sm font-bold font-mono">
                        #{orderId.toString()}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
                    <p className="text-sm font-bold text-blue-300">
                      💡 Once admin approves your payment, this page will
                      automatically update.
                    </p>
                  </div>

                  <a
                    href="/support"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    data-ocid="submit.support_link"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                  </a>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      recordPaymentCancelled();
                      navigate({ to: "/" });
                    }}
                    className="w-full h-12 font-bold border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 mt-2"
                    data-ocid="submit.cancel_payment_button"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Payment
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 6: APPROVED ── */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <Card className="card-glow bg-card border-border">
                <CardContent className="p-10 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 mx-auto flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-14 h-14 text-green-400" />
                  </motion.div>

                  <div className="space-y-2">
                    <h2 className="font-display font-bold text-3xl text-green-400">
                      ✅ Payment Successful!
                    </h2>
                    <p className="text-muted-foreground font-bold">
                      Your order has been confirmed. We will start editing your
                      video soon!
                    </p>
                  </div>

                  <div className="rounded-2xl bg-muted/20 border border-border p-5 space-y-3 text-left">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Order Summary
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Plan</span>
                      <span className="text-sm font-bold text-primary">
                        {selectedPlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Amount Paid</span>
                      <span className="text-sm font-extrabold text-green-400">
                        ₹{finalPrice}
                      </span>
                    </div>
                    {customerId && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Customer ID</span>
                        <span className="text-sm font-bold text-violet-300">
                          {customerId}
                        </span>
                      </div>
                    )}
                    {orderId !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">Order ID</span>
                        <span className="text-sm font-bold font-mono">
                          #{orderId.toString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => navigate({ to: "/orders" })}
                    className="w-full gradient-primary border-0 text-white font-bold h-12 hover:opacity-90"
                    data-ocid="submit.orders_button"
                  >
                    View My Orders →
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Code Fullscreen Modal */}
      {qrModalOpen && (
        <dialog
          open
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 m-0 max-w-none w-full h-full border-0"
          onClick={() => setQrModalOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setQrModalOpen(false)}
          data-ocid="submit.qr_code.modal"
        >
          <div
            className="relative bg-white p-4 rounded-2xl max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="absolute -top-3 -right-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-800 transition-colors"
              data-ocid="submit.qr_code.close_button"
            >
              ✕
            </button>
            <img
              src="/assets/uploads/WhatsApp-Image-2026-03-13-at-9.22.44-PM-1.jpeg"
              alt="UPI QR Code - Full Size"
              className="w-full rounded-xl object-contain"
            />
            <p className="text-center text-sm font-bold text-gray-600 mt-3">
              Scan to Pay via UPI
            </p>
          </div>
        </dialog>
      )}
    </div>
  );
}
