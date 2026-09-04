"use client";

import { Button } from "@/components/ui";

/** Prints the current page. Hidden in print by the `no-print` class. */
export function PrintButton({ children = "Print this review" }: { children?: React.ReactNode }) {
  return (
    <Button variant="secondary" size="sm" className="no-print" onClick={() => window.print()}>
      {children}
    </Button>
  );
}
