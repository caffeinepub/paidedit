import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Status } from "../backend";
import StatusBadge from "../components/StatusBadge";
import { loadConfig } from "../config";
import { useFileUpload } from "../hooks/useFileUpload";
import {
  useGetAllOrders,
  useGetOrderStats,
  useUpdateOrderStatus,
} from "../hooks/useQueries";

const ADMIN_MOBILE = "9053405019";
const SESSION_KEY = "paidedit_admin_session";

function formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(SESSION_KEY) === "true";
  });
  const [mobile, setMobile] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showMobile, setShowMobile] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(SESSION_KEY, "true");
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    const cleaned = mobile.replace(/\s+/g, "").trim();
    if (cleaned === ADMIN_MOBILE) {
      setIsAuthenticated(true);
      setLoginError("");
      toast.success("Admin login successful!");
    } else {
      setLoginError("Incorrect mobile number. Access denied.");
    }
  };

  const { data: stats, isLoading: statsLoading } = useGetOrderStats();
  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorMsg,
  } = useGetAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const [sendDialogOrder, setSendDialogOrder] = useState<{
    id: bigint;
    name: string;
    email: string;
  } | null>(null);
  const [editedVideoFile, setEditedVideoFile] = useState<File | null>(null);
  const [editedVideoLink, setEditedVideoLink] = useState<string | null>(null);
  const sendFileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadFile: uploadEditedVideo,
    uploadProgress: editedUploadProgress,
    isUploading: editedUploading,
    uploadError: editedUploadError,
    clearUploadError: clearEditedUploadError,
  } = useFileUpload();

  const handleSendVideo = async () => {
    if (!editedVideoFile) return;
    try {
      const config = await loadConfig();
      const hash = await uploadEditedVideo(editedVideoFile);
      const url = `${config.storage_gateway_url}/v1/blob/?blob_hash=${encodeURIComponent(hash)}&owner_id=${encodeURIComponent(config.backend_canister_id)}&project_id=${encodeURIComponent(config.project_id)}`;
      setEditedVideoLink(url);
      toast.success("Edited video uploaded! Share the link below.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    }
  };

  const closeSendDialog = () => {
    setSendDialogOrder(null);
    setEditedVideoFile(null);
    setEditedVideoLink(null);
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
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
                Admin Login
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your mobile number to access the admin panel
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label
                  htmlFor="admin-mobile-input"
                  className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"
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

              {loginError && (
                <div
                  className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2"
                  data-ocid="admin.login.error_state"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  {loginError}
                </div>
              )}

              <Button
                type="button"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={handleLogin}
                disabled={mobile.length < 10}
                data-ocid="admin.login.submit_button"
              >
                <LogIn className="w-4 h-4 mr-2" /> Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const statCards = [
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
      <div className="min-h-[calc(100vh-4rem)] py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex items-start justify-between"
          >
            <div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl mb-2">
                Admin <span className="gradient-text">Panel</span>
              </h1>
              <p className="text-muted-foreground">
                Manage all video editing orders
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 mt-1"
              onClick={() => {
                setIsAuthenticated(false);
                setMobile("");
              }}
              data-ocid="admin.logout_button"
            >
              Logout
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                data-ocid="admin.card"
              >
                <Card className="card-glow bg-card border-border">
                  <CardContent className="p-5">
                    <div
                      className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}
                    >
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mb-1" />
                    ) : (
                      <p className="font-display font-bold text-3xl">
                        {s.value.toString()}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">{s.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Orders Table */}
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
                <div className="p-6 space-y-3" data-ocid="admin.loading_state">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : ordersError ? (
                <div className="p-12 text-center" data-ocid="admin.error_state">
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
                <div className="p-12 text-center" data-ocid="admin.empty_state">
                  <p className="text-muted-foreground">
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
                          Date
                        </TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">
                          Update
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, idx) => (
                        <TableRow
                          key={order.id.toString()}
                          className="border-border hover:bg-muted/10"
                          data-ocid={`admin.row.${idx + 1}`}
                        >
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            #{order.id.toString()}
                          </TableCell>
                          <TableCell className="text-sm font-medium max-w-[120px] truncate">
                            {order.contactName}
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
                            <p className="line-clamp-2">{order.description}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(val) =>
                                handleStatusChange(order.id, val as Status)
                              }
                              disabled={updateStatus.isPending}
                            >
                              <SelectTrigger
                                className="h-8 w-[130px] text-xs bg-input border-border"
                                data-ocid="admin.select"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                <SelectItem
                                  value={Status.Pending}
                                  className="text-xs"
                                >
                                  Pending
                                </SelectItem>
                                <SelectItem
                                  value={Status.InProgress}
                                  className="text-xs"
                                >
                                  In Progress
                                </SelectItem>
                                <SelectItem
                                  value={Status.Completed}
                                  className="text-xs"
                                >
                                  Completed
                                </SelectItem>
                                <SelectItem
                                  value={Status.Cancelled}
                                  className="text-xs"
                                >
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Support */}
          <Card
            className="card-glow bg-card border-border mt-8"
            data-ocid="admin.support.card"
          >
            <CardHeader>
              <CardTitle className="font-display text-2xl flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary" /> Customer
                Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <a
                  href="mailto:paidedit081@gmail.com"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors bg-muted/20"
                  data-ocid="admin.support.email_link"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Support Email</p>
                    <p className="text-xs text-muted-foreground">
                      paidedit081@gmail.com
                    </p>
                  </div>
                </a>
                <a
                  href="https://www.instagram.com/paidedit081"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors bg-muted/20"
                  data-ocid="admin.support.instagram_link"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instagram DM</p>
                    <p className="text-xs text-muted-foreground">
                      @paidedit081
                    </p>
                  </div>
                </a>
                <a
                  href="https://wa.me/?text=Hello%2C+I+need+help+with+my+order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors bg-muted/20"
                  data-ocid="admin.support.whatsapp_link"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Open WhatsApp
                    </p>
                  </div>
                </a>
              </div>
              {orders && orders.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3 text-muted-foreground">
                    Customer Contacts from Orders
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {orders.map((order, idx) => (
                      <div
                        key={order.id.toString()}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {order.contactName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.contactEmail}
                          </p>
                          {order.contactPhone && (
                            <p className="text-xs text-muted-foreground">
                              {order.contactPhone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {order.contactEmail && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-blue-500 hover:text-blue-400"
                              onClick={() =>
                                window.open(
                                  `mailto:${order.contactEmail}?subject=Your PAIDEDIT Order %23${order.id}`,
                                  "_blank",
                                )
                              }
                              title="Send email"
                              data-ocid={`admin.support.email_button.${idx + 1}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-500 hover:text-green-400"
                            onClick={() =>
                              window.open(
                                `https://wa.me/?text=${encodeURIComponent(`Hi ${order.contactName}, your PAIDEDIT order #${order.id} update:`)}`,
                                "_blank",
                              )
                            }
                            title="WhatsApp"
                            data-ocid={`admin.support.whatsapp_button.${idx + 1}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
              {sendDialogOrder?.email && (
                <span className="ml-1">({sendDialogOrder.email})</span>
              )}
            </p>

            {!editedVideoLink ? (
              <>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => sendFileInputRef.current?.click()}
                  data-ocid="admin.dropzone"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {editedVideoFile
                      ? editedVideoFile.name
                      : "Click to select edited video (max 50MB)"}
                  </p>
                  {editedVideoFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(editedVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                </button>
                <input
                  ref={sendFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setEditedVideoFile(f);
                  }}
                />

                {editedUploading && (
                  <div className="space-y-2">
                    <Progress value={editedUploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Uploading {editedUploadProgress}%...
                    </p>
                  </div>
                )}

                {editedUploadError && (
                  <p className="text-xs text-destructive">
                    {editedUploadError}
                  </p>
                )}

                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!editedVideoFile || editedUploading}
                  onClick={handleSendVideo}
                  data-ocid="admin.upload_button"
                >
                  {editedUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Upload Edited Video
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-green-500 font-medium">
                  Video uploaded! Share this link with the customer:
                </p>
                <div className="bg-muted rounded-md p-3 text-xs break-all font-mono text-muted-foreground">
                  {editedVideoLink}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-xs border-border"
                    onClick={() => {
                      navigator.clipboard.writeText(editedVideoLink!);
                      toast.success("Link copied!");
                    }}
                    data-ocid="admin.copy_link_button"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(`Your edited video is ready! Download here: ${editedVideoLink}`)}`,
                        "_blank",
                      )
                    }
                    data-ocid="admin.whatsapp_button"
                  >
                    Send via WhatsApp
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={closeSendDialog}
                  data-ocid="admin.close_button"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
