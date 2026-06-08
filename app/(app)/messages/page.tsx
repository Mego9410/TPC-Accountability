import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { getActivePartnership, getMessages } from "@/lib/data";
import { Body, Eyebrow, H1 } from "@/components/ui";
import { MessageThread } from "@/components/message-thread";
import { isPreviewMode } from "@/lib/preview";

export const metadata: Metadata = { title: "Correspondence" };

export default async function MessagesPage() {
  const { userId } = await requireUserProfile();
  const preview = await isPreviewMode();
  const partnership = await getActivePartnership(userId);

  if (!partnership) {
    return (
      <div className="section fade-enter">
        <Eyebrow>Correspondence</Eyebrow>
        <H1>The post.</H1>
        <div className="notice" style={{ maxWidth: 560 }}>
          A private line opens to your partner once you are matched.
        </div>
      </div>
    );
  }

  const messages = await getMessages(partnership.id);

  return (
    <div className="section fade-enter" style={{ maxWidth: 760 }}>
      <Eyebrow>Correspondence</Eyebrow>
      <H1>{surnameAddress(partnership.partner)}.</H1>
      <Body className="muted">
        A private line between sittings. Notes are seen only by the two of you.
      </Body>
      <MessageThread
        partnershipId={partnership.id}
        userId={userId}
        initialMessages={messages}
        demo={preview}
      />
    </div>
  );
}
