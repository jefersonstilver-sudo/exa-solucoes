

# Fix: Only ONE Video Shows "Em Exibição" Per Order

## Problem
Line 53-54 in `VideoListItem.tsx` marks ANY approved video with schedule info as "Em Exibição". The system has an RPC (`get_current_display_video`) that already correctly determines which single video is active RIGHT NOW based on day-of-week and time-of-day from `campaign_schedule_rules`.

## Solution

### 1. `CampaignReportCard.tsx` — Fetch the real current video per order
- Import and call `useCurrentVideoDisplay({ orderId: campaign.pedidoId })`
- Pass `isCurrentlyDisplaying={currentVideo?.video_id === video.id}` to each `VideoListItem`

### 2. `VideoListItem.tsx` — Accept and use `isCurrentlyDisplaying` prop
- Add `isCurrentlyDisplaying?: boolean` to props
- Replace the self-computed `isDisplaying` (line 53-54) with `props.isCurrentlyDisplaying`
- Only that ONE video gets: pulsing "Em Exibição" badge, red dot, live ticker, "ao vivo" label
- Other videos show their schedule info but with distinct states:
  - **Scheduled (not now)**: purple "Agendado" badge, static exhibition count, no ticker
  - **Base (not now)**: yellow "Base" badge, static exhibition count, no ticker
  - **Not eligible**: gray "Não exibindo", dimmed

### Visual states summary
```text
Currently playing:    "Em Exibição" pulse + red dot + live ticker + "ao vivo"
Scheduled (not now):  "Agendado: Ter, Sáb" purple badge — static count, no pulse
Base (not now):       "Base: Seg, Sex" yellow badge — static count, no pulse
Inactive:             opacity-60, "Não exibindo"
```

## Files Modified
- `src/components/advertiser/CampaignReportCard.tsx` — add `useCurrentVideoDisplay` hook, pass prop
- `src/components/advertiser/VideoListItem.tsx` — accept `isCurrentlyDisplaying` prop, replace self-computed logic

## Impact
- Only 1 video per order shows "Em Exibição" at any time, matching the real system schedule
- Exhibition counts remain correct (calculated from schedule coverage across the period)
- Live ticker only runs for the currently displaying video
- No other files or flows affected

