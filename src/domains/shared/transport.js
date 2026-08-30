/**
 * TRANSPORT
 *
 * One place where every service resolves. Today it wraps fixtures with a small
 * latency so loading states are exercised honestly during development. Replace
 * the body with fetch() and every service in the application goes live at once.
 */

const LATENCY_MS = 260;

export function serve(payload, { fail = false, delay = LATENCY_MS } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) return reject(new Error("Upstream service did not respond."));
      try {
        resolve(typeof payload === "function" ? payload() : payload);
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}
