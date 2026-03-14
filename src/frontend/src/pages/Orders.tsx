import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  IndianRupee,
  Loader2,
  LogIn,
  MessageCircle,
  PackageOpen,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { backendInterface as FullBackend } from "../backend.d";
import StatusBadge from "../components/StatusBadge";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMyOrders } from "../hooks/useQueries";

function formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Orders() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: orders, isLoading, isError } = useGetMyOrders();
  const { actor } = useActor();
  const [approvedOrders, setApprovedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!orders || !actor || !isAuthenticated) return;
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
        setApprovedOrders(approvedSet);
      } catch {
        // silent
      }
    };
    loadApprovals();
  }, [orders, actor, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="card-glow w-full max-w-md bg-card border-border text-center">
          <CardContent className="p-10">
            <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-6">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-3">
              Login Required
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Please log in to view your order history.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-6 font-bold">
              <span>🔒</span>
              <span>Aapka data private aur secure hai</span>
            </div>
            <button
              onClick={login}
              disabled={isLoggingIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold h-12 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
              data-ocid="orders.primary_button"
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
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl mb-2">
              My <span className="gradient-text">Orders</span>
            </h1>
            <p className="text-muted-foreground">
              Track your video editing submissions
            </p>
          </div>
          <Button
            asChild
            className="gradient-primary border-0 text-white font-semibold hover:opacity-90 shrink-0"
            data-ocid="orders.primary_button"
          >
            <Link to="/submit">
              New Order <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>

        {isLoading && (
          <div className="space-y-4" data-ocid="orders.loading_state">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isError && (
          <Card
            className="bg-card border-destructive/50"
            data-ocid="orders.error_state"
          >
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                Could not load orders. Please try again.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && orders && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            data-ocid="orders.empty_state"
          >
            <Card className="card-glow bg-card border-border">
              <CardContent className="p-16 text-center">
                <div className="w-20 h-20 rounded-3xl bg-muted/30 mx-auto flex items-center justify-center mb-6">
                  <PackageOpen className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">
                  No orders yet
                </h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Submit your first video for professional editing!
                </p>
                <Button
                  asChild
                  className="gradient-primary border-0 text-white font-semibold hover:opacity-90"
                  data-ocid="orders.submit.primary_button"
                >
                  <Link to="/submit">Submit Your First Video</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isLoading && orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                data-ocid={`orders.item.${idx + 1}`}
              >
                <Card className="card-glow bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {order.videoFileName}
                          </p>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="mb-1.5">
                          {approvedOrders.has(order.id.toString()) ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-black bg-green-500/20 text-green-300 border border-green-500/50 shadow-sm shadow-green-500/20">
                              ✅ Payment Successful
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                              ⏳ Payment Pending Verification
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                          {order.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {Number(order.price)} — Order #{order.id.toString()}
                          </span>
                        </div>
                        {/* Premium WhatsApp send button */}
                        {[149, 499, 999].includes(Number(order.price)) && (
                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Hello PAIDEDIT! [PREMIUM - FREE VIDEO] My Customer ID: ${order.id.toString()}. Plan: ${order.description}. Sending my video now.`,
                              );
                              window.open(
                                `https://wa.me/919817056622?text=${msg}`,
                                "_blank",
                              );
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-opacity shadow-md"
                            data-ocid="orders.whatsapp.primary_button"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />💎 Send
                            Video on WhatsApp (FREE)
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
