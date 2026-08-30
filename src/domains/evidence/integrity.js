/**
 * EVIDENCE INTEGRITY — hashing and verification.
 *
 * A content hash answers exactly one question: has this artifact's bytes
 * changed? It is not a truth score, not a confidence, and not a property
 * integrity rating.
 *
 * The rule this module exists to enforce: if there are no bytes, there is no
 * hash. Fixture evidence reports NOT_COMPUTED_FIXTURE. It never fabricates a
 * plausible-looking digest and never reports VERIFIED for something that was
 * never hashed.
 */

export const HASH_STATE = {
  NOT_COMPUTED: "NOT_COMPUTED",
  NOT_COMPUTED_FIXTURE: "NOT_COMPUTED_FIXTURE",
  COMPUTED: "COMPUTED",
  VERIFIED: "VERIFIED",
  MISMATCH: "MISMATCH",
  UNAVAILABLE: "UNAVAILABLE",
};

export const HASH_ALGORITHM = "SHA-256";

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

const toBytes = (input) =>
  typeof input === "string" ? new TextEncoder().encode(input)
    : input instanceof Uint8Array ? input
    : input instanceof ArrayBuffer ? new Uint8Array(input)
    : null;

/**
 * Compute a real SHA-256 over real bytes.
 * @returns {Promise<{state, algorithm, value, computedAt}>}
 */
export async function computeHash(bytes) {
  const data = toBytes(bytes);
  if (!data) return { state: HASH_STATE.UNAVAILABLE, algorithm: HASH_ALGORITHM, value: null, computedAt: null };
  if (!globalThis.crypto?.subtle)
    return { state: HASH_STATE.UNAVAILABLE, algorithm: HASH_ALGORITHM, value: null, computedAt: null,
             reason: "No WebCrypto implementation available in this runtime." };

  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return {
    state: HASH_STATE.COMPUTED, algorithm: HASH_ALGORITHM,
    value: toHex(digest), computedAt: new Date().toISOString(),
  };
}

/**
 * Verify stored bytes against a recorded hash.
 * Returns UNAVAILABLE when the bytes cannot be materialized — never VERIFIED.
 */
export async function verifyHash(recordedHash, bytes) {
  if (!recordedHash)
    return { state: HASH_STATE.NOT_COMPUTED, matches: null,
             reason: "No hash was ever recorded for this artifact." };

  const data = toBytes(bytes);
  if (!data)
    return { state: HASH_STATE.UNAVAILABLE, matches: null,
             reason: "Bytes are not materialized in this environment, so the hash cannot be verified. This is not a verification failure — it is an absence of data." };

  const fresh = await computeHash(data);
  const matches = fresh.value === recordedHash;
  return {
    state: matches ? HASH_STATE.VERIFIED : HASH_STATE.MISMATCH,
    matches, recordedHash, computedHash: fresh.value,
    verifiedAt: new Date().toISOString(),
    reason: matches ? null : "Recorded hash does not match the current bytes. The artifact has changed or is corrupt.",
  };
}

/** A fixture asset with no bytes. Honest by construction. */
export const fixtureHash = () => ({
  state: HASH_STATE.NOT_COMPUTED_FIXTURE,
  algorithm: HASH_ALGORITHM,
  value: null,
  computedAt: null,
  note: "Development fixture — no bytes exist, so no hash was computed.",
});

/** Only a genuinely computed-and-checked hash may be described as verified. */
export const isVerified = (h) => h?.state === HASH_STATE.VERIFIED;
export const claimsProof = (h) => [HASH_STATE.COMPUTED, HASH_STATE.VERIFIED].includes(h?.state);
