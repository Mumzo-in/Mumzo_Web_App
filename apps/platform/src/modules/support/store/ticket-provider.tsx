import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  CANNED_REPLY,
  seedTickets,
  type Ticket,
  ticketTimestamp,
} from "../data/ticket-data";

interface TicketContextValue {
  tickets: Ticket[];
  createTicket: (
    subject: string,
    orderId: string | null,
    body: string,
  ) => Ticket;
  addMessage: (ticketId: string, text: string) => void;
}

const TicketContext = createContext<TicketContextValue | null>(null);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);

  const createTicket = useCallback(
    (subject: string, orderId: string | null, body: string) => {
      const stamp = ticketTimestamp();
      const ticket: Ticket = {
        id: `TK${Math.floor(10000 + Math.random() * 89999)}`,
        subject,
        orderId,
        status: "open",
        createdAt: stamp,
        messages: [
          { id: "m1", from: "you", text: body, time: stamp },
          { id: "m2", from: "support", text: CANNED_REPLY, time: stamp },
        ],
      };
      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    },
    [],
  );

  const addMessage = useCallback((ticketId: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `m${t.messages.length + 1}`,
                  from: "you",
                  text,
                  time: ticketTimestamp(),
                },
              ],
            }
          : t,
      ),
    );
  }, []);

  const value = useMemo<TicketContextValue>(
    () => ({ tickets, createTicket, addMessage }),
    [tickets, createTicket, addMessage],
  );

  return (
    <TicketContext.Provider value={value}>{children}</TicketContext.Provider>
  );
}

export function useTickets(): TicketContextValue {
  const ctx = useContext(TicketContext);
  if (!ctx) {
    throw new Error("useTickets must be used inside <TicketProvider>");
  }
  return ctx;
}
