/**
 * Upgrade compatibility.
 *
 * Documents written before `status` / `is_active` existed have no such field.
 * A plain `{ status: "published" }` filter would silently hide all of them, so
 * public queries match "the field equals X, or the field was never written".
 * `$in: [x, null]` covers both — in MongoDB `null` also matches a missing key.
 */
export const orMissing = <T>(value: T) => ({ $in: [value, null] }) as const;

/** Field is anything except the given value, including missing. */
export const notValue = <T>(value: T) => ({ $ne: value }) as const;
