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
  PackageOpen,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
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
            <p className="text-muted-foreground text-sm mb-8">
              Log in to view your order history.
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full gradient-primary border-0 text-white font-semibold h-12 hover:opacity-90"
              data-ocid="orders.primary_button"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Login to View Orders
            </Button>
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
                Failed to load orders. Please try again.
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
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                          {order.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            {Number(order.price)} — Order #{order.id.toString()}
                          </span>
                        </div>
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
