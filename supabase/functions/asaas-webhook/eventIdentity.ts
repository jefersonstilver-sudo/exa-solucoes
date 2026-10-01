// Asaas IDs are opaque: preserve punctuation, case and spacing except control characters.
// PostgreSQL's record_asaas_webhook_event accepts IDs 2–120 characters long.
export const isValidEventId = (id: unknown): id is string =>
  typeof id === 'string' && id.length >= 2 && id.length <= 120 && !/\p{Cc}/u.test(id);