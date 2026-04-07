

# Background Blurred Video on Slot Cards

## What
Add a looping, muted, blurred video playing as background behind each video slot card that has an uploaded video. This creates a visually rich, ambient effect — the video content subtly fills the card background while remaining non-distracting thanks to heavy blur and reduced opacity.

## How

### File: `src/components/video-management/VideoSlotCard.tsx`

1. **Add a `<video>` element** as the first child inside the `<Card>`, positioned `absolute inset-0` with:
   - `autoPlay`, `muted`, `loop`, `playsInline`
   - `object-cover` to fill the card
   - CSS: `blur-xl opacity-30 scale-110` (blur hides edges, scale prevents blur white-fringe)
   - `pointer-events-none` and `z-0`
   - `rounded-xl overflow-hidden` on the Card to clip the blurred video

2. **Condition**: Only render when `slot.video_data?.url` exists

3. **Wrap `<CardContent>`** with `relative z-10` so all content sits above the blurred background

4. **Performance**: Use `preload="none"` so it only loads when visible; add `loading="lazy"` behavior. The video is purely decorative.

```text
┌──────────────────────────────┐
│ ░░░ blurred video bg ░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│   ┌─ z-10 content ────────┐ │
│   │ Slot 1    ✅ Aprovado  │ │
│   │ 🎬 apice teste        │ │
│   │ 10s · horizontal      │ │
│   │ [Ver] [📅] [ℹ] [🗑]   │ │
│   │ ★ Principal · ▶ ATIVO │ │
│   └────────────────────────┘ │
└──────────────────────────────┘
```

### What stays the same
- All functionality, data flow, actions, and desktop layout untouched
- Only visual enhancement — no logic changes

