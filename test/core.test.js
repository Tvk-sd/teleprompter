const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');

test('makeCode uses only the safe alphabet and the fixed length', () => {
  for (let i = 0; i < 200; i++) {
    const code = core.makeCode();
    assert.equal(code.length, core.CODE_LENGTH);
    for (const ch of code) assert.ok(core.ALPHABET.includes(ch), ch);
  }
  assert.doesNotMatch(core.ALPHABET, /[01OI]/);
});

test('normalizeCode accepts dashes, spaces and lower case', () => {
  assert.equal(core.normalizeCode('abcd-efgh'), 'ABCDEFGH');
  assert.equal(core.normalizeCode(' ab cd ef gh '), 'ABCDEFGH');
});

test('normalizeCode rejects wrong length and letters outside the alphabet', () => {
  assert.equal(core.normalizeCode('ABC'), null);
  assert.equal(core.normalizeCode('ABCDEFG0'), null);
  assert.equal(core.normalizeCode('ABCDEFGI'), null);
  assert.equal(core.normalizeCode(''), null);
  assert.equal(core.normalizeCode(null), null);
});

test('formatCode splits into two groups', () => {
  assert.equal(core.formatCode('ABCDEFGH'), 'ABCD-EFGH');
  assert.equal(core.formatCode(''), '');
});

test('joinLink and codeFromUrl round trip and drop an old fragment', () => {
  const link = core.joinLink('https://example.test/src/#room=OLDCODE1', 'ABCDEFGH');
  assert.equal(link, 'https://example.test/src/#room=ABCDEFGH');
  assert.equal(core.codeFromUrl(link), 'ABCDEFGH');
  assert.equal(core.codeFromUrl('https://example.test/src/#room=abcd-efgh'), 'ABCDEFGH');
  assert.equal(core.codeFromUrl('https://example.test/src/'), null);
  assert.equal(core.codeFromUrl('https://example.test/src/#room=bad'), null);
});

test('isNewer applies only strictly newer rows', () => {
  const a = { updated_at: '2026-09-06T10:00:00.000Z' };
  const b = { updated_at: '2026-09-06T10:00:01.000Z' };
  assert.equal(core.isNewer(b, a), true);
  assert.equal(core.isNewer(a, b), false);
  assert.equal(core.isNewer(a, a), false);
  assert.equal(core.isNewer(a, null), true);
  assert.equal(core.isNewer(null, a), false);
  assert.equal(core.isNewer({}, a), false);
});

test('expiresAt is 24 hours after now', () => {
  const now = Date.parse('2026-09-06T12:00:00.000Z');
  assert.equal(core.expiresAt(now), '2026-09-07T12:00:00.000Z');
});

test('keptScrollTop keeps the ratio and survives zero heights', () => {
  assert.equal(core.keptScrollTop(100, 1000, 2000), 200);
  assert.equal(core.keptScrollTop(333, 1000, 500), 167);
  assert.equal(core.keptScrollTop(100, 0, 500), 0);
  assert.equal(core.keptScrollTop(100, 500, 0), 0);
});
