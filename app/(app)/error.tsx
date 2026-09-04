"use client";

import { Body, Button, Card, Eyebrow, H1 } from "@/components/ui";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="section fade-enter">
      <Eyebrow>Something went wrong</Eyebrow>
      <H1>The page could not be prepared.</H1>
      <Body className="muted maxw-prose">
        The House has been told. You may try again, or return home. {error.digest && <span className="mono-sm">Ref {error.digest}</span>}
      </Body>
      <Card style={{ maxWidth: 480 }}>
        <div className="row gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button href="/home" variant="ghost">Return home</Button>
        </div>
      </Card>
    </div>
  );
}
