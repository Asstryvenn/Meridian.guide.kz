import type { Application } from "@/lib/types";
import { msg } from "@/lib/i18n/catalog";

export const statusLabel: Record<Application["status"], string> = {
  researching: msg("Researching"),
  preparing: msg("Preparing"),
  submitted: msg("Submitted"),
  decision: msg("Decision received"),
};

export function applicationProgress(application: Application): number {
  const items = [...application.documents, ...application.essays];
  return items.length ? items.filter((i) => i.done).length / items.length : 0;
}
