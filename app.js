'use strict';

const STORAGE_KEY = 'typesetting-app-v001';
const AUTOSAVE_DELAY = 700;

const DEFAULT_STATE = Object.freeze({
  projectName: '新規組版データ',
  manuscript: {
    title: 'サンプルタイトル',
    subtitle: '自動組版の確認用原稿',
    author: '著者名',
    body: `これは、組版アプリv001の動作確認用原稿です。\n\n右側の設定を変更すると、用紙サイズ、余白、フォント、文字サイズ、文字間、行間が中央のプレビューへ自動反映されます。本文は空行ごとに段落として扱われ、ページ内に収まらない場合は自動的に次のページへ送られます。\n\n段落の先頭には、指定した字下げが適用されます。文章を長くすると、自動的にページが追加されます。現在のv001は横書き・一段組を対象とした技術検証版です。\n\nPDFとして保存する際は、右上の「PDF出力」を押してください。ブラウザの印刷画面が開くので、送信先を「PDFに保存」、余白を「なし」、倍率を「100%」に設定します。\n\nこの段階では、原稿と設定をブラウザ内に保存するほか、JSONファイルとして書き出し、別の端末やブラウザへ読み込むことができます。`
  },
  settings: {
    paperPreset: 'A5',
    pageWidth: 148,
    pageHeight: 210,
    marginTop: 15,
    marginBottom: 18,
    marginLeft: 18,
    marginRight: 15,
    fontFamily: "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 0.02,
    textIndent: 1,
    textAlign: 'justify',
    titleSize: 20,
    titleBottom: 14,
    titleAlign: 'center',
    showPageNumbers: true,
    firstPageNumber: false,
    viewMode: 'single',
    zoom: 0.7,
    showGuides: true
  },
  metadata: {
    appVersion: 'v001',
    updatedAt: null
  }
});

const PAPER_PRESETS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  B6: { width: 128, height: 182 }
};

const els = {};
let renderTimer = null;
let autosaveTimer = null;
let toastTimer = null;
let isRendering = false;

window.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();
  updateCharCount();
  setPaperInputsReadOnly(els.paperPreset.value !== 'custom');
  applyViewSettings();
  scheduleRender();
  updateSaveStatus('未保存');
}

function cacheElements() {
  const ids = [
    'projectName', 'newBtn', 'saveBtn', 'loadBtn', 'exportBtn', 'importBtn', 'printBtn', 'importFile',
    'titleInput', 'subtitleInput', 'authorInput', 'bodyInput', 'charCount', 'pages', 'pageCount',
    'saveStatus', 'paperPreset', 'pageWidth', 'pageHeight', 'marginTop', 'marginBottom', 'marginLeft',
    'marginRight', 'fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'textIndent', 'textAlign',
    'titleSize', 'titleBottom', 'titleAlign', 'showPageNumbers', 'firstPageNumber', 'viewMode',
    'zoomSelect', 'toggleGuidesBtn', 'resetSettingsBtn', 'measureRoot', 'toast', 'previewViewport'
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  const renderInputs = [
    els.projectName, els.titleInput, els.subtitleInput, els.authorInput, els.bodyInput,
    els.pageWidth, els.pageHeight, els.marginTop, els.marginBottom, els.marginLeft, els.marginRight,
    els.fontFamily, els.fontSize, els.lineHeight, els.letterSpacing, els.textIndent, els.textAlign,
    els.titleSize, els.titleBottom, els.titleAlign, els.showPageNumbers, els.firstPageNumber
  ];

  renderInputs.forEach((element) => {
    const eventName = element.matches('select, input[type="checkbox"]') ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      if (element === els.bodyInput) updateCharCount();
      markDirty();
      scheduleRender();
      scheduleAutosave();
    });
  });

  els.paperPreset.addEventListener('change', handlePresetChange);
  els.viewMode.addEventListener('change', () => {
    applyViewSettings();
    markDirty();
    scheduleAutosave();
  });
  els.zoomSelect.addEventListener('change', () => {
    applyViewSettings();
    markDirty();
    scheduleAutosave();
  });

  els.toggleGuidesBtn.addEventListener('click', () => {
    const pressed = els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true';
    els.toggleGuidesBtn.setAttribute('aria-pressed', String(!pressed));
    applyGuides();
    markDirty();
    scheduleAutosave();
  });

  els.newBtn.addEventListener('click', createNewProject);
  els.saveBtn.addEventListener('click', saveToBrowser);
  els.loadBtn.addEventListener('click', loadFromBrowser);
  els.exportBtn.addEventListener('click', exportJson);
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', importJson);
  els.printBtn.addEventListener('click', printDocument);
  els.resetSettingsBtn.addEventListener('click', resetSettings);

  window.addEventListener('beforeprint', () => {
    applyPrintPageRule();
    document.documentElement.style.setProperty('--preview-zoom', '1');
  });
}

function handlePresetChange() {
  const preset = els.paperPreset.value;
  if (PAPER_PRESETS[preset]) {
    els.pageWidth.value = PAPER_PRESETS[preset].width;
    els.pageHeight.value = PAPER_PRESETS[preset].height;
  }
  setPaperInputsReadOnly(preset !== 'custom');
  markDirty();
  scheduleRender();
  scheduleAutosave();
}

function setPaperInputsReadOnly(readOnly) {
  els.pageWidth.readOnly = readOnly;
  els.pageHeight.readOnly = readOnly;
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderDocument, 80);
}

function renderDocument() {
  if (isRendering) return;
  isRendering = true;

  try {
    const state = collectState();
    applyCssVariables(state.settings);
    applyPrintPageRule();

    const fragments = paginate(state);
    buildPreview(fragments, state.settings);
    applyViewSettings();
    applyGuides();
    els.pageCount.textContent = `${fragments.length}ページ`;
  } catch (error) {
    console.error(error);
    showToast('プレビュー生成中にエラーが発生しました。設定値を確認してください。');
  } finally {
    isRendering = false;
  }
}

function paginate(state) {
  const root = createMeasurePage();
  const content = root.querySelector('.page-content');
  const pages = [[]];
  let pageIndex = 0;

  const heading = createHeadingElement(state.manuscript);
  if (heading) {
    content.appendChild(heading.cloneNode(true));
    pages[pageIndex].push({ type: 'heading', data: state.manuscript });
  }

  const paragraphs = normalizeParagraphs(state.manuscript.body);

  paragraphs.forEach((paragraphText) => {
    let remaining = paragraphText;
    let isContinuation = false;

    if (remaining.length === 0) return;

    while (remaining.length > 0) {
      const fullParagraph = createParagraphElement(remaining, isContinuation);
      content.appendChild(fullParagraph);

      if (fits(content)) {
        pages[pageIndex].push({ type: 'paragraph', text: remaining, continuation: isContinuation });
        remaining = '';
        continue;
      }

      fullParagraph.remove();

      if (content.childElementCount === 0) {
        const splitIndex = findFittingLength(content, remaining, isContinuation);
        const safeIndex = Math.max(1, splitIndex);
        const head = remaining.slice(0, safeIndex);
        const tail = remaining.slice(safeIndex);
        const fragment = createParagraphElement(head, isContinuation);
        content.appendChild(fragment);
        pages[pageIndex].push({ type: 'paragraph', text: head, continuation: isContinuation });
        remaining = tail;
        isContinuation = true;
        startNewPage();
      } else {
        const splitIndex = findFittingLength(content, remaining, isContinuation);

        if (splitIndex > 0) {
          const head = remaining.slice(0, splitIndex);
          const tail = remaining.slice(splitIndex);
          content.appendChild(createParagraphElement(head, isContinuation));
          pages[pageIndex].push({ type: 'paragraph', text: head, continuation: isContinuation });
          remaining = tail;
          isContinuation = true;
        }

        startNewPage();
      }
    }
  });

  if (pages.length > 1 && pages[pages.length - 1].length === 0) {
    pages.pop();
  }

  root.remove();
  return pages.length ? pages : [[]];

  function startNewPage() {
    pageIndex += 1;
    pages.push([]);
    content.replaceChildren();
  }
}

function createMeasurePage() {
  els.measureRoot.replaceChildren();
  const paper = document.createElement('div');
  paper.className = 'paper';
  const content = document.createElement('div');
  content.className = 'page-content';
  paper.appendChild(content);
  els.measureRoot.appendChild(paper);
  return paper;
}

function fits(content) {
  return content.scrollHeight <= content.clientHeight + 0.5;
}

function findFittingLength(content, text, continuation) {
  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const probe = createParagraphElement(text.slice(0, mid), continuation);
    content.appendChild(probe);
    const doesFit = fits(content);
    probe.remove();

    if (doesFit) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return preferNaturalBreak(text, best);
}

function preferNaturalBreak(text, index) {
  if (index <= 1 || index >= text.length) return index;

  const windowStart = Math.max(1, index - 24);
  const candidate = text.slice(windowStart, index);
  const punctuation = ['。', '、', '！', '？', '」', '』', '）', '】', '》', '〉', '\n'];

  for (let i = candidate.length - 1; i >= 0; i -= 1) {
    if (punctuation.includes(candidate[i])) {
      return windowStart + i + 1;
    }
  }

  return index;
}

function createHeadingElement(manuscript) {
  if (!manuscript.title && !manuscript.subtitle && !manuscript.author) return null;

  const wrap = document.createElement('section');
  wrap.className = 'document-heading';

  if (manuscript.title) {
    const title = document.createElement('h3');
    title.className = 'doc-title';
    title.textContent = manuscript.title;
    wrap.appendChild(title);
  }

  if (manuscript.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'doc-subtitle';
    subtitle.textContent = manuscript.subtitle;
    wrap.appendChild(subtitle);
  }

  if (manuscript.author) {
    const author = document.createElement('p');
    author.className = 'doc-author';
    author.textContent = manuscript.author;
    wrap.appendChild(author);
  }

  return wrap;
}

function createParagraphElement(text, continuation = false) {
  const paragraph = document.createElement('p');
  paragraph.className = 'body-paragraph';
  paragraph.textContent = text;
  if (continuation) paragraph.style.textIndent = '0';
  return paragraph;
}

function normalizeParagraphs(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u200B]/g, '')
    .split(/\n[\t \u3000]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildPreview(pageFragments, settings) {
  els.pages.replaceChildren();

  pageFragments.forEach((fragments, index) => {
    const paper = document.createElement('article');
    paper.className = 'paper';
    paper.dataset.page = String(index + 1);

    const content = document.createElement('div');
    content.className = 'page-content';

    fragments.forEach((fragment) => {
      if (fragment.type === 'heading') {
        const heading = createHeadingElement(fragment.data);
        if (heading) content.appendChild(heading);
      }
      if (fragment.type === 'paragraph') {
        content.appendChild(createParagraphElement(fragment.text, fragment.continuation));
      }
    });

    if (settings.showPageNumbers && (settings.firstPageNumber || index > 0)) {
      const pageNumber = document.createElement('div');
      pageNumber.className = 'page-number';
      pageNumber.textContent = String(index + 1);
      paper.appendChild(pageNumber);
    }

    paper.appendChild(content);
    els.pages.appendChild(paper);
  });
}

function applyCssVariables(settings) {
  const root = document.documentElement;
  root.style.setProperty('--page-width', `${settings.pageWidth}mm`);
  root.style.setProperty('--page-height', `${settings.pageHeight}mm`);
  root.style.setProperty('--page-margin-top', `${settings.marginTop}mm`);
  root.style.setProperty('--page-margin-bottom', `${settings.marginBottom}mm`);
  root.style.setProperty('--page-margin-left', `${settings.marginLeft}mm`);
  root.style.setProperty('--page-margin-right', `${settings.marginRight}mm`);
  root.style.setProperty('--body-font', settings.fontFamily);
  root.style.setProperty('--body-size', `${settings.fontSize}pt`);
  root.style.setProperty('--body-leading', `${settings.lineHeight}pt`);
  root.style.setProperty('--body-tracking', `${settings.letterSpacing}em`);
  root.style.setProperty('--body-indent', `${settings.textIndent}em`);
  root.style.setProperty('--body-align', settings.textAlign);
  root.style.setProperty('--title-size', `${settings.titleSize}pt`);
  root.style.setProperty('--title-align', settings.titleAlign);
  root.style.setProperty('--title-bottom', `${settings.titleBottom}mm`);
}

function applyViewSettings() {
  const mode = els.viewMode.value;
  const zoom = Number(els.zoomSelect.value) || 0.7;
  els.pages.classList.toggle('single', mode === 'single');
  els.pages.classList.toggle('spread', mode === 'spread');
  els.pages.style.zoom = String(zoom);
}

function applyGuides() {
  const show = els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true';
  document.querySelectorAll('.page-content').forEach((content) => {
    content.classList.toggle('guides', show);
  });
}

function applyPrintPageRule() {
  let style = document.getElementById('dynamicPageStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamicPageStyle';
    document.head.appendChild(style);
  }

  const width = sanitizeNumber(els.pageWidth.value, 148);
  const height = sanitizeNumber(els.pageHeight.value, 210);
  style.textContent = `@page { size: ${width}mm ${height}mm; margin: 0; }`;
}

function collectState() {
  return {
    projectName: els.projectName.value.trim() || '名称未設定',
    manuscript: {
      title: els.titleInput.value,
      subtitle: els.subtitleInput.value,
      author: els.authorInput.value,
      body: els.bodyInput.value
    },
    settings: {
      paperPreset: els.paperPreset.value,
      pageWidth: sanitizeNumber(els.pageWidth.value, 148),
      pageHeight: sanitizeNumber(els.pageHeight.value, 210),
      marginTop: sanitizeNumber(els.marginTop.value, 15),
      marginBottom: sanitizeNumber(els.marginBottom.value, 18),
      marginLeft: sanitizeNumber(els.marginLeft.value, 18),
      marginRight: sanitizeNumber(els.marginRight.value, 15),
      fontFamily: els.fontFamily.value,
      fontSize: sanitizeNumber(els.fontSize.value, 9),
      lineHeight: sanitizeNumber(els.lineHeight.value, 15),
      letterSpacing: sanitizeNumber(els.letterSpacing.value, 0.02),
      textIndent: sanitizeNumber(els.textIndent.value, 1),
      textAlign: els.textAlign.value,
      titleSize: sanitizeNumber(els.titleSize.value, 20),
      titleBottom: sanitizeNumber(els.titleBottom.value, 14),
      titleAlign: els.titleAlign.value,
      showPageNumbers: els.showPageNumbers.checked,
      firstPageNumber: els.firstPageNumber.checked,
      viewMode: els.viewMode.value,
      zoom: sanitizeNumber(els.zoomSelect.value, 0.7),
      showGuides: els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true'
    },
    metadata: {
      appVersion: 'v001',
      updatedAt: new Date().toISOString()
    }
  };
}

function applyState(state) {
  const normalized = normalizeState(state);

  els.projectName.value = normalized.projectName;
  els.titleInput.value = normalized.manuscript.title;
  els.subtitleInput.value = normalized.manuscript.subtitle;
  els.authorInput.value = normalized.manuscript.author;
  els.bodyInput.value = normalized.manuscript.body;

  const settings = normalized.settings;
  els.paperPreset.value = settings.paperPreset;
  els.pageWidth.value = settings.pageWidth;
  els.pageHeight.value = settings.pageHeight;
  els.marginTop.value = settings.marginTop;
  els.marginBottom.value = settings.marginBottom;
  els.marginLeft.value = settings.marginLeft;
  els.marginRight.value = settings.marginRight;
  els.fontFamily.value = settings.fontFamily;
  els.fontSize.value = settings.fontSize;
  els.lineHeight.value = settings.lineHeight;
  els.letterSpacing.value = settings.letterSpacing;
  els.textIndent.value = settings.textIndent;
  els.textAlign.value = settings.textAlign;
  els.titleSize.value = settings.titleSize;
  els.titleBottom.value = settings.titleBottom;
  els.titleAlign.value = settings.titleAlign;
  els.showPageNumbers.checked = settings.showPageNumbers;
  els.firstPageNumber.checked = settings.firstPageNumber;
  els.viewMode.value = settings.viewMode;
  els.zoomSelect.value = String(settings.zoom);
  els.toggleGuidesBtn.setAttribute('aria-pressed', String(settings.showGuides));

  setPaperInputsReadOnly(settings.paperPreset !== 'custom');
  updateCharCount();
  setPaperInputsReadOnly(els.paperPreset.value !== 'custom');
  applyViewSettings();
  scheduleRender();
}

function normalizeState(raw) {
  const base = deepClone(DEFAULT_STATE);
  if (!raw || typeof raw !== 'object') return base;

  return {
    projectName: typeof raw.projectName === 'string' ? raw.projectName : base.projectName,
    manuscript: {
      ...base.manuscript,
      ...(raw.manuscript || {})
    },
    settings: {
      ...base.settings,
      ...(raw.settings || {})
    },
    metadata: {
      ...base.metadata,
      ...(raw.metadata || {})
    }
  };
}

function createNewProject() {
  if (!window.confirm('現在の入力内容を破棄して、新規プロジェクトを作成しますか？')) return;
  applyState(deepClone(DEFAULT_STATE));
  updateSaveStatus('未保存');
  showToast('新規プロジェクトを作成しました。');
}

function resetSettings() {
  if (!window.confirm('原稿は残したまま、組版設定のみ初期値へ戻しますか？')) return;
  const current = collectState();
  current.settings = deepClone(DEFAULT_STATE.settings);
  applyState(current);
  markDirty();
  scheduleAutosave();
  showToast('組版設定を初期値へ戻しました。');
}

function saveToBrowser(showMessage = true) {
  const state = collectState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSaveStatus(`保存済み ${formatTime(new Date())}`);
    if (showMessage) showToast('この端末のブラウザに保存しました。');
  } catch (error) {
    console.error(error);
    updateSaveStatus('保存に失敗');
    showToast('ブラウザ保存に失敗しました。JSON出力をご利用ください。');
  }
}

function loadFromBrowser() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    showToast('このブラウザには保存データがありません。');
    return;
  }

  try {
    applyState(JSON.parse(saved));
    updateSaveStatus('保存データを読込済み');
    showToast('保存データを読み込みました。');
  } catch (error) {
    console.error(error);
    showToast('保存データを読み込めませんでした。');
  }
}

function exportJson() {
  const state = collectState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(state.projectName)}_${dateStamp()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateSaveStatus('JSON出力済み');
  showToast('JSONファイルを書き出しました。');
}

async function importJson(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    const text = await file.text();
    const state = JSON.parse(text);
    applyState(state);
    markDirty();
    scheduleAutosave();
    showToast('JSONファイルを読み込みました。');
  } catch (error) {
    console.error(error);
    showToast('JSONファイルの形式が正しくありません。');
  }
}

function printDocument() {
  renderDocument();
  applyPrintPageRule();
  showToast('印刷画面では「余白なし・倍率100%」を推奨します。');
  setTimeout(() => window.print(), 80);
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveToBrowser(false), AUTOSAVE_DELAY);
}

function markDirty() {
  updateSaveStatus('自動保存待ち');
}

function updateSaveStatus(text) {
  els.saveStatus.textContent = text;
}

function updateCharCount() {
  const count = els.bodyInput.value.replace(/\s/g, '').length;
  els.charCount.textContent = `${count.toLocaleString('ja-JP')}文字`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function sanitizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeFileName(value) {
  return String(value || 'typesetting')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function dateStamp() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('');
}

function formatTime(date) {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
