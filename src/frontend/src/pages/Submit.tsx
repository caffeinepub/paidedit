import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  FileVideo,
  IndianRupee,
  Loader2,
  LogIn,
  Smartphone,
  Upload,
  Video,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useFileUpload } from "../hooks/useFileUpload";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitOrder } from "../hooks/useQueries";

const UPI_ID = "9053405019@upi";

const PLANS = [
  {
    id: 1,
    name: "Instagram Reel",
    subtitle: "15 seconds • For Instagram",
    price: 49,
    features: ["15-second video", "Music + Captions"],
  },
  {
    id: 2,
    name: "High Quality Video",
    subtitle: "Full HD • Color Grading",
    price: 99,
    features: ["Full HD quality", "Color Grading + Effects"],
  },
  {
    id: 3,
    name: "5 Minute Video",
    subtitle: "Up to 5 minutes • Full HD",
    price: 149,
    features: ["Up to 5 min", "Transitions + Music"],
  },
  {
    id: 4,
    name: "1 Month Package",
    subtitle: "Unlimited • Priority",
    price: 149,
    features: ["Unlimited videos", "24/7 Support"],
  },
  {
    id: 5,
    name: "3 Month Package",
    subtitle: "Best Deal • Save ₹148",
    price: 499,
    features: ["Dedicated editor", "Priority support"],
    highlight: true,
  },
];

export default function Submit() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const navigate = useNavigate();

  const [selectedPlanId, setSelectedPlanId] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  const { uploadFile, uploadProgress, isUploading, uploadError } =
    useFileUpload();
  const submitOrder = useSubmitOrder();

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0];

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }
    setVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setUpiCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setUpiCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error("Please upload a video file.");
      return;
    }
    if (!contactName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe your editing requirements.");
      return;
    }

    try {
      const fileId = await uploadFile(videoFile);
      await submitOrder.mutateAsync({
        videoFileId: fileId,
        videoFileName: videoFile.name,
        description,
        contactName,
        contactEmail,
        contactPhone,
      });
      toast.success("Order submitted successfully!");
      navigate({ to: "/orders" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
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
              <p className="text-muted-foreground text-sm mb-8">
                Please log in to submit a video for editing.
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full gradient-primary border-0 text-white font-semibold h-12 hover:opacity-90"
                data-ocid="submit.primary_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const isSubmitting = isUploading || submitOrder.isPending;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-3">
            Submit Your <span className="gradient-text">Video</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Fill in the details below and we&apos;ll start editing your video.
          </p>
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="card-glow bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Choose a Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    data-ocid={`submit.plan.item.${plan.id}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-xl border-2 p-4 text-left cursor-pointer transition-all duration-200 ${
                      selectedPlanId === plan.id
                        ? plan.highlight
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-primary bg-primary/10"
                        : "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/20"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                        BEST DEAL
                      </span>
                    )}
                    {selectedPlanId === plan.id && (
                      <span className="absolute top-3 right-3">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            plan.highlight ? "text-amber-400" : "text-primary"
                          }`}
                        />
                      </span>
                    )}
                    <div className="flex items-end gap-1 mb-2">
                      <IndianRupee
                        className={`w-4 h-4 mb-0.5 ${
                          selectedPlanId === plan.id
                            ? plan.highlight
                              ? "text-amber-400"
                              : "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`font-display font-extrabold text-2xl leading-none ${
                          selectedPlanId === plan.id
                            ? plan.highlight
                              ? "text-amber-300"
                              : "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {plan.price}
                      </span>
                    </div>
                    <p className="font-semibold text-sm mb-1">{plan.name}</p>
                    <p className="text-muted-foreground text-xs mb-2">
                      {plan.subtitle}
                    </p>
                    <ul className="space-y-1">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Upload */}
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <FileVideo className="w-5 h-5 text-primary" />
                    Upload Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!videoFile ? (
                    <button
                      type="button"
                      className={`w-full relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                        dragOver
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-card/80"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() =>
                        document.getElementById("video-input")?.click()
                      }
                      data-ocid="submit.dropzone"
                    >
                      <input
                        id="video-input"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelect(f);
                        }}
                        data-ocid="submit.upload_button"
                      />
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
                        <Upload className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-semibold text-base mb-1">
                        Drag &amp; drop your video here
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Or click to browse — MP4, MOV, AVI, etc.
                      </p>
                    </button>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {videoFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="p-1 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-4" data-ocid="submit.loading_state">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>Uploading…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {uploadError && (
                    <p
                      className="mt-3 text-xs text-destructive"
                      data-ocid="submit.error_state"
                    >
                      Upload error: {uploadError}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Rahul Kumar"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="bg-input border-border"
                      data-ocid="submit.input"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="rahul@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      className="bg-input border-border"
                      data-ocid="submit.input"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      className="bg-input border-border"
                      data-ocid="submit.input"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Editing Requirements */}
              <Card className="card-glow bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Editing Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Describe what you want
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g. Add background music, cut the first 10 seconds, add text overlay with brand name..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="bg-input border-border resize-none"
                    data-ocid="submit.textarea"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right column – order summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Order Summary */}
                <Card className="card-glow bg-card border-primary/30 overflow-hidden">
                  <div className="h-1 gradient-primary" />
                  <CardHeader>
                    <CardTitle className="font-display text-xl">
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border">
                      <span className="text-sm text-muted-foreground">
                        {selectedPlan.name}
                      </span>
                      <div className="flex items-center gap-1 text-foreground font-semibold">
                        <IndianRupee className="w-4 h-4" />
                        {selectedPlan.price}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Total</span>
                      <div className="flex items-center gap-1 font-bold text-2xl gradient-text">
                        <IndianRupee className="w-5 h-5 text-primary" />
                        {selectedPlan.price}
                      </div>
                    </div>

                    {videoFile && (
                      <div className="rounded-lg bg-muted/20 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1 truncate">
                          {videoFile.name}
                        </p>
                        <p>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !videoFile}
                      className="w-full gradient-primary border-0 text-white font-semibold h-12 hover:opacity-90 transition-opacity disabled:opacity-50"
                      data-ocid="submit.submit_button"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {isUploading
                            ? `Uploading ${uploadProgress}%`
                            : "Submitting…"}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Place Order — ₹{selectedPlan.price}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* UPI Payment Card */}
                <Card className="card-glow bg-card border-green-500/30 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-400" />
                      Pay via UPI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      After submitting your order, pay ₹{selectedPlan.price} via
                      any UPI app (GPay, PhonePe, Paytm, etc.).
                    </p>

                    {/* UPI ID box */}
                    <div className="flex items-center gap-2 bg-muted/30 border border-green-500/20 rounded-xl px-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">
                          UPI ID
                        </p>
                        <p className="font-mono font-semibold text-sm text-green-300 truncate">
                          {UPI_ID}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyUpi}
                        className="shrink-0 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                        title="Copy UPI ID"
                        data-ocid="submit.secondary_button"
                      >
                        {upiCopied ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* UPI deep link */}
                    <a
                      href={`upi://pay?pa=${UPI_ID}&pn=PAIDEDIT&am=${selectedPlan.price}&cu=INR&tn=Video+Editing+Order`}
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                      data-ocid="submit.primary_button"
                    >
                      <IndianRupee className="w-4 h-4" />
                      Open UPI App — Pay ₹{selectedPlan.price}
                    </a>

                    <p className="text-[10px] text-muted-foreground text-center">
                      Share the payment screenshot on WhatsApp after paying.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
