import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/search",
      search: {
        cat: params.slug,
      },
    });
  },
});
