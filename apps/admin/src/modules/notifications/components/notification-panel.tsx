import { Button } from "@mumzo/ui/components/button";
import { Empty, EmptyMedia, EmptyTitle } from "@mumzo/ui/components/empty";
import { ScrollArea } from "@mumzo/ui/components/scroll-area";
import { Separator } from "@mumzo/ui/components/separator";
import { BellOff } from "lucide-react";
import { useNotifications } from "../context/notification-provider";
import { NotificationCard } from "./notification-card";

export function NotificationPanel() {
  const { notifications, markAllRead, markRead, clear } = useNotifications();

  return (
    <div
      className="flex w-96 flex-col gap-2 p-2"
      data-testid="notification-panel"
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="font-medium text-foreground text-sm">Notifications</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>
      <Separator />
      {notifications.length === 0 ? (
        <Empty className="py-8">
          <EmptyMedia>
            <BellOff className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No notifications yet</EmptyTitle>
        </Empty>
      ) : (
        <ScrollArea className="h-96">
          <div className="flex flex-col gap-1">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onOpen={markRead}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
