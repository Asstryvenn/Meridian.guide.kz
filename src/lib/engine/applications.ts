import type { Application } from "@/lib/types";

export const statusLabel: Record<Application["status"], string> = {
  researching: "Researching",
  preparing: "Preparing",
  submitted: "Submitted",
  decision: "Decision received",
};

export function applicationProgress(application: Application): number {
  const items = [...application.documents, ...application.essays];
  return items.length ? items.filter((i) => i.done).length / items.length : 0;
}
