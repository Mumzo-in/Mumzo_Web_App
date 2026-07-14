export type NotificationKind = "order" | "offer" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const seedNotifications: AppNotification[] = [
  {
    id: "n1",
    kind: "order",
    title: "Out for delivery",
    body: "Order #MZ48210934 is on its way — arriving in ~8 minutes.",
    time: "Just now",
    read: false,
  },
  {
    id: "n2",
    kind: "offer",
    title: "₹40 off your next order",
    body: "Use code MOM40 on orders above ₹299. Valid till tonight.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n3",
    kind: "order",
    title: "Order delivered",
    body: "Order #MZ48119045 was delivered. Tap to rate your experience.",
    time: "3 days ago",
    read: true,
  },
  {
    id: "n4",
    kind: "system",
    title: "Welcome to Mumzo 💛",
    body: "Everything for baby, in minutes. Now delivering across Hyderabad.",
    time: "1 week ago",
    read: true,
  },
];
