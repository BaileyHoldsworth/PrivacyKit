import { $, onInput } from '../../lib/dom';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';
import { formatBytes } from '../../lib/bytes';

const root = document.querySelector<HTMLElement>('[data-tool="json-to-csv"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#j2c-input', root)!;
  const output = $<HTMLTextAreaElement>('#j2c-output', root)!;
  const inputLabel = $('#j2c-input-label', root)!;
  const outputLabel = $('#j2c-output-label', root)!;
  const inputCount = $('#j2c-input-count', root)!;
  const directionBadge = $('#j2c-direction', root)!;
  const swapBtn = $('#j2c-swap', root)!;
  const delimiterSel = $<HTMLSelectElement>('#j2c-delimiter', root)!;
  const headerBox = $<HTMLInputElement>('#j2c-header', root)!;
  const headerLabel = $('#j2c-header-label', root)!;
  const typesBox = $<HTMLInputElement>('#j2c-types', root)!;
  const error = $('#j2c-error', root)!;
  const clearBtn = $('#j2c-clear', root)!;
  const downloadBtn = $('#j2c-download', root)!;
  const statRows = $('#j2c-stat-rows', root)!;
  const statCols = $('#j2c-stat-cols', root)!;
  const statSize = $('#j2c-stat-size', root)!;

  // Above ~5 MB, JSON.parse / Papa.parse on the main thread can stall the tab.
  const HARD_LIMIT = 5_000_000;

  type Dir = 'json2csv' | 'csv2json';
  let dir: Dir = 'json2csv';

  // Lazy-load papaparse on first conversion so it isn't in the initial bundle.
  // papaparse is CommonJS: under Vite the whole module lands on `.default`,
  // with `.parse`/`.unparse` also exposed — fall back so both shapes work.
  type PapaModule = typeof import('papaparse');
  let papaPromise: Promise<PapaModule> | null = null;
  async function loadPapa(): Promise<PapaModule> {
    const mod = await (papaPromise ??= import('papaparse'));
    return (mod as unknown as { default?: PapaModule }).default ?? mod;
  }

  const DELIMS: Record<string, string> = { comma: ',', semicolon: ';', tab: '\t' };
  const delimiter = (): string => DELIMS[delimiterSel.value] ?? ',';

  interface Result {
    output: string;
    error: string;
    rows: number;
    cols: number;
  }

  const byteSize = (s: string): number => new Blob([s]).size;
  const trim = (s: string): string => s.replace(/\s+/g, ' ').slice(0, 140);

  // ---------- JSON -> CSV ----------

  /** Normalise parsed JSON into a list of row objects (see FAQ for the rules). */
  function toRows(parsed: unknown): Record<string, unknown>[] {
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed !== null && typeof parsed === 'object'
        ? [parsed]
        : [parsed];
    return arr.map((item) =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : { value: item }
    );
  }

  async function computeJsonToCsv(text: string): Promise<Result> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return {
        output: '',
        error: `Invalid JSON: ${trim(e instanceof Error ? e.message : String(e))}`,
        rows: 0,
        cols: 0,
      };
    }

    const rows = toRows(parsed);
    // Columns are the union of every key, in first-seen order.
    const fields: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      for (const k of Object.keys(row)) {
        if (!seen.has(k)) {
          seen.add(k);
          fields.push(k);
        }
      }
    }
    if (rows.length === 0 || fields.length === 0) {
      return {
        output: '',
        error:
          'The JSON is valid but has no rows or columns to convert — this tool expects an array of objects, or a single object.',
        rows: 0,
        cols: 0,
      };
    }

    // Flatten: a nested object/array cell becomes its compact JSON string.
    const data = rows.map((row) => {
      const cells: Record<string, unknown> = {};
      for (const k of fields) {
        const v = row[k];
        cells[k] = v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
      }
      return cells;
    });

    const Papa = await loadPapa();
    const csv = Papa.unparse(
      { fields, data },
      { delimiter: delimiter(), header: headerBox.checked, newline: '\n' }
    );
    return { output: csv, error: '', rows: rows.length, cols: fields.length };
  }

  // ---------- CSV -> JSON ----------

  async function computeCsvToJson(text: string): Promise<Result> {
    const Papa = await loadPapa();
    const res = Papa.parse<unknown>(text.trim(), {
      delimiter: delimiter(),
      header: headerBox.checked,
      skipEmptyLines: 'greedy',
      dynamicTyping: typesBox.checked,
    });
    const data = res.data as unknown[];
    if (data.length === 0) {
      return {
        output: '',
        error: "No rows found — check the delimiter and that the CSV isn't empty.",
        rows: 0,
        cols: 0,
      };
    }

    const json = JSON.stringify(data, null, 2);
    const cols = headerBox.checked
      ? res.meta.fields?.length ?? 0
      : data.reduce<number>((m, r) => (Array.isArray(r) ? Math.max(m, r.length) : m), 0);

    // Ragged rows are surfaced as a warning; the parsed rows are still shown.
    let warn = '';
    if (res.errors.length) {
      const first = res.errors[0]!;
      const rowNo = typeof first.row === 'number' ? first.row + 1 : '?';
      warn = `${res.errors.length} row issue${res.errors.length > 1 ? 's' : ''} — e.g. row ${rowNo}: ${first.message}. Output below covers the rows that parsed.`;
    }
    return { output: json, error: warn, rows: data.length, cols };
  }

  // ---------- driver ----------

  let runId = 0;

  async function convert(): Promise<void> {
    const id = ++runId;
    const text = input.value;
    inputCount.textContent = text.length
      ? `${text.length.toLocaleString('en-AU')} characters`
      : '';

    if (!text.trim()) {
      error.textContent = '';
      output.value = '';
      clearStats();
      return;
    }
    if (text.length > HARD_LIMIT) {
      error.textContent = `Input is ${text.length.toLocaleString('en-AU')} characters — over the ${HARD_LIMIT / 1_000_000} MB limit for in-browser conversion. Split the file and convert it in parts.`;
      output.value = '';
      clearStats();
      return;
    }

    let result: Result;
    try {
      result = dir === 'json2csv' ? await computeJsonToCsv(text) : await computeCsvToJson(text);
    } catch (e) {
      result = { output: '', error: `Conversion failed: ${trim(e instanceof Error ? e.message : String(e))}`, rows: 0, cols: 0 };
    }
    if (id !== runId) return; // a newer keystroke/option change superseded this run

    error.textContent = result.error;
    output.value = result.output;
    if (result.output) setStats(result.rows, result.cols, result.output);
    else clearStats();
  }

  function setStats(rows: number, cols: number, out: string): void {
    statRows.textContent = rows.toLocaleString('en-AU');
    statCols.textContent = cols.toLocaleString('en-AU');
    statSize.textContent = formatBytes(byteSize(out));
  }

  function clearStats(): void {
    statRows.textContent = '–';
    statCols.textContent = '–';
    statSize.textContent = '–';
  }

  function updateDirectionUi(): void {
    if (dir === 'json2csv') {
      directionBadge.textContent = 'JSON → CSV';
      inputLabel.textContent = 'JSON input';
      outputLabel.textContent = 'CSV output';
      input.setAttribute('placeholder', 'Paste JSON — an array of objects, or a single object');
      headerLabel.textContent = 'Include header row';
      typesBox.disabled = true; // type inference only applies when parsing CSV
    } else {
      directionBadge.textContent = 'CSV → JSON';
      inputLabel.textContent = 'CSV input';
      outputLabel.textContent = 'JSON output';
      input.setAttribute('placeholder', 'Paste CSV — first row treated as the header');
      headerLabel.textContent = 'First row is a header';
      typesBox.disabled = false;
    }
  }

  // ---------- wiring ----------

  swapBtn.addEventListener('click', () => {
    // Feed the current output back in so a result can be round-tripped.
    if (output.value.trim()) input.value = output.value;
    dir = dir === 'json2csv' ? 'csv2json' : 'json2csv';
    updateDirectionUi();
    void convert();
    input.focus();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    void convert();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet — convert something first', 'error');
      return;
    }
    if (dir === 'json2csv') downloadText(output.value, 'data.csv', 'text/csv');
    else downloadText(output.value, 'data.json', 'application/json');
  });

  for (const el of [delimiterSel, headerBox, typesBox]) {
    el.addEventListener('change', () => void convert());
  }

  onInput(input, () => void convert(), 200);

  updateDirectionUi();
  void convert();
}
