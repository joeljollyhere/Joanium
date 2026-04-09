// Word list for passphrases (common memorable words)
const WORDS = [
  'apple',
  'brave',
  'cloud',
  'dance',
  'eagle',
  'flame',
  'grace',
  'happy',
  'ivory',
  'jazzy',
  'karma',
  'lemon',
  'maple',
  'noble',
  'ocean',
  'piano',
  'quest',
  'river',
  'solar',
  'tiger',
  'ultra',
  'vivid',
  'waves',
  'xenon',
  'yield',
  'zebra',
  'amber',
  'blaze',
  'coral',
  'drift',
  'ember',
  'frost',
  'globe',
  'haste',
  'ideal',
  'jewel',
  'khaki',
  'lunar',
  'misty',
  'night',
  'olive',
  'pearl',
  'quartz',
  'ridge',
  'stone',
  'torch',
  'umbra',
  'vault',
  'winds',
  'xceed',
  'young',
  'zesty',
  'adobe',
  'beach',
  'cedar',
  'delta',
  'elite',
  'forge',
  'gleam',
  'hawk',
  'inbox',
  'joker',
  'kneel',
  'lance',
  'magic',
  'nexus',
  'orbit',
  'pixel',
  'query',
  'rally',
  'shiny',
  'tidal',
  'unity',
  'vapor',
  'waltz',
  'xylem',
  'yacht',
  'zones',
  'acorn',
  'blend',
  'charm',
  'depot',
  'enter',
  'flint',
  'giant',
  'holly',
  'input',
  'judge',
  'kinky',
  'lodge',
  'micro',
  'north',
  'onion',
  'plumb',
  'quiet',
  'rocky',
  'swing',
  'trend',
  'upper',
  'venom',
];

function getRandomValues(count) {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint32Array(count);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr);
  }
  // Fallback (less secure but functional)
  return Array.from({ length: count }, () => Math.floor(Math.random() * 0xffffffff));
}

function randomInt(max) {
  const [v] = getRandomValues(1);
  return v % max;
}

export function generatePassword(length, useSymbols, useNumbers, useUppercase) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  let chars = lower;
  const required = [lower[randomInt(lower.length)]];

  if (useUppercase) {
    chars += upper;
    required.push(upper[randomInt(upper.length)]);
  }
  if (useNumbers) {
    chars += digits;
    required.push(digits[randomInt(digits.length)]);
  }
  if (useSymbols) {
    chars += symbols;
    required.push(symbols[randomInt(symbols.length)]);
  }

  // Fill remaining slots
  const remaining = Array.from(
    { length: length - required.length },
    () => chars[randomInt(chars.length)],
  );

  // Shuffle required + remaining
  const all = [...required, ...remaining];
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join('');
}

export function generatePassphrase(wordCount, separator = '-') {
  const words = Array.from({ length: wordCount }, () => {
    const w = WORDS[randomInt(WORDS.length)];
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  // Add a number for entropy
  const num = randomInt(999) + 1;
  return [...words, String(num)].join(separator);
}

export function generatePin(length) {
  return Array.from({ length }, () => randomInt(10)).join('');
}

export function generateMemorable(length) {
  const consonants = 'bcdfghjklmnprstvwxyz';
  const vowels = 'aeiou';
  let result = '';
  for (let i = 0; i < length; i++) {
    result +=
      i % 2 === 0 ? consonants[randomInt(consonants.length)] : vowels[randomInt(vowels.length)];
  }
  return result;
}

export function strengthLabel(password) {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 20) score++;
  if (score <= 2) return 'Weak ⚠️';
  if (score <= 4) return 'Good ✅';
  return 'Strong 💪';
}
