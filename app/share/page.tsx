import { ShareCardPreview } from "@/components/ShareCardPreview";

/**
 * Share Card (#4) — renders the live preview of today's picks graphic and the
 * download / copy / share controls. The card is generated from the user's
 * actual picks, not a static asset.
 */
export default function SharePage() {
  return (
    <div className="px-4 pb-6 pt-4 lg:mx-auto lg:max-w-[460px]">
      <h1 className="text-2xl font-extrabold tracking-tight">Share Card</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Your picks, ready for the group chat.
      </p>

      <div className="mt-4">
        <ShareCardPreview />
      </div>
    </div>
  );
}
