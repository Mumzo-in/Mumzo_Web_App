type OpsCancelledBadgeProps = {
  count: number;
};

/** Return/return-requested orders aren't a kanban column — just a count,
 * off to the side. Cancelled orders get their own board column instead. */
export function OpsCancelledBadge({ count }: OpsCancelledBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive text-xs"
      data-testid="ops-cancelled-badge"
    >
      {count} return{count === 1 ? "" : "s"}
    </span>
  );
}

export default OpsCancelledBadge;
