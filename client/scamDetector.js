// scamDetector.js
//
// This is the hook point where your existing phishing/scam-detection logic
// plugs in. Right now it's a simple rule-based stub so the pipeline works
// end-to-end. Replace scanMessage() internals with your real model/logic
// (the one from your phishing-detection tool / QR-risk API) when ready.

const SUSPICIOUS_URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd"
];

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const IP_URL_REGEX = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;

const URGENCY_KEYWORDS = [
  "verify your account", "act now", "urgent", "suspended",
  "click here immediately", "confirm your password", "limited time"
];

/**
 * Scans a message body and returns a risk assessment.
 * @param {string} text - the raw message text
 * @returns {{ risk: "none"|"low"|"high", reasons: string[] }}
 */
export function scanMessage(text) {
  const reasons = [];
  if (!text) return { risk: "none", reasons };

  const lower = text.toLowerCase();
  const urls = text.match(URL_REGEX) || [];

  for (const url of urls) {
    if (IP_URL_REGEX.test(url)) {
      reasons.push(`Link uses a raw IP address instead of a domain: ${url}`);
    }
    if (SUSPICIOUS_URL_SHORTENERS.some((s) => url.includes(s))) {
      reasons.push(`Link uses a URL shortener (destination hidden): ${url}`);
    }
  }

  for (const phrase of URGENCY_KEYWORDS) {
    if (lower.includes(phrase)) {
      reasons.push(`Message uses urgency/pressure language: "${phrase}"`);
    }
  }

  if (reasons.length === 0) return { risk: "none", reasons };
  if (reasons.length === 1) return { risk: "low", reasons };
  return { risk: "high", reasons };
}
