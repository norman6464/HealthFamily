/**
 * KEGG MEDICUS API クライアント (サーバーサイド専用)
 *
 * KEGG REST API: https://www.kegg.jp/kegg/rest/keggapi.html
 * - find/drug_ja/{query} : 日本語での薬剤検索
 * - get/dr_ja:{id}       : 日本語版の薬剤詳細
 *
 * ⚠️ ライセンス上の注意:
 * KEGG REST API (rest.kegg.jp) はアカデミック利用を前提に公開されている。
 * 商用・コンシューマー向けサービスで利用する場合は
 * https://www.kegg.jp/kegg/legal.html の利用規約を確認し、必要に応じて
 * KEGG 社と商用ライセンス契約を結ぶか、PMDA など代替データソースへ
 * 差し替えること。
 *
 * 技術的な制限:
 * - 3 req/sec (上流側のレート制限)
 */

const KEGG_BASE = 'https://rest.kegg.jp';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_SEARCH_RESULTS = 20;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

export interface KeggSearchResult {
  id: string;
  name: string;
}

export interface KeggDrugInfo {
  id: string;
  name: string;
  efficacy?: string;
  components?: string;
  remark?: string;
  sourceUrl: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const searchCache = new Map<string, CacheEntry<KeggSearchResult[]>>();
const drugCache = new Map<string, CacheEntry<KeggDrugInfo | null>>();

function cacheGet<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * KEGG REST API へリクエストを送る。
 *
 * 戻り値の契約:
 * - 200 OK:   レスポンス本文を返す (通常は非空のflat-file text)
 * - 404:      空文字列 `''` を返す ("該当なし" を示すセンチネル)
 * - その他:   例外をthrow
 *
 * 呼び出し側 (searchDrugsByName / getDrugInfo) は空文字列を "該当なし" と
 * みなして分岐している。KEGG REST は 200 で空本文を返さない前提のため
 * この取り扱いで問題ないが、将来の挙動変更に備えてこの契約を守ること。
 */
async function keggFetch(path: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${KEGG_BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'text/plain' },
    });
    if (res.status === 404) return '';
    if (!res.ok) throw new Error(`KEGG API error: ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * KEGG flat file形式のパース
 * - 0-11文字目: フィールド名 (先頭行のみ。継続行は空白)
 * - 12文字目以降: 値
 * - "///" で1レコード終了
 */
function parseKeggFlatFile(text: string): Map<string, string> {
  const fields = new Map<string, string>();
  const lines = text.split('\n');
  let currentField: string | null = null;
  let currentValue: string[] = [];

  const commit = () => {
    if (currentField) {
      const joined = currentValue.join('\n').trim();
      if (joined) {
        const existing = fields.get(currentField);
        fields.set(currentField, existing ? `${existing}\n${joined}` : joined);
      }
    }
  };

  for (const line of lines) {
    if (line === '///') break;
    if (line.length > 0 && line[0] !== ' ') {
      commit();
      currentField = line.substring(0, 12).trim();
      currentValue = [line.substring(12)];
    } else if (currentField) {
      currentValue.push(line.substring(12));
    }
  }
  commit();
  return fields;
}

export async function searchDrugsByName(query: string): Promise<KeggSearchResult[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  const cacheKey = normalized.toLowerCase();
  const cached = cacheGet(searchCache, cacheKey);
  if (cached) return cached;

  const encoded = encodeURIComponent(normalized);
  const text = await keggFetch(`/find/drug_ja/${encoded}`);

  const results: KeggSearchResult[] = [];
  const lines = text.split('\n').filter((line) => line.trim());
  for (const line of lines.slice(0, MAX_SEARCH_RESULTS)) {
    const tabIndex = line.indexOf('\t');
    if (tabIndex === -1) continue;
    const idPart = line.substring(0, tabIndex).trim();
    const name = line.substring(tabIndex + 1).trim();
    const id = idPart.replace(/^(dr_ja|dr):/i, '').trim();
    if (id && name) results.push({ id, name });
  }

  cacheSet(searchCache, cacheKey, results);
  return results;
}

export async function getDrugInfo(id: string): Promise<KeggDrugInfo | null> {
  const normalized = id.trim().toUpperCase();
  if (!/^D\d{5}$/.test(normalized)) return null;

  const cached = cacheGet(drugCache, normalized);
  if (cached !== undefined) return cached;

  const text = await keggFetch(`/get/dr_ja:${normalized}`);
  if (!text) {
    cacheSet(drugCache, normalized, null);
    return null;
  }

  const fields = parseKeggFlatFile(text);
  const rawName = fields.get('NAME') ?? '';
  const firstName = rawName.split('\n')[0]?.trim() ?? '';
  const cleanName = firstName.replace(/\s*\([^)]*\)\s*$/, '').trim();

  const info: KeggDrugInfo = {
    id: normalized,
    name: cleanName || normalized,
    efficacy: fields.get('EFFICACY') || undefined,
    components: fields.get('COMPONENT') || undefined,
    remark: fields.get('REMARK') || undefined,
    sourceUrl: `https://www.kegg.jp/entry/${normalized}`,
  };

  cacheSet(drugCache, normalized, info);
  return info;
}
