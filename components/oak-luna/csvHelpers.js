export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((v) => String(v).trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((v) => String(v).trim() !== '')) rows.push(row);
  return rows;
}

export function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) obj[header] = row[index] ?? '';
    });
    return obj;
  });
}

export function chunkArray(items, size = 200) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export function safeNumber(value) {
  const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function pick(obj, possibleKeys) {
  if (!obj) return '';
  const lowerMap = {};
  Object.keys(obj).forEach((key) => {
    lowerMap[normalizeHeader(key)] = obj[key];
  });

  for (const key of possibleKeys) {
    const normalized = normalizeHeader(key);
    if (lowerMap[normalized] !== undefined && lowerMap[normalized] !== null && String(lowerMap[normalized]).trim() !== '') {
      return lowerMap[normalized];
    }
  }
  return '';
}

export function compactRaw(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const str = String(value ?? '').trim();
    if (str && str.length < 1000) out[key] = str;
  });
  return out;
}
