import { Button } from "@mumzo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mumzo/ui/components/dropdown-menu";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "../api/auth-client";
import { useSignOut } from "../hooks/use-sign-out";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const { signOut } = useSignOut();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/auth/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {session.user.email &&
            !session.user.email.endsWith("@phone.mumzo.local") && (
              <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
            )}
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
