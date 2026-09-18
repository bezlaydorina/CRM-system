"use client";

import { useRef } from "react";

export function AutoSubmitSelect({
  name,
  defaultValue,
  children,
  className,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSelectElement>(null);
  return (
    <select
      ref={ref}
      name={name}
      defaultValue={defaultValue}
      onChange={() => ref.current?.form?.requestSubmit()}
      className={className}
    >
      {children}
    </select>
  );
}
