import type { Confidence, Deadline, SourceRef, Sourced, VerificationStatus } from "@/lib/types";

export function source(source_name: string, source_url: string, confidence: Confidence = "medium"): SourceRef {
  return { source_name, source_url, last_verified: null, confidence };
}

export function reported<T>(value: T, ref: SourceRef, note?: string): Sourced<T> {
  return { ...ref, value, status: "reported", note };
}

export function unverified<T>(value: T, ref: SourceRef, note?: string): Sourced<T> {
  return { ...ref, value, status: "needs_verification", confidence: "low", note };
}

export function unavailable<T>(ref: SourceRef, note?: string): Sourced<T> {
  return { ...ref, value: null, status: "unavailable", confidence: "low", note };
}

export function deadline(
  label: string,
  month: number,
  day: number,
  status: VerificationStatus = "reported",
  confidence: Confidence = "medium",
): Deadline {
  return { label, month, day, status, confidence };
}
