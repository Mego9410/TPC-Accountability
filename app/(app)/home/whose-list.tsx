"use client";

import { useState, type ReactNode } from "react";

/**
 * Yours or theirs.
 *
 * Both lists are rendered on the server and handed in as children, so the
 * toggle costs one piece of state and no round trip. With no partner yet
 * there is nothing to switch between and the control does not appear.
 */
export function WhoseList({
  mine,
  theirs,
  theirName,
  mineTitle,
  theirsTitle,
}: {
  mine: ReactNode;
  theirs: ReactNode | null;
  theirName: string | null;
  mineTitle: ReactNode;
  theirsTitle: ReactNode;
}) {
  const [whose, setWhose] = useState<"mine" | "theirs">("mine");
  const showing = theirs && whose === "theirs" ? "theirs" : "mine";

  return (
    <>
      <div className="lg-list-head">
        <div>{showing === "mine" ? mineTitle : theirsTitle}</div>
        {theirs && theirName && (
          <div role="group" aria-label="Whose list" className="chip-row">
            <button className={`chip${showing === "mine" ? " on" : ""}`} aria-pressed={showing === "mine"} onClick={() => setWhose("mine")}>
              Yours
            </button>
            <button className={`chip${showing === "theirs" ? " on" : ""}`} aria-pressed={showing === "theirs"} onClick={() => setWhose("theirs")}>
              {theirName}&rsquo;s
            </button>
          </div>
        )}
      </div>
      {showing === "mine" ? mine : theirs}
    </>
  );
}
