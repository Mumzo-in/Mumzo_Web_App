import { Spinner } from "@mumzo/ui/components/spinner";

export function Loader() {
  return (
    <div
      className="flex h-full min-h-64 items-center justify-center p-8"
      data-testid="admin-loader"
    >
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}

export default Loader;
