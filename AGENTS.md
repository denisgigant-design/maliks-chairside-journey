<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The shop walkthrough is a canvas frame sequence (every 2nd frame of the original 240-frame film, desktop 16:9 and mobile 9:16) loaded from CDN asset pointers in `src/assets/tour/*`; stations are frame indices in `Tour.tsx`. Why: scroll scrubbing an image sequence is smooth on every browser, unlike seeking a video.
- Business data and rules (prices, hours, Dublin-time open status, slots, package totals) live only in `src/lib/shop.ts` with tests in `src/lib/shop.test.ts`. Why: one source of truth that the tour cards, sections and booking flow all read.
- Services selection is shared between the package builder and the booking flow through `BookingProvider`. Why: "Book this package" hands the exact selection to booking.
- Booking requests leave the site as a pre-filled text message to the shop phone; there is no backend. Why: no online booking system exists yet.
