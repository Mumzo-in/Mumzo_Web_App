import * as customerEventsRepo from "./customer-events.repo";

export async function listCustomerEvents(filters: {
  page: number;
  limit: number;
  userId?: string;
  action?: string;
  search?: string;
}) {
  const { rows, total } = await customerEventsRepo.findPage(filters);

  return {
    data: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}
