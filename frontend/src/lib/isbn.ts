const ISBN_GROUP_LENGTHS: Record<string, number> = {
  '9780': 1, '9781': 1, '9782': 1, '9783': 1, '9784': 1, '9785': 1, '9787': 1,
  '97880': 2, '97881': 2, '97882': 2, '97883': 2, '97884': 2, '97885': 2,
  '97886': 2, '97887': 2, '97888': 2, '97889': 2, '97890': 2, '97891': 2,
  '97892': 2, '97893': 2, '97894': 2, '97895': 2,
  '978600': 3, '978601': 3, '978602': 3, '978603': 3, '978604': 3,
  '978605': 3, '978606': 3, '978607': 3, '978608': 3, '978609': 3,
  '978611': 3, '978612': 3, '978613': 3, '978614': 3, '978615': 3,
  '978616': 3, '978617': 3, '978618': 3, '978619': 3, '978620': 3,
  '978621': 3, '978622': 3, '978623': 3, '978624': 3, '978625': 3,
  '978626': 3, '978627': 3, '978628': 3, '978629': 3,
};

export function normalizeIsbnDigits(value: string): string {
  return value.toUpperCase().replace(/[^0-9X]/g, '');
}

export function isValidIsbn(value: string): boolean {
  const digits = normalizeIsbnDigits(value);
  if (/^\d{13}$/.test(digits)) {
    const sum = [...digits].reduce((total, digit, index) =>
      total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
  if (/^\d{9}[0-9X]$/.test(digits)) {
    const sum = [...digits].reduce((total, digit, index) =>
      total + (digit === 'X' ? 10 : Number(digit)) * (10 - index), 0);
    return sum % 11 === 0;
  }
  return false;
}

/**
 * Adds safe structural separators while typing. Publisher/title boundaries are
 * not guessed: those require the publisher's officially assigned ISBN range.
 */
export function formatIsbnInput(value: string): string {
  const digits = normalizeIsbnDigits(value).slice(0, 13);
  if (!digits) return '';

  if (digits.length <= 3) return digits;
  const isComplete = digits.length === 10 || digits.length === 13;
  const body = isComplete ? digits.slice(0, -1) : digits;
  const checkDigit = isComplete ? digits.slice(-1) : '';

  if (body.startsWith('978') || body.startsWith('979')) {
    const groupKey = Object.keys(ISBN_GROUP_LENGTHS)
      .filter(key => key.startsWith(body.slice(0, Math.min(body.length, key.length))))
      .sort((a, b) => b.length - a.length)[0];
    const groupLength = groupKey ? ISBN_GROUP_LENGTHS[groupKey] : 1;
    const groupEnd = Math.min(3 + groupLength, body.length);
    const prefix = body.slice(0, 3);
    const group = body.slice(3, groupEnd);
    const remainder = body.slice(groupEnd);
    const formattedBody = prefix + (group ? '-' + group : '') + (remainder ? '-' + remainder : '');
    return formattedBody + (checkDigit ? '-' + checkDigit : '');
  }

  if (body.length <= 1) return body + (checkDigit ? '-' + checkDigit : '');
  return body.slice(0, 1) + '-' + body.slice(1) + (checkDigit ? '-' + checkDigit : '');
}

/** Convert a validated ISBN-10 to its equivalent Bookland EAN-13 barcode value. */
export function toBooklandEan13(value: string): string | null {
  const digits = normalizeIsbnDigits(value);
  if (!isValidIsbn(digits)) return null;
  if (digits.length === 13) return /^(978|979)\d{10}$/.test(digits) ? digits : null;

  const eanBody = `978${digits.slice(0, 9)}`;
  const sum = [...eanBody].reduce((total, digit, index) =>
    total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${eanBody}${checkDigit}`;
}
