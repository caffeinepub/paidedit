import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  ShieldX,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Status } from "../backend";
import StatusBadge from "../components/StatusBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllOrders,
  useGetOrderStats,
  useIsAdmin,
  useUpdateOrderStatus,
} from "../hooks/useQueries";

function formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Admin() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useGetOrderStats();
  const { data: orders, isLoading: ordersLoading } = useGetAllOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: bigint, newStatus: Status) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success("Order status updated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update";
      toast.error(msg);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="card-glow max-w-md w-full bg-card border-border text-center">
          <CardContent className="p-10">
            <ShieldX className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl mb-3">
              Access Denied
            </h2>
            <p className="text-muted-foreground text-sm">
              You must be logged in to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingAdmin) {
    return (
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4"
        data-ocid="admin.error_state"
      >
        <Card className="card-glow max-w-md w-full bg-card border-destructive/40 text-center">
          <CardContent className="p-10">
            <ShieldX className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="font-display font-bold text-2xl mb-3">
              Access Denied
            </h2>
            <p className="text-muted-foreground text-sm">
              You don't have admin privileges to access this panel.
            </p>
          </CardContent>
        </Card>
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
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-2">
            Admin <span className="gradient-text">Panel</span>
          </h1>
          <p className="text-muted-foreground">
            Manage all video editing orders
          </p>
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
            <CardTitle className="font-display text-2xl">All Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="p-6 space-y-3" data-ocid="admin.loading_state">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="p-12 text-center" data-ocid="admin.empty_state">
                <p className="text-muted-foreground">No orders found.</p>
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
                      <TableHead className="text-muted-foreground text-xs font-medium hidden md:table-cell">
                        Phone
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
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {order.contactPhone}
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">
                          {order.videoFileName}
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
      </div>
    </div>
  );
}
