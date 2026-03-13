import { Badge } from "@/components/ui/badge";
import { Status } from "../backend";

const statusConfig: Record<Status, { label: string; className: string }> = {
  [Status.Pending]: {
    label: "Pending",
    className:
      "bg-yellow-500/15 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20",
  },
  [Status.InProgress]: {
    label: "In Progress",
    className:
      "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  },
  [Status.Completed]: {
    label: "Completed",
    className:
      "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20",
  },
  [Status.Cancelled]: {
    label: "Cancelled",
    className:
      "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20",
  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? { label: status, className: "" };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
