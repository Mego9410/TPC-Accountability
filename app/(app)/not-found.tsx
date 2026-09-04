import { Body, Button, Eyebrow, H1 } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="section fade-enter">
      <Eyebrow>Not found</Eyebrow>
      <H1>There is no such room.</H1>
      <Body className="muted maxw-prose">The link may be old, or the thing it pointed to has been set aside.</Body>
      <div className="row">
        <Button href="/home" variant="secondary">Return home</Button>
      </div>
    </div>
  );
}
