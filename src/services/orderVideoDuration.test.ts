import { expect, mock, test } from 'bun:test';

mock.module('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: (_key: string, id: string) => ({
      maybeSingle: async () => ({ data: { max_video_duration_override:
        id === '7a4dc868-0ecd-4969-a1ec-5589d399b7c4' ? 35 : null } })
    }) }) })
  }
}));
const { getOrderMaxDuration } = await import('./orderVideoDuration');

test('Curiosidades horizontal accepts a maximum of 35 seconds', async () => {
  expect(await getOrderMaxDuration('7a4dc868-0ecd-4969-a1ec-5589d399b7c4', 'horizontal')).toBe(35);
});
test('other horizontal orders retain the 10 second default', async () => {
  expect(await getOrderMaxDuration('other-order', 'horizontal')).toBe(10);
});