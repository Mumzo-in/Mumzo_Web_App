import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mumzo/ui/components/popover";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/notification-provider";
import { NotificationPanel } from "./notification-panel";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="notification-bell"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="rounded-2xl border border-border bg-card p-0 text-foreground shadow-warm"
      >
        <NotificationPanel />
      </PopoverContent>
    </Popover>
  );
}
