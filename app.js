'use strict';

const APP_VERSION = 'v002';
const SCHEMA_VERSION = 2;
const AUTOSAVE_DELAY = 700;

const PROJECT_INDEX_KEY = 'typesetting-app-v002-project-index';
const PROJECT_PREFIX = 'typesetting-app-v002-project:';
const CURRENT_PROJECT_KEY = 'typesetting-app-v002-current-project';
const TEMPLATE_STORAGE_KEY = 'typesetting-app-v002-templates';
const LEGACY_STORAGE_KEY = 'typesetting-app-v001';

const DEFAULT_SETTINGS = Object.freeze({
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
});

const SAMPLE_MANUSCRIPT = Object.freeze({
  title: 'サンプルタイトル',
  subtitle: '自動組版の確認用原稿',
  author: '著者名',
  body: `これは、組版アプリv002の動作確認用原稿です。\n\n右側の設定を変更すると、用紙サイズ、余白、フォント、文字サイズ、文字間、行間が中央のプレビューへ自動反映されます。本文は空行ごとに段落として扱われ、ページ内に収まらない場合は自動的に次のページへ送られます。\n\nv002では、複数のプロジェクトをブラウザ内へ個別保存できます。右上の「プロジェクト」から保存済み案件を開き、複製、削除できます。\n\nまた、現在の組版設定だけをテンプレートとして保存できます。原稿内容はテンプレートに含まれないため、別の案件へ同じ判型や文字設定を安全に適用できます。\n\nJSON出力は、バックアップや別端末への移動に使用してください。PDFとして保存する際は、右上の「PDF出力」を押し、ブラウザの印刷画面で余白なし、倍率100%を推奨します。`
});

const DEFAULT_STATE = Object.freeze({
  projectName: '組版アプリ v002 サンプル',
  manuscript: SAMPLE_MANUSCRIPT,
  settings: DEFAULT_SETTINGS,
  metadata: {
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    projectId: null,
    createdAt: null,
    updatedAt: null
  }
});

const PAPER_PRESETS = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  B6: { width: 128, height: 182 }
};

const BUILTIN_TEMPLATES = Object.freeze([
  {
    id: 'builtin-a5-literary',
    name: 'A5 文芸書 基本',
    builtIn: true,
    settings: extractTemplateSettings(DEFAULT_SETTINGS)
  },
  {
    id: 'builtin-b6-novel',
    name: 'B6 小説 基本',
    builtIn: true,
    settings: {
      ...extractTemplateSettings(DEFAULT_SETTINGS),
      paperPreset: 'B6', pageWidth: 128, pageHeight: 182,
      marginTop: 14, marginBottom: 16, marginLeft: 17, marginRight: 14,
      fontSize: 8.5, lineHeight: 14.5, titleSize: 18, titleBottom: 12
    }
  },
  {
    id: 'builtin-a4-business',
    name: 'A4 冊子・資料 基本',
    builtIn: true,
    settings: {
      ...extractTemplateSettings(DEFAULT_SETTINGS),
      paperPreset: 'A4', pageWidth: 210, pageHeight: 297,
      marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20,
      fontFamily: "'Noto Sans JP', 'Yu Gothic', 'Hiragino Kaku Gothic ProN', sans-serif",
      fontSize: 10.5, lineHeight: 18, letterSpacing: 0,
      titleSize: 24, titleBottom: 16
    }
  }
]);

const els = {};
let currentProjectId = null;
let currentProjectCreatedAt = null;
let renderTimer = null;
let autosaveTimer = null;
let toastTimer = null;
let isRendering = false;
let isApplyingState = false;

window.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();
  loadInitialProject();
  updateCharCount();
  applyViewSettings();
  scheduleRender();
  refreshCurrentProjectStatus();
}

function cacheElements() {
  const ids = [
    'projectName', 'newBtn', 'projectsBtn', 'saveBtn', 'duplicateBtn', 'templatesBtn',
    'exportBtn', 'importBtn', 'printBtn', 'importFile', 'titleInput', 'subtitleInput',
    'authorInput', 'bodyInput', 'charCount', 'pages', 'pageCount', 'saveStatus',
    'currentProjectStatus', 'paperPreset', 'pageWidth', 'pageHeight', 'marginTop',
    'marginBottom', 'marginLeft', 'marginRight', 'fontFamily', 'fontSize', 'lineHeight',
    'letterSpacing', 'textIndent', 'textAlign', 'titleSize', 'titleBottom', 'titleAlign',
    'showPageNumbers', 'firstPageNumber', 'viewMode', 'zoomSelect', 'toggleGuidesBtn',
    'resetSettingsBtn', 'measureRoot', 'toast', 'previewViewport', 'projectsModal',
    'projectList', 'projectStorageSummary', 'createProjectFromModalBtn', 'templatesModal',
    'templateNameInput', 'saveTemplateBtn', 'templateList'
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  const renderInputs = [
    els.projectName, els.titleInput, els.subtitleInput, els.authorInput, els.bodyInput,
    els.pageWidth, els.pageHeight, els.marginTop, els.marginBottom, els.marginLeft,
    els.marginRight, els.fontFamily, els.fontSize, els.lineHeight, els.letterSpacing,
    els.textIndent, els.textAlign, els.titleSize, els.titleBottom, els.titleAlign,
    els.showPageNumbers, els.firstPageNumber
  ];

  renderInputs.forEach((element) => {
    const eventName = element.matches('select, input[type="checkbox"]') ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      if (isApplyingState) return;
      if (element === els.bodyInput) updateCharCount();
      markDirty();
      scheduleRender();
      scheduleAutosave();
    });
  });

  els.paperPreset.addEventListener('change', handlePresetChange);
  els.viewMode.addEventListener('change', handleViewSettingChange);
  els.zoomSelect.addEventListener('change', handleViewSettingChange);

  els.toggleGuidesBtn.addEventListener('click', () => {
    const pressed = els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true';
    els.toggleGuidesBtn.setAttribute('aria-pressed', String(!pressed));
    applyGuides();
    markDirty();
    scheduleAutosave();
  });

  els.newBtn.addEventListener('click', () => createNewProject(true));
  els.projectsBtn.addEventListener('click', openProjectsModal);
  els.saveBtn.addEventListener('click', () => saveCurrentProject(true));
  els.duplicateBtn.addEventListener('click', () => duplicateProjectById(currentProjectId, true));
  els.templatesBtn.addEventListener('click', openTemplatesModal);
  els.exportBtn.addEventListener('click', exportJson);
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', importJson);
  els.printBtn.addEventListener('click', printDocument);
  els.resetSettingsBtn.addEventListener('click', resetSettings);

  els.createProjectFromModalBtn.addEventListener('click', () => {
    closeModal('projectsModal');
    createNewProject(true);
  });
  els.projectList.addEventListener('click', handleProjectListAction);
  els.saveTemplateBtn.addEventListener('click', saveCurrentSettingsAsTemplate);
  els.templateList.addEventListener('click', handleTemplateListAction);

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal(backdrop.id);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((modal) => closeModal(modal.id));
  });

  window.addEventListener('beforeprint', () => {
    applyPrintPageRule();
    document.documentElement.style.setProperty('--preview-zoom', '1');
  });

  window.addEventListener('beforeunload', () => {
    clearTimeout(autosaveTimer);
    saveCurrentProject(false);
  });
}

function loadInitialProject() {
  const index = loadProjectIndex();
  const preferredId = safeStorageGet(CURRENT_PROJECT_KEY);

  if (preferredId && loadProjectById(preferredId, false)) {
    updateSaveStatus('保存データを読込済み');
    return;
  }

  for (const item of index) {
    if (loadProjectById(item.id, false)) {
      updateSaveStatus('保存データを読込済み');
      return;
    }
  }

  const legacy = readJsonFromStorage(LEGACY_STORAGE_KEY, null);
  if (legacy) {
    const migrated = normalizeState(legacy);
    migrated.projectName = `${migrated.projectName || '組版データ'}（v001移行）`;
    assignNewProjectMetadata(migrated);
    currentProjectId = migrated.metadata.projectId;
    currentProjectCreatedAt = migrated.metadata.createdAt;
    applyState(migrated);
    saveCurrentProject(false);
    updateSaveStatus('v001データを移行済み');
    showToast('v001のブラウザ保存データをv002へ移行しました。');
    return;
  }

  const initial = deepClone(DEFAULT_STATE);
  assignNewProjectMetadata(initial);
  currentProjectId = initial.metadata.projectId;
  currentProjectCreatedAt = initial.metadata.createdAt;
  applyState(initial);
  saveCurrentProject(false);
  updateSaveStatus('初期データを保存済み');
}

function handlePresetChange() {
  if (isApplyingState) return;
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

function handleViewSettingChange() {
  if (isApplyingState) return;
  applyViewSettings();
  markDirty();
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
        content.appendChild(createParagraphElement(head, isContinuation));
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

  if (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
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
    if (punctuation.includes(candidate[i])) return windowStart + i + 1;
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
      } else if (fragment.type === 'paragraph') {
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
  document.querySelectorAll('.page-content').forEach((content) => content.classList.toggle('guides', show));
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
  const now = new Date().toISOString();
  return {
    projectName: els.projectName.value.trim() || '名称未設定',
    manuscript: {
      title: els.titleInput.value,
      subtitle: els.subtitleInput.value,
      author: els.authorInput.value,
      body: els.bodyInput.value
    },
    settings: collectSettings(),
    metadata: {
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      projectId: currentProjectId,
      createdAt: currentProjectCreatedAt || now,
      updatedAt: now
    }
  };
}

function collectSettings() {
  return {
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
  };
}

function applyState(state) {
  const normalized = normalizeState(state);
  isApplyingState = true;

  try {
    els.projectName.value = normalized.projectName;
    els.titleInput.value = normalized.manuscript.title;
    els.subtitleInput.value = normalized.manuscript.subtitle;
    els.authorInput.value = normalized.manuscript.author;
    els.bodyInput.value = normalized.manuscript.body;
    applySettingsToInputs(normalized.settings);
    updateCharCount();
    applyViewSettings();
    scheduleRender();
  } finally {
    isApplyingState = false;
  }
}

function applySettingsToInputs(settings) {
  const normalized = { ...deepClone(DEFAULT_SETTINGS), ...(settings || {}) };
  els.paperPreset.value = normalized.paperPreset;
  els.pageWidth.value = normalized.pageWidth;
  els.pageHeight.value = normalized.pageHeight;
  els.marginTop.value = normalized.marginTop;
  els.marginBottom.value = normalized.marginBottom;
  els.marginLeft.value = normalized.marginLeft;
  els.marginRight.value = normalized.marginRight;
  els.fontFamily.value = normalized.fontFamily;
  els.fontSize.value = normalized.fontSize;
  els.lineHeight.value = normalized.lineHeight;
  els.letterSpacing.value = normalized.letterSpacing;
  els.textIndent.value = normalized.textIndent;
  els.textAlign.value = normalized.textAlign;
  els.titleSize.value = normalized.titleSize;
  els.titleBottom.value = normalized.titleBottom;
  els.titleAlign.value = normalized.titleAlign;
  els.showPageNumbers.checked = Boolean(normalized.showPageNumbers);
  els.firstPageNumber.checked = Boolean(normalized.firstPageNumber);
  els.viewMode.value = normalized.viewMode;
  els.zoomSelect.value = String(normalized.zoom);
  els.toggleGuidesBtn.setAttribute('aria-pressed', String(Boolean(normalized.showGuides)));
  setPaperInputsReadOnly(normalized.paperPreset !== 'custom');
}

function normalizeState(raw) {
  const base = deepClone(DEFAULT_STATE);
  if (!raw || typeof raw !== 'object') return base;
  return {
    projectName: typeof raw.projectName === 'string' ? raw.projectName : base.projectName,
    manuscript: { ...base.manuscript, ...(raw.manuscript || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
    metadata: { ...base.metadata, ...(raw.metadata || {}) }
  };
}

function createNewProject(requireConfirmation = true, saveExisting = true) {
  if (requireConfirmation && !window.confirm('新しいプロジェクトを作成しますか？現在の内容は自動保存されます。')) return;
  if (saveExisting) saveCurrentProject(false);

  const blank = {
    projectName: '新規組版データ',
    manuscript: { title: '', subtitle: '', author: '', body: '' },
    settings: deepClone(DEFAULT_SETTINGS),
    metadata: {}
  };
  assignNewProjectMetadata(blank);
  currentProjectId = blank.metadata.projectId;
  currentProjectCreatedAt = blank.metadata.createdAt;
  applyState(blank);
  saveCurrentProject(false);
  updateSaveStatus('新規作成・保存済み');
  refreshCurrentProjectStatus();
  showToast('新しいプロジェクトを作成しました。');
}

function resetSettings() {
  if (!window.confirm('原稿は残したまま、組版設定のみ初期値へ戻しますか？')) return;
  isApplyingState = true;
  applySettingsToInputs(deepClone(DEFAULT_SETTINGS));
  isApplyingState = false;
  scheduleRender();
  markDirty();
  scheduleAutosave();
  showToast('組版設定を初期値へ戻しました。');
}

function saveCurrentProject(showMessage = true) {
  try {
    if (!currentProjectId) currentProjectId = createId('project');
    const state = collectState();
    state.metadata.projectId = currentProjectId;
    currentProjectCreatedAt = state.metadata.createdAt;
    localStorage.setItem(`${PROJECT_PREFIX}${currentProjectId}`, JSON.stringify(state));
    upsertProjectIndex(state);
    localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
    updateSaveStatus(`保存済み ${formatTime(new Date())}`);
    refreshCurrentProjectStatus();
    if (showMessage) showToast('プロジェクトをこのブラウザに保存しました。');
    return true;
  } catch (error) {
    console.error(error);
    updateSaveStatus('保存に失敗');
    if (showMessage) showToast('ブラウザ保存に失敗しました。JSON出力をご利用ください。');
    return false;
  }
}

function loadProjectById(projectId, showMessage = true) {
  const raw = readJsonFromStorage(`${PROJECT_PREFIX}${projectId}`, null);
  if (!raw) return false;
  const state = normalizeState(raw);
  currentProjectId = projectId;
  currentProjectCreatedAt = state.metadata.createdAt || new Date().toISOString();
  state.metadata.projectId = projectId;
  applyState(state);
  safeStorageSet(CURRENT_PROJECT_KEY, projectId);
  updateSaveStatus('保存データを読込済み');
  refreshCurrentProjectStatus();
  if (showMessage) showToast(`「${state.projectName}」を開きました。`);
  return true;
}

function duplicateProjectById(projectId, openDuplicate = false) {
  if (!projectId) return;
  saveCurrentProject(false);
  const original = readJsonFromStorage(`${PROJECT_PREFIX}${projectId}`, null);
  if (!original) {
    showToast('複製元のプロジェクトを読み込めませんでした。');
    return;
  }

  const copy = normalizeState(original);
  copy.projectName = `${copy.projectName} コピー`;
  assignNewProjectMetadata(copy);
  persistProjectRecord(copy);

  if (openDuplicate) loadProjectById(copy.metadata.projectId, false);
  renderProjectList();
  showToast(`「${copy.projectName}」を作成しました。`);
}

function deleteProjectById(projectId) {
  const index = loadProjectIndex();
  const target = index.find((item) => item.id === projectId);
  if (!target) return;
  if (!window.confirm(`「${target.projectName}」をこのブラウザから削除しますか？\nJSON出力していない場合、元に戻せません。`)) return;

  localStorage.removeItem(`${PROJECT_PREFIX}${projectId}`);
  saveProjectIndex(index.filter((item) => item.id !== projectId));

  if (currentProjectId === projectId) {
    const remaining = loadProjectIndex();
    if (remaining.length && loadProjectById(remaining[0].id, false)) {
      updateSaveStatus('別のプロジェクトを読込済み');
    } else {
      createNewProject(false, false);
    }
  }

  renderProjectList();
  refreshCurrentProjectStatus();
  showToast('プロジェクトを削除しました。');
}

function openProjectsModal() {
  saveCurrentProject(false);
  renderProjectList();
  openModal('projectsModal');
}

function renderProjectList() {
  const index = loadProjectIndex();
  els.projectStorageSummary.textContent = `${index.length}件保存中／このブラウザ・このURL内でのみ利用できます。`;
  els.projectList.replaceChildren();

  if (!index.length) {
    els.projectList.appendChild(createEmptyLibraryMessage('保存済みプロジェクトはありません。'));
    return;
  }

  index.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'library-item';
    if (item.id === currentProjectId) row.classList.add('current');

    const info = document.createElement('div');
    info.className = 'library-item-info';
    const title = document.createElement('div');
    title.className = 'library-item-title';
    title.textContent = item.projectName;
    if (item.id === currentProjectId) {
      const badge = document.createElement('span');
      badge.className = 'current-badge';
      badge.textContent = '編集中';
      title.appendChild(badge);
    }
    const meta = document.createElement('p');
    meta.className = 'library-item-meta';
    meta.textContent = `${item.title || 'タイトル未設定'} ／ 更新 ${formatDateTime(item.updatedAt)}`;
    info.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'library-actions';
    actions.append(
      createActionButton('開く', 'open', item.id, 'modal-primary small'),
      createActionButton('複製', 'duplicate', item.id, 'modal-secondary small'),
      createActionButton('削除', 'delete', item.id, 'danger small')
    );
    row.append(info, actions);
    els.projectList.appendChild(row);
  });
}

function handleProjectListAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === 'open') {
    loadProjectById(id, true);
    closeModal('projectsModal');
  } else if (action === 'duplicate') {
    duplicateProjectById(id, false);
  } else if (action === 'delete') {
    deleteProjectById(id);
  }
}

function loadProjectIndex() {
  const data = readJsonFromStorage(PROJECT_INDEX_KEY, []);
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item && typeof item.id === 'string')
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

function saveProjectIndex(index) {
  localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(index));
}

function upsertProjectIndex(state) {
  const index = loadProjectIndex().filter((item) => item.id !== state.metadata.projectId);
  index.unshift({
    id: state.metadata.projectId,
    projectName: state.projectName,
    title: state.manuscript.title,
    createdAt: state.metadata.createdAt,
    updatedAt: state.metadata.updatedAt
  });
  saveProjectIndex(index);
}

function persistProjectRecord(state) {
  const normalized = normalizeState(state);
  localStorage.setItem(`${PROJECT_PREFIX}${normalized.metadata.projectId}`, JSON.stringify(normalized));
  upsertProjectIndex(normalized);
}

function assignNewProjectMetadata(state) {
  const now = new Date().toISOString();
  state.metadata = {
    ...(state.metadata || {}),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    projectId: createId('project'),
    createdAt: now,
    updatedAt: now
  };
}

function openTemplatesModal() {
  renderTemplateList();
  els.templateNameInput.value = '';
  openModal('templatesModal');
}

function saveCurrentSettingsAsTemplate() {
  const name = els.templateNameInput.value.trim();
  if (!name) {
    showToast('テンプレート名を入力してください。');
    els.templateNameInput.focus();
    return;
  }

  const templates = loadUserTemplates();
  const now = new Date().toISOString();
  templates.unshift({
    id: createId('template'),
    name,
    builtIn: false,
    settings: extractTemplateSettings(collectSettings()),
    createdAt: now,
    updatedAt: now
  });

  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
    els.templateNameInput.value = '';
    renderTemplateList();
    showToast(`テンプレート「${name}」を保存しました。`);
  } catch (error) {
    console.error(error);
    showToast('テンプレートを保存できませんでした。');
  }
}

function renderTemplateList() {
  const templates = [...BUILTIN_TEMPLATES, ...loadUserTemplates()];
  els.templateList.replaceChildren();

  templates.forEach((template) => {
    const row = document.createElement('article');
    row.className = 'library-item';
    const info = document.createElement('div');
    info.className = 'library-item-info';
    const title = document.createElement('div');
    title.className = 'library-item-title';
    title.textContent = template.name;
    if (template.builtIn) {
      const badge = document.createElement('span');
      badge.className = 'builtin-badge';
      badge.textContent = '標準';
      title.appendChild(badge);
    }
    const meta = document.createElement('p');
    meta.className = 'library-item-meta';
    meta.textContent = describeTemplate(template.settings);
    info.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'library-actions';
    actions.appendChild(createActionButton('適用', 'apply', template.id, 'modal-primary small'));
    if (!template.builtIn) actions.appendChild(createActionButton('削除', 'delete', template.id, 'danger small'));
    row.append(info, actions);
    els.templateList.appendChild(row);
  });
}

function handleTemplateListAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const template = findTemplateById(id);
  if (!template) return;

  if (action === 'apply') {
    applyTemplate(template);
  } else if (action === 'delete') {
    deleteTemplate(id);
  }
}

function applyTemplate(template) {
  const displaySettings = {
    viewMode: els.viewMode.value,
    zoom: sanitizeNumber(els.zoomSelect.value, 0.7),
    showGuides: els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true'
  };
  isApplyingState = true;
  applySettingsToInputs({ ...deepClone(DEFAULT_SETTINGS), ...template.settings, ...displaySettings });
  isApplyingState = false;
  scheduleRender();
  markDirty();
  scheduleAutosave();
  closeModal('templatesModal');
  showToast(`テンプレート「${template.name}」を適用しました。`);
}

function deleteTemplate(templateId) {
  const templates = loadUserTemplates();
  const target = templates.find((template) => template.id === templateId);
  if (!target) return;
  if (!window.confirm(`テンプレート「${target.name}」を削除しますか？`)) return;
  const next = templates.filter((template) => template.id !== templateId);
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
  renderTemplateList();
  showToast('テンプレートを削除しました。');
}

function loadUserTemplates() {
  const data = readJsonFromStorage(TEMPLATE_STORAGE_KEY, []);
  return Array.isArray(data) ? data.filter((item) => item && item.id && item.settings) : [];
}

function findTemplateById(templateId) {
  return BUILTIN_TEMPLATES.find((item) => item.id === templateId)
    || loadUserTemplates().find((item) => item.id === templateId)
    || null;
}

function extractTemplateSettings(settings) {
  const copy = { ...deepClone(DEFAULT_SETTINGS), ...(settings || {}) };
  delete copy.viewMode;
  delete copy.zoom;
  delete copy.showGuides;
  return copy;
}

function describeTemplate(settings) {
  const paper = settings.paperPreset === 'custom'
    ? `${settings.pageWidth} × ${settings.pageHeight} mm`
    : `${settings.paperPreset}（${settings.pageWidth} × ${settings.pageHeight} mm）`;
  return `${paper} ／ ${settings.fontSize}pt・行間${settings.lineHeight}pt ／ 余白 上${settings.marginTop} 下${settings.marginBottom} 左${settings.marginLeft} 右${settings.marginRight}mm`;
}

function exportJson() {
  saveCurrentProject(false);
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
    const imported = normalizeState(JSON.parse(text));
    assignNewProjectMetadata(imported);
    imported.projectName = imported.projectName || file.name.replace(/\.json$/i, '');
    currentProjectId = imported.metadata.projectId;
    currentProjectCreatedAt = imported.metadata.createdAt;
    applyState(imported);
    saveCurrentProject(false);
    updateSaveStatus('JSON読込・保存済み');
    refreshCurrentProjectStatus();
    showToast('JSONを新しいプロジェクトとして読み込みました。');
  } catch (error) {
    console.error(error);
    showToast('JSONファイルの形式が正しくありません。');
  }
}

function printDocument() {
  renderDocument();
  applyPrintPageRule();
  saveCurrentProject(false);
  showToast('印刷画面では「余白なし・倍率100%」を推奨します。');
  setTimeout(() => window.print(), 80);
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveCurrentProject(false), AUTOSAVE_DELAY);
}

function markDirty() {
  updateSaveStatus('自動保存待ち');
}

function updateSaveStatus(text) {
  els.saveStatus.textContent = text;
}

function refreshCurrentProjectStatus() {
  const count = loadProjectIndex().length;
  els.currentProjectStatus.textContent = `ブラウザ保存 ${count}件`;
}

function updateCharCount() {
  const count = els.bodyInput.value.replace(/\s/g, '').length;
  els.charCount.textContent = `${count.toLocaleString('ja-JP')}文字`;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.classList.add('open'));
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.hidden) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.hidden = true;
    if (!document.querySelector('.modal-backdrop.open')) document.body.classList.remove('modal-open');
  }, 120);
}

function createActionButton(label, action, id, classNames) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${classNames}`;
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  return button;
}

function createEmptyLibraryMessage(message) {
  const empty = document.createElement('p');
  empty.className = 'empty-library';
  empty.textContent = message;
  return empty;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

function readJsonFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
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
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
}

function formatTime(date) {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '日時不明';
  return date.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
