"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { useId, type ReactNode } from "react";
import styles from "./fields.module.css";

interface FieldShellProps {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
  className?: string;
}

function FieldShell({ label, hint, children, className }: FieldShellProps) {
  const id = useId();
  return (
    <div className={clsx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(id)}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  className,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "url";
  autoComplete?: string;
  className?: string;
}) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          type={type}
          className={styles.input}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </FieldShell>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, className }: { label: string; hint?: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id) => <textarea id={id} className={clsx(styles.input, styles.textarea)} value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />}
    </FieldShell>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  className,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={clsx(styles.input, "tabular")}
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder ?? "—"}
          onChange={(e) => {
            if (e.target.value === "") return onChange(null);
            const parsed = Number(e.target.value);
            if (Number.isNaN(parsed)) return;
            onChange(max !== undefined ? Math.min(max, parsed) : parsed);
          }}
        />
      )}
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <FieldShell label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} className={clsx(styles.input, styles.select)} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function ChipGroup<T extends string>({
  label,
  hint,
  options,
  selected,
  onChange,
  single,
}: {
  label: string;
  hint?: string;
  options: readonly T[] | { value: T; label: string }[];
  selected: T[];
  onChange: (value: T[]) => void;
  single?: boolean;
}) {
  const normalized = (options as (T | { value: T; label: string })[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <fieldset className={styles.field}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.chips}>
        {normalized.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={clsx(styles.chip, active && styles.chipActive)}
              onClick={() => {
                if (single) return onChange([option.value]);
                onChange(active ? selected.filter((s) => s !== option.value) : [...selected, option.value]);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </fieldset>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const groupId = useId();
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.segmented} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button key={option.value} type="button" role="radio" aria-checked={active} className={clsx(styles.segment, active && styles.segmentActive)} onClick={() => onChange(option.value)}>
              {active && <motion.span layoutId={`seg-${groupId}`} className={styles.segmentThumb} transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className={styles.segmentLabel}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={styles.toggleRow} onClick={() => onChange(!checked)}>
      <span className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      <span className={clsx(styles.switch, checked && styles.switchOn)}>
        <motion.span layout className={styles.knob} transition={{ type: "spring", stiffness: 520, damping: 32 }} />
      </span>
    </button>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <div className={styles.rangeHeader}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={clsx(styles.rangeValue, "tabular")}>{format(value)}</span>
      </div>
      <input id={id} type="range" className={styles.range} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
