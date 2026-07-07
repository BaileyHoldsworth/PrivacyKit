import { $, onInput } from '../../lib/dom';
import { formatBytes } from '../../lib/bytes';
import { downloadText } from '../../lib/download';
import { showToast } from '../../lib/toast';

const root = document.querySelector<HTMLElement>('[data-tool="json-to-yaml"]');

if (root) {
  const input = $<HTMLTextAreaElement>('#j2y-input', root)!;
  const output = $<HTMLTextAreaElement>('#j2y-output', root)!;
  const inputCount = $('#j2y-input-count', root)!;
  const inputLabel = $('#j2y-input-label', root)!;
  const outputLabel = $('#j2y-output-label', root)!;
  const directionBadge = $('#j2y-direction', root)!;
  const indentSelect = $<HTMLSelectElement>('#j2y-indent', root)!;
  const minifyBox = $<HTMLInputElement>('#j2y-minify', root)!;
  const error = $('#j2y-error', root)!;
  const statLines = $('#j2y-stat-lines', root)!;
  const statSize = $('#j2y-stat-size', root)!;
  const swapBtn = $('#j2y-swap', root)!;
  const clearBtn = $('#j2y-clear', root)!;
  const sampleBtn = $('#j2y-sample', root)!;
  const downloadBtn = $('#j2y-download', root)!;

  // Different worked example than any other page — a Track ya Tradie job record.
  const SAMPLE_JSON =
    '{"job":"TT-1042","trade":"electrician","onsite":true,"hours":6.5,' +
    '"parts":["RCD switch","2.5mm cable"],"client":{"name":"Marlow","suburb":"Fremantle"}}';
  const SAMPLE_YAML =
    'job: TT-1042\ntrade: electrician\nonsite: true\nhours: 6.5\n' +
    'parts:\n  - RCD switch\n  - 2.5mm cable\nclient:\n  name: Marlow\n  suburb: Fremantle\n';
  const PLACEHOLDER_JSON = 'Paste JSON — e.g. {"service": "api", "replicas": 3}';
  const PLACEHOLDER_YAML = 'Paste YAML — e.g. {service: api, replicas: 3}';

  let direction: 'j2y' | 'y2j' = 'j2y';

  // js-yaml is a full parser (~40 KB) and is only needed once there is input to
  // convert, so it is code-split and pulled in on demand. The token guards
  // against the first import resolving after a newer conversion has started.
  let yamlLib: typeof import('js-yaml') | null = null;
  let runToken = 0;

  async function ensureYaml(): Promise<typeof import('js-yaml')> {
    if (yamlLib) return yamlLib;
    const mod = await import('js-yaml');
    yamlLib = mod;
    return mod;
  }

  // ---------- error formatting ----------

  function describeYamlError(err: unknown): string {
    if (err && typeof err === 'object' && 'reason' in err) {
      const e = err as { reason?: string; mark?: { line: number; column: number } };
      const reason = e.reason || 'could not parse the document';
      // js-yaml marks are 0-indexed; humans count lines and columns from 1.
      if (e.mark && Number.isFinite(e.mark.line)) {
        return `Invalid YAML at line ${e.mark.line + 1}, column ${e.mark.column + 1}: ${reason}`;
      }
      return `Invalid YAML: ${reason}`;
    }
    return `Invalid YAML: ${err instanceof Error ? err.message : String(err)}`;
  }

  function describeJsonError(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    // The native message already carries "(line X column Y)" / "position N".
    return `Invalid JSON: ${raw.replace(/\s+/g, ' ').slice(0, 180)}`;
  }

  // ---------- stats ----------

  function byteSize(s: string): number {
    return new Blob([s]).size;
  }

  function setStats(out: string): void {
    if (!out) {
      statLines.textContent = '–';
      statSize.textContent = '–';
      return;
    }
    statLines.textContent = out.split('\n').length.toLocaleString();
    statSize.textContent = formatBytes(byteSize(out));
  }

  function updateCount(): void {
    const text = input.value;
    const n = text.length;
    inputCount.textContent = n
      ? `${n.toLocaleString()} character${n === 1 ? '' : 's'} · ${formatBytes(byteSize(text))}`
      : '0 characters';
  }

  // ---------- controls ----------

  function updateControls(): void {
    const j2y = direction === 'j2y';
    inputLabel.textContent = j2y ? 'JSON input' : 'YAML input';
    outputLabel.textContent = j2y ? 'YAML output' : 'JSON output';
    directionBadge.textContent = j2y ? 'JSON → YAML' : 'YAML → JSON';
    swapBtn.textContent = j2y ? '⇄ Swap to YAML → JSON' : '⇄ Swap to JSON → YAML';
    input.setAttribute('placeholder', j2y ? PLACEHOLDER_JSON : PLACEHOLDER_YAML);
    output.setAttribute('placeholder', j2y ? 'YAML appears here as you type' : 'JSON appears here as you type');
    // Minify only shapes JSON output, so it is inert while producing YAML.
    minifyBox.disabled = j2y;
    // A minified object is a single line — indentation would have no effect.
    indentSelect.disabled = !j2y && minifyBox.checked;
  }

  // ---------- conversion ----------

  async function convert(): Promise<void> {
    const text = input.value;
    if (!text.trim()) {
      output.value = '';
      error.textContent = '';
      setStats('');
      return;
    }

    const token = ++runToken;
    let lib: typeof import('js-yaml') | null = null;
    try {
      lib = await ensureYaml();
    } catch {
      if (token !== runToken) return;
      error.textContent = 'Could not load the YAML engine — check your connection and reload the page.';
      return;
    }
    if (token !== runToken || !lib) return; // a newer keystroke already superseded this run

    try {
      let result: string;
      if (direction === 'j2y') {
        const value: unknown = JSON.parse(text);
        // lineWidth: -1 keeps long scalars (URLs, tokens) on one line instead
        // of folding them at 80 columns, which reads better and round-trips.
        result = lib.dump(value, { indent: Number(indentSelect.value), lineWidth: -1 });
      } else {
        const value = lib.load(text);
        if (value === undefined) {
          // Empty stream or comment-only input — nothing to serialise.
          output.value = '';
          error.textContent = '';
          setStats('');
          return;
        }
        result = minifyBox.checked
          ? JSON.stringify(value)
          : JSON.stringify(value, null, Number(indentSelect.value));
      }
      error.textContent = '';
      output.value = result;
      setStats(result);
    } catch (err) {
      output.value = '';
      setStats('');
      error.textContent = direction === 'j2y' ? describeJsonError(err) : describeYamlError(err);
    }
  }

  // ---------- events ----------

  function swap(): void {
    // Carry the current output back into the input so a converted document can
    // be tweaked and sent the other way; fall back to the existing input.
    const carried = output.value || input.value;
    direction = direction === 'j2y' ? 'y2j' : 'j2y';
    input.value = carried;
    updateControls();
    updateCount();
    void convert();
  }

  swapBtn.addEventListener('click', swap);

  indentSelect.addEventListener('change', () => {
    updateControls();
    void convert();
  });
  minifyBox.addEventListener('change', () => {
    updateControls();
    void convert();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    error.textContent = '';
    setStats('');
    updateCount();
    input.focus();
  });

  sampleBtn.addEventListener('click', () => {
    input.value = direction === 'j2y' ? SAMPLE_JSON : SAMPLE_YAML;
    updateCount();
    void convert();
    input.focus();
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) {
      showToast('Nothing to download yet — enter a document to convert first', 'error');
      return;
    }
    const yaml = direction === 'j2y';
    downloadText(output.value, yaml ? 'converted.yaml' : 'converted.json', yaml ? 'text/yaml' : 'application/json');
  });

  // Conversion (and the count's UTF-8 byte pass) is debounced so a large paste
  // is processed once the typing settles, not on every keystroke.
  onInput(
    input,
    () => {
      updateCount();
      void convert();
    },
    200
  );

  updateControls();
  updateCount();
  void convert();
}
