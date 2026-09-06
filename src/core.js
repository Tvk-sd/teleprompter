// Pure helpers for the Prompter. No DOM, no network. Tested with `node --test`.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PrompterCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Room codes: 8 characters, no 0/O/1/I so they read out loud without doubt.
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const CODE_LENGTH = 8;
  const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

  function makeCode(random = Math.random) {
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[Math.floor(random() * ALPHABET.length)];
    return out;
  }
  function normalizeCode(input) {
    const c = String(input || '').toUpperCase().replace(/[^A-Z2-9]/g, '').replace(/[0O]/g, 'O').replace(/[1I]/g, 'I');
    const fixed = c.replace(/O/g, '0').replace(/I/g, '1');
    // 0 and 1 are not in the alphabet; a typed O or I is a typo for nothing valid, so reject.
    if (fixed.length !== CODE_LENGTH) return null;
    for (const ch of fixed) if (!ALPHABET.includes(ch)) return null;
    return fixed;
  }
  function formatCode(code) { return code ? code.slice(0, 4) + '-' + code.slice(4) : ''; }

  function joinLink(pageUrl, code) {
    const base = String(pageUrl).split('#')[0];
    return base + '#room=' + code;
  }
  function codeFromUrl(url) {
    const m = /#room=([A-Za-z0-9-]+)/.exec(String(url || ''));
    return m ? normalizeCode(m[1]) : null;
  }

  // Last write wins. Apply an incoming row only when it is newer than what we last applied.
  function isNewer(incoming, lastApplied) {
    if (!incoming || !incoming.updated_at) return false;
    if (!lastApplied || !lastApplied.updated_at) return true;
    return Date.parse(incoming.updated_at) > Date.parse(lastApplied.updated_at);
  }
  function expiresAt(now = Date.now()) { return new Date(now + ROOM_TTL_MS).toISOString(); }

  // Keep the reader's place when the text is replaced while the prompter runs.
  function keptScrollTop(oldTop, oldHeight, newHeight) {
    if (!oldHeight || !newHeight) return 0;
    return Math.round(oldTop / oldHeight * newHeight);
  }

  return { ALPHABET, CODE_LENGTH, ROOM_TTL_MS, makeCode, normalizeCode, formatCode, joinLink, codeFromUrl, isNewer, expiresAt, keptScrollTop };
});
