'use strict';

const APP_VERSION = 'v006';
const SCHEMA_VERSION = 6;
const AUTOSAVE_DELAY = 700;

const PROJECT_INDEX_KEY = 'typesetting-app-v006-project-index';
const PROJECT_PREFIX = 'typesetting-app-v006-project:';
const CURRENT_PROJECT_KEY = 'typesetting-app-v006-current-project';
const TEMPLATE_STORAGE_KEY = 'typesetting-app-v006-templates';

const LEGACY_V5_PROJECT_INDEX_KEY = 'typesetting-app-v005-project-index';
const LEGACY_V5_PROJECT_PREFIX = 'typesetting-app-v005-project:';
const LEGACY_V5_CURRENT_PROJECT_KEY = 'typesetting-app-v005-current-project';
const LEGACY_V5_TEMPLATE_STORAGE_KEY = 'typesetting-app-v005-templates';
const LEGACY_V1_STORAGE_KEY = 'typesetting-app-v001';
const MIGRATION_MARKER_KEY = 'typesetting-app-v006-migration-complete';

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
  useTextIndent: true,
  textIndent: 1,
  textAlign: 'justify',
  preserveBlankLines: true,
  blankLineScale: 1,
  titleSize: 20,
  titleBottom: 14,
  titleAlign: 'center',
  showDocumentHeading: true,
  bodyStartOnNewPage: false,
  heading1FontFamily: "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
  heading1Size: 16,
  heading1Align: 'left',
  heading1SpaceBefore: 10,
  heading1SpaceAfter: 5,
  heading1PageBreakBefore: true,
  heading1KeepWithNext: true,
  heading2FontFamily: "'Noto Sans JP', 'Yu Gothic', 'Hiragino Kaku Gothic ProN', sans-serif",
  heading2Size: 13,
  heading2Align: 'left',
  heading2SpaceBefore: 7,
  heading2SpaceAfter: 3,
  heading2PageBreakBefore: false,
  heading2KeepWithNext: true,
  heading3FontFamily: "'Noto Sans JP', 'Yu Gothic', 'Hiragino Kaku Gothic ProN', sans-serif",
  heading3Size: 11,
  heading3Align: 'left',
  heading3SpaceBefore: 5,
  heading3SpaceAfter: 2,
  heading3PageBreakBefore: false,
  heading3KeepWithNext: true,
  showPageNumbers: true,
  firstPageNumber: false,
  viewMode: 'single',
  zoom: 0.7,
  showGuides: true
});

const SAMPLE_MANUSCRIPT = Object.freeze({
  title: 'サンプルタイトル',
  subtitle: '見出し・字下げ・空行保持の確認用原稿',
  author: '著者名',
  body: `# 第1章　組版アプリv006

これは、組版アプリv006の動作確認用原稿です。

右側の設定を変更すると、用紙サイズ、余白、フォント、文字サイズ、文字間、行間が中央のプレビューへ自動反映されます。

## 見出しの入力方法

本文内で行頭に「# 」「## 」「### 」を付けると、大見出し・中見出し・小見出しとして自動認識します。見出し記号と文字の間には半角スペースを入れてください。

### 段落単位の調整

中央プレビューの本文段落をクリックすると、その段落だけ文字サイズ、行間、文字間、揃え、字下げ、前後余白などを調整できます。

# 第2章　保存と出力

強制改ページや「次の段落と同じページに置く」設定にも対応しています。個別設定を解除すると、本文全体の組版設定へ戻ります。

JSON出力は、バックアップや別端末への移動に使用してください。PDFとして保存する際は、右上の「PDF出力」を押し、ブラウザの印刷画面で余白なし、倍率100%を推奨します。`
});

const DEFAULT_STATE = Object.freeze({
  projectName: '組版アプリ v006 サンプル',
  manuscript: { ...SAMPLE_MANUSCRIPT, paragraphs: [] },
  paragraphOverrides: {},
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
let isApplyingParagraphControls = false;
let paragraphRecords = [];
let trailingBlankLines = 0;
let paragraphOverrides = {};
let selectedParagraphId = null;

window.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();
  loadInitialProject();
  updateCharCount();
  applyViewSettings();
  updateBlankLineControls();
  updateTextIndentControls();
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
    'letterSpacing', 'useTextIndent', 'textIndent', 'textAlign', 'preserveBlankLines', 'blankLineScale', 'titleSize', 'titleBottom', 'titleAlign', 'showDocumentHeading', 'bodyStartOnNewPage',
    'showPageNumbers', 'firstPageNumber', 'viewMode', 'zoomSelect', 'toggleGuidesBtn',
    'resetSettingsBtn', 'measureRoot', 'toast', 'previewViewport', 'projectsModal',
    'projectList', 'projectStorageSummary', 'createProjectFromModalBtn', 'templatesModal',
    'templateNameInput', 'saveTemplateBtn', 'templateList', 'paragraphSettingsFieldset',
    'paragraphEmptyState', 'paragraphControls', 'selectedParagraphLabel',
    'selectedParagraphExcerpt', 'previousParagraphBtn', 'nextParagraphBtn',
    'paragraphFontSize', 'paragraphLineHeight', 'paragraphLetterSpacing',
    'paragraphSpaceBefore', 'paragraphSpaceAfter', 'paragraphTextAlign', 'paragraphTextIndent',
    'paragraphPageBreakBefore', 'paragraphKeepWithNext', 'resetParagraphBtn',
    'heading1FontFamily', 'heading1Size', 'heading1Align', 'heading1SpaceBefore',
    'heading1SpaceAfter', 'heading1PageBreakBefore', 'heading1KeepWithNext',
    'heading2FontFamily', 'heading2Size', 'heading2Align', 'heading2SpaceBefore',
    'heading2SpaceAfter', 'heading2PageBreakBefore', 'heading2KeepWithNext',
    'heading3FontFamily', 'heading3Size', 'heading3Align', 'heading3SpaceBefore',
    'heading3SpaceAfter', 'heading3PageBreakBefore', 'heading3KeepWithNext'
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  const renderInputs = [
    els.projectName, els.titleInput, els.subtitleInput, els.authorInput,
    els.pageWidth, els.pageHeight, els.marginTop, els.marginBottom, els.marginLeft,
    els.marginRight, els.fontFamily, els.fontSize, els.lineHeight, els.letterSpacing,
    els.useTextIndent, els.textIndent, els.textAlign, els.preserveBlankLines, els.blankLineScale,
    els.titleSize, els.titleBottom, els.titleAlign, els.showDocumentHeading, els.bodyStartOnNewPage,
    els.heading1FontFamily, els.heading1Size, els.heading1Align, els.heading1SpaceBefore,
    els.heading1SpaceAfter, els.heading1PageBreakBefore, els.heading1KeepWithNext,
    els.heading2FontFamily, els.heading2Size, els.heading2Align, els.heading2SpaceBefore,
    els.heading2SpaceAfter, els.heading2PageBreakBefore, els.heading2KeepWithNext,
    els.heading3FontFamily, els.heading3Size, els.heading3Align, els.heading3SpaceBefore,
    els.heading3SpaceAfter, els.heading3PageBreakBefore, els.heading3KeepWithNext,
    els.showPageNumbers, els.firstPageNumber
  ];

  renderInputs.forEach((element) => {
    const eventName = element.matches('select, input[type="checkbox"]') ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      if (isApplyingState) return;
      markDirty();
      scheduleRender();
      scheduleAutosave();
    });
  });

  els.bodyInput.addEventListener('input', () => {
    if (isApplyingState) return;
    syncParagraphRecordsFromBody();
    updateCharCount();
    updateParagraphControls();
    markDirty();
    scheduleRender();
    scheduleAutosave();
  });

  els.paperPreset.addEventListener('change', handlePresetChange);
  els.viewMode.addEventListener('change', handleViewSettingChange);
  els.zoomSelect.addEventListener('change', handleViewSettingChange);
  els.preserveBlankLines.addEventListener('change', updateBlankLineControls);
  els.useTextIndent.addEventListener('change', updateTextIndentControls);

  els.toggleGuidesBtn.addEventListener('click', () => {
    const pressed = els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true';
    els.toggleGuidesBtn.setAttribute('aria-pressed', String(!pressed));
    applyGuides();
    markDirty();
    scheduleAutosave();
  });

  els.pages.addEventListener('click', (event) => {
    const paragraph = event.target.closest('.body-paragraph[data-paragraph-id]');
    if (!paragraph) return;
    selectParagraph(paragraph.dataset.paragraphId, false);
  });

  [
    els.paragraphFontSize, els.paragraphLineHeight, els.paragraphLetterSpacing,
    els.paragraphSpaceBefore, els.paragraphSpaceAfter
  ].forEach((input) => input.addEventListener('input', updateSelectedParagraphOverride));
  els.paragraphTextAlign.addEventListener('change', updateSelectedParagraphOverride);
  els.paragraphTextIndent.addEventListener('change', updateSelectedParagraphOverride);
  els.paragraphPageBreakBefore.addEventListener('change', updateSelectedParagraphOverride);
  els.paragraphKeepWithNext.addEventListener('change', updateSelectedParagraphOverride);
  els.resetParagraphBtn.addEventListener('click', resetSelectedParagraphOverride);
  els.previousParagraphBtn.addEventListener('click', () => navigateSelectedParagraph(-1));
  els.nextParagraphBtn.addEventListener('click', () => navigateSelectedParagraph(1));

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
  migrateLegacyData();
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

  const legacyV1 = readJsonFromStorage(LEGACY_V1_STORAGE_KEY, null);
  if (legacyV1) {
    const migrated = normalizeState(legacyV1);
    migrated.projectName = `${migrated.projectName || '組版データ'}（v001移行）`;
    assignNewProjectMetadata(migrated);
    currentProjectId = migrated.metadata.projectId;
    currentProjectCreatedAt = migrated.metadata.createdAt;
    applyState(migrated);
    saveCurrentProject(false);
    updateSaveStatus('v001データを移行済み');
    showToast('v001の保存データをv006へ移行しました。');
    return;
  }

  const initial = normalizeState(deepClone(DEFAULT_STATE));
  assignNewProjectMetadata(initial);
  currentProjectId = initial.metadata.projectId;
  currentProjectCreatedAt = initial.metadata.createdAt;
  applyState(initial);
  saveCurrentProject(false);
  updateSaveStatus('初期データを保存済み');
}

function migrateLegacyData() {
  if (safeStorageGet(MIGRATION_MARKER_KEY) === 'true') return;
  if (loadProjectIndex().length > 0) {
    safeStorageSet(MIGRATION_MARKER_KEY, 'true');
    return;
  }

  const legacyIndex = readJsonFromStorage(LEGACY_V5_PROJECT_INDEX_KEY, []);
  let migratedCount = 0;
  let mappedCurrentId = null;
  const legacyCurrentId = safeStorageGet(LEGACY_V5_CURRENT_PROJECT_KEY);

  if (Array.isArray(legacyIndex)) {
    legacyIndex.forEach((item) => {
      if (!item?.id) return;
      const raw = readJsonFromStorage(`${LEGACY_V5_PROJECT_PREFIX}${item.id}`, null);
      if (!raw) return;
      const state = normalizeState(raw);
      state.metadata.appVersion = APP_VERSION;
      state.metadata.schemaVersion = SCHEMA_VERSION;
      state.metadata.projectId = item.id;
      state.metadata.createdAt = state.metadata.createdAt || new Date().toISOString();
      state.metadata.updatedAt = state.metadata.updatedAt || new Date().toISOString();
      persistProjectRecord(state);
      migratedCount += 1;
      if (item.id === legacyCurrentId) mappedCurrentId = item.id;
    });
  }

  const legacyTemplates = readJsonFromStorage(LEGACY_V5_TEMPLATE_STORAGE_KEY, []);
  if (Array.isArray(legacyTemplates) && legacyTemplates.length) {
    safeStorageSet(TEMPLATE_STORAGE_KEY, JSON.stringify(legacyTemplates));
  }

  if (mappedCurrentId) safeStorageSet(CURRENT_PROJECT_KEY, mappedCurrentId);
  safeStorageSet(MIGRATION_MARKER_KEY, 'true');

  if (migratedCount > 0) {
    showToast(`v005のプロジェクト${migratedCount}件をv006へ移行しました。`);
  }
}

function updateBlankLineControls() {
  if (!els.blankLineScale || !els.preserveBlankLines) return;
  els.blankLineScale.disabled = !els.preserveBlankLines.checked;
}

function updateTextIndentControls() {
  if (!els.textIndent || !els.useTextIndent) return;
  els.textIndent.disabled = !els.useTextIndent.checked;
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
    updateParagraphSelectionHighlight();
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

  const heading = state.settings.showDocumentHeading ? createHeadingElement(state.manuscript) : null;
  if (heading) {
    content.appendChild(heading.cloneNode(true));
    pages[pageIndex].push({ type: 'heading', data: state.manuscript });
  }

  const records = Array.isArray(state.manuscript.paragraphs)
    ? state.manuscript.paragraphs
    : createParagraphRecords(state.manuscript.body);

  if (heading && state.settings.bodyStartOnNewPage && records.length) startNewPage();

  records.forEach((record, recordIndex) => {
    if (record.type === 'heading') {
      appendBodyHeading(record, recordIndex);
      return;
    }
    appendBodyParagraph(record, recordIndex);
  });

  const finalBlankLines = state.settings.preserveBlankLines
    ? sanitizeBlankLineCount(state.manuscript.trailingBlankLines)
    : 0;
  if (finalBlankLines > 0) {
    const spacer = createBlankSpaceElement(finalBlankLines, state.settings);
    content.appendChild(spacer);
    if (!fits(content) && content.childElementCount > 1) {
      spacer.remove();
      startNewPage();
      content.appendChild(spacer);
    }
    pages[pageIndex].push({ type: 'blank-space', lines: finalBlankLines });
  }

  if (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
  root.remove();
  return pages.length ? pages : [[]];

  function appendBodyHeading(record, recordIndex) {
    const headingSettings = getBodyHeadingSettings(record.level, state.settings);
    const blankLinesBefore = state.settings.preserveBlankLines
      ? sanitizeBlankLineCount(record.blankLinesBefore)
      : 0;
    const nextRecord = records[recordIndex + 1] || null;

    if (headingSettings.pageBreakBefore && content.childElementCount > 0) startNewPage();

    if (headingSettings.keepWithNext && nextRecord && content.childElementCount > 0) {
      const headingProbe = createBodyHeadingElement(record, state.settings, { blankLinesBefore });
      const nextProbe = createKeepWithNextProbe(nextRecord, state);
      content.append(headingProbe, nextProbe);
      const pairFits = fits(content);
      headingProbe.remove();
      nextProbe.remove();
      if (!pairFits) startNewPage();
    }

    const element = createBodyHeadingElement(record, state.settings, { blankLinesBefore });
    content.appendChild(element);
    if (!fits(content) && content.childElementCount > 1) {
      element.remove();
      startNewPage();
      content.appendChild(element);
    }

    pages[pageIndex].push({
      type: 'body-heading',
      record: deepClone(record),
      recordIndex,
      blankLinesBefore
    });
  }

  function appendBodyParagraph(record, recordIndex) {
    const override = normalizeParagraphOverride(state.paragraphOverrides?.[record.id]);
    const blankLinesBefore = state.settings.preserveBlankLines
      ? sanitizeBlankLineCount(record.blankLinesBefore)
      : 0;
    const nextRecord = records[recordIndex + 1] || null;

    if (override.pageBreakBefore && content.childElementCount > 0) startNewPage();

    if (override.keepWithNext && nextRecord && content.childElementCount > 0) {
      const currentProbe = createParagraphElement(record.text, {
        override,
        blankLinesBefore,
        settings: state.settings,
        isFinal: true
      });
      const nextProbe = createKeepWithNextProbe(nextRecord, state);
      content.append(currentProbe, nextProbe);
      const pairFits = fits(content);
      currentProbe.remove();
      nextProbe.remove();
      if (!pairFits) startNewPage();
    }

    let remaining = record.text;
    let isContinuation = false;

    while (remaining.length > 0) {
      const fragmentBlankLines = isContinuation ? 0 : blankLinesBefore;
      const fullParagraph = createParagraphElement(remaining, {
        continuation: isContinuation,
        override,
        blankLinesBefore: fragmentBlankLines,
        settings: state.settings,
        isFinal: true
      });
      content.appendChild(fullParagraph);

      if (fits(content)) {
        pages[pageIndex].push({
          type: 'paragraph',
          text: remaining,
          continuation: isContinuation,
          isFinal: true,
          paragraphId: record.id,
          paragraphIndex: getEditableParagraphIndex(record.id),
          blankLinesBefore: fragmentBlankLines,
          override
        });
        remaining = '';
        continue;
      }

      fullParagraph.remove();
      const splitIndex = findFittingLength(
        content,
        remaining,
        isContinuation,
        override,
        fragmentBlankLines,
        state.settings
      );

      if (content.childElementCount > 0 && splitIndex >= remaining.length) {
        startNewPage();
        continue;
      }

      if (content.childElementCount === 0) {
        const safeIndex = Math.max(1, Math.min(splitIndex || 1, remaining.length));
        const head = remaining.slice(0, safeIndex);
        const tail = remaining.slice(safeIndex);
        const isFinal = tail.length === 0;
        content.appendChild(createParagraphElement(head, {
          continuation: isContinuation,
          override,
          blankLinesBefore: fragmentBlankLines,
          settings: state.settings,
          isFinal: false
        }));
        pages[pageIndex].push({
          type: 'paragraph',
          text: head,
          continuation: isContinuation,
          isFinal,
          paragraphId: record.id,
          paragraphIndex: getEditableParagraphIndex(record.id),
          blankLinesBefore: fragmentBlankLines,
          override
        });
        remaining = tail;
        isContinuation = true;
        if (remaining.length > 0) startNewPage();
        continue;
      }

      if (splitIndex > 0) {
        const head = remaining.slice(0, splitIndex);
        const tail = remaining.slice(splitIndex);
        content.appendChild(createParagraphElement(head, {
          continuation: isContinuation,
          override,
          blankLinesBefore: fragmentBlankLines,
          settings: state.settings,
          isFinal: false
        }));
        pages[pageIndex].push({
          type: 'paragraph',
          text: head,
          continuation: isContinuation,
          isFinal: false,
          paragraphId: record.id,
          paragraphIndex: getEditableParagraphIndex(record.id),
          blankLinesBefore: fragmentBlankLines,
          override
        });
        remaining = tail;
        isContinuation = true;
      }

      startNewPage();
    }
  }

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

function findFittingLength(content, text, continuation, override, blankLinesBefore, settings) {
  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const probe = createParagraphElement(text.slice(0, mid), {
      continuation,
      override,
      blankLinesBefore,
      settings,
      isFinal: false
    });
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

function getEditableParagraphRecords() {
  return paragraphRecords.filter((record) => record.type !== 'heading');
}

function getEditableParagraphIndex(paragraphId) {
  return getEditableParagraphRecords().findIndex((record) => record.id === paragraphId);
}

function getBodyHeadingSettings(level, settings = DEFAULT_SETTINGS) {
  const safeLevel = Math.min(3, Math.max(1, Number(level) || 1));
  const source = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  return {
    level: safeLevel,
    fontFamily: source[`heading${safeLevel}FontFamily`] || source.fontFamily,
    size: sanitizeNumber(source[`heading${safeLevel}Size`], safeLevel === 1 ? 16 : safeLevel === 2 ? 13 : 11),
    align: ['left', 'center', 'right'].includes(source[`heading${safeLevel}Align`])
      ? source[`heading${safeLevel}Align`]
      : 'left',
    spaceBefore: Math.max(0, sanitizeNumber(source[`heading${safeLevel}SpaceBefore`], 0)),
    spaceAfter: Math.max(0, sanitizeNumber(source[`heading${safeLevel}SpaceAfter`], 0)),
    pageBreakBefore: Boolean(source[`heading${safeLevel}PageBreakBefore`]),
    keepWithNext: Boolean(source[`heading${safeLevel}KeepWithNext`])
  };
}

function createBodyHeadingElement(record, settings = DEFAULT_SETTINGS, options = {}) {
  const headingSettings = getBodyHeadingSettings(record.level, settings);
  const tagName = headingSettings.level === 1 ? 'h2' : headingSettings.level === 2 ? 'h3' : 'h4';
  const heading = document.createElement(tagName);
  heading.className = `body-heading heading-level-${headingSettings.level}`;
  heading.textContent = record.text;
  heading.dataset.headingLevel = String(headingSettings.level);
  if (record.id) heading.dataset.blockId = record.id;
  heading.style.fontFamily = headingSettings.fontFamily;
  heading.style.fontSize = `${headingSettings.size}pt`;
  heading.style.lineHeight = headingSettings.level === 1 ? '1.45' : '1.5';
  heading.style.textAlign = headingSettings.align;

  const effectiveSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const blankCount = effectiveSettings.preserveBlankLines
    ? sanitizeBlankLineCount(options.blankLinesBefore ?? record.blankLinesBefore)
    : 0;
  const blankSpace = blankCount
    * sanitizeNumber(effectiveSettings.lineHeight, 15)
    * Math.max(0, sanitizeNumber(effectiveSettings.blankLineScale, 1));
  const beforeParts = [];
  if (blankSpace > 0) beforeParts.push(`${blankSpace}pt`);
  if (headingSettings.spaceBefore > 0) beforeParts.push(`${headingSettings.spaceBefore}mm`);
  if (beforeParts.length === 1) heading.style.paddingTop = beforeParts[0];
  if (beforeParts.length > 1) heading.style.paddingTop = `calc(${beforeParts.join(' + ')})`;
  if (headingSettings.spaceAfter > 0) heading.style.paddingBottom = `${headingSettings.spaceAfter}mm`;

  return heading;
}

function createKeepWithNextProbe(record, state) {
  if (record.type === 'heading') {
    return createBodyHeadingElement(record, state.settings, {
      blankLinesBefore: state.settings.preserveBlankLines
        ? sanitizeBlankLineCount(record.blankLinesBefore)
        : 0
    });
  }

  const override = normalizeParagraphOverride(state.paragraphOverrides?.[record.id]);
  const excerpt = String(record.text || '').replace(/\n+/g, ' ').slice(0, 12) || '　';
  return createParagraphElement(excerpt, {
    override,
    blankLinesBefore: state.settings.preserveBlankLines
      ? sanitizeBlankLineCount(record.blankLinesBefore)
      : 0,
    settings: state.settings,
    isFinal: false
  });
}

function createParagraphElement(text, options = {}) {
  const {
    continuation = false,
    override = {},
    blankLinesBefore = 0,
    settings = DEFAULT_SETTINGS,
    isFinal = true,
    paragraphId = null,
    paragraphIndex = null,
    selectable = false
  } = options;

  const paragraph = document.createElement('p');
  paragraph.className = 'body-paragraph';
  paragraph.textContent = text;
  if (continuation) paragraph.style.textIndent = '0';
  applyParagraphOverrideStyles(
    paragraph,
    override,
    continuation,
    isFinal,
    blankLinesBefore,
    settings
  );

  if (paragraphId) {
    paragraph.dataset.paragraphId = paragraphId;
    paragraph.dataset.paragraphIndex = String(paragraphIndex ?? 0);
    paragraph.dataset.blankLinesBefore = String(sanitizeBlankLineCount(blankLinesBefore));
    if (selectable) paragraph.tabIndex = 0;
    if (hasMeaningfulOverride(override)) paragraph.classList.add('has-override');
  }

  return paragraph;
}

function applyParagraphOverrideStyles(
  paragraph,
  override,
  continuation,
  isFinal,
  blankLinesBefore,
  settings
) {
  const normalized = normalizeParagraphOverride(override);
  const effectiveSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  if (Number.isFinite(normalized.fontSize)) paragraph.style.fontSize = `${normalized.fontSize}pt`;
  if (Number.isFinite(normalized.lineHeight)) paragraph.style.lineHeight = `${normalized.lineHeight}pt`;
  if (Number.isFinite(normalized.letterSpacing)) paragraph.style.letterSpacing = `${normalized.letterSpacing}em`;
  if (normalized.textAlign && normalized.textAlign !== 'inherit') paragraph.style.textAlign = normalized.textAlign;
  if (!continuation && Number.isFinite(normalized.textIndent)) paragraph.style.textIndent = `${normalized.textIndent}em`;

  if (!continuation) {
    const beforeParts = [];
    const blankCount = effectiveSettings.preserveBlankLines
      ? sanitizeBlankLineCount(blankLinesBefore)
      : 0;
    const effectiveLineHeight = Number.isFinite(normalized.lineHeight)
      ? normalized.lineHeight
      : sanitizeNumber(effectiveSettings.lineHeight, 15);
    const scale = Math.max(0, sanitizeNumber(effectiveSettings.blankLineScale, 1));
    const blankSpace = blankCount * effectiveLineHeight * scale;
    if (blankSpace > 0) beforeParts.push(`${blankSpace}pt`);
    if (Number.isFinite(normalized.spaceBefore) && normalized.spaceBefore > 0) {
      beforeParts.push(`${normalized.spaceBefore}mm`);
    }
    if (beforeParts.length === 1) paragraph.style.paddingTop = beforeParts[0];
    if (beforeParts.length > 1) paragraph.style.paddingTop = `calc(${beforeParts.join(' + ')})`;
  }

  if (isFinal && Number.isFinite(normalized.spaceAfter) && normalized.spaceAfter > 0) {
    paragraph.style.paddingBottom = `${normalized.spaceAfter}mm`;
  }
}

function createBlankSpaceElement(lines, settings = DEFAULT_SETTINGS) {
  const spacer = document.createElement('div');
  spacer.className = 'blank-space';
  const effectiveSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const count = sanitizeBlankLineCount(lines);
  const lineHeight = sanitizeNumber(effectiveSettings.lineHeight, 15);
  const scale = Math.max(0, sanitizeNumber(effectiveSettings.blankLineScale, 1));
  spacer.style.height = `${count * lineHeight * scale}pt`;
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

function normalizeBodyText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\u200B/g, '');
}

function parseBodyStructure(text) {
  const normalized = normalizeBodyText(text);
  if (!normalized) return { paragraphs: [], trailingBlankLines: 0 };

  const lines = normalized.split('\n');
  const records = [];
  let currentLines = [];
  let pendingBlankLines = 0;
  let currentBlankLinesBefore = 0;

  const flushParagraph = () => {
    if (!currentLines.length) return;
    records.push({
      type: 'paragraph',
      level: null,
      text: currentLines.join('\n'),
      blankLinesBefore: sanitizeBlankLineCount(currentBlankLinesBefore)
    });
    currentLines = [];
    currentBlankLinesBefore = 0;
  };

  lines.forEach((line) => {
    const isBlank = /^[\t \u3000]*$/.test(line);
    if (isBlank) {
      if (currentLines.length) flushParagraph();
      pendingBlankLines += 1;
      return;
    }

    const headingMatch = line.match(/^\s*(#{1,3})[\t \u3000]+(.+?)\s*$/);
    if (headingMatch) {
      flushParagraph();
      records.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
        blankLinesBefore: sanitizeBlankLineCount(pendingBlankLines)
      });
      pendingBlankLines = 0;
      return;
    }

    if (!currentLines.length) {
      currentBlankLinesBefore = pendingBlankLines;
      pendingBlankLines = 0;
    }
    currentLines.push(line);
  });

  flushParagraph();
  return {
    paragraphs: records,
    trailingBlankLines: sanitizeBlankLineCount(pendingBlankLines)
  };
}

function normalizeParagraphs(text) {
  return parseBodyStructure(text).paragraphs
    .filter((record) => record.type === 'paragraph')
    .map((record) => record.text);
}

function createParagraphRecords(text) {
  return parseBodyStructure(text).paragraphs.map((record) => ({
    id: createId(record.type === 'heading' ? 'heading' : 'paragraph'),
    type: record.type,
    level: record.type === 'heading' ? record.level : null,
    text: record.text,
    blankLinesBefore: record.blankLinesBefore
  }));
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
      } else if (fragment.type === 'body-heading') {
        content.appendChild(createBodyHeadingElement(fragment.record, settings, {
          blankLinesBefore: fragment.blankLinesBefore
        }));
      } else if (fragment.type === 'paragraph') {
        content.appendChild(createParagraphElement(fragment.text, {
          continuation: fragment.continuation,
          override: fragment.override,
          blankLinesBefore: fragment.blankLinesBefore,
          settings,
          isFinal: fragment.isFinal,
          paragraphId: fragment.paragraphId,
          paragraphIndex: fragment.paragraphIndex,
          selectable: true
        }));
      } else if (fragment.type === 'blank-space') {
        content.appendChild(createBlankSpaceElement(fragment.lines, settings));
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
  const bodyIndent = settings.useTextIndent ? sanitizeNumber(settings.textIndent, 1) : 0;
  root.style.setProperty('--body-indent', `${bodyIndent}em`);
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
  syncParagraphRecordsFromBody();
  const now = new Date().toISOString();
  return {
    projectName: els.projectName.value.trim() || '名称未設定',
    manuscript: {
      title: els.titleInput.value,
      subtitle: els.subtitleInput.value,
      author: els.authorInput.value,
      body: els.bodyInput.value,
      paragraphs: deepClone(paragraphRecords),
      trailingBlankLines
    },
    paragraphOverrides: deepClone(paragraphOverrides),
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
    useTextIndent: els.useTextIndent.checked,
    textIndent: sanitizeNumber(els.textIndent.value, 1),
    textAlign: els.textAlign.value,
    preserveBlankLines: els.preserveBlankLines.checked,
    blankLineScale: sanitizeNumber(els.blankLineScale.value, 1),
    titleSize: sanitizeNumber(els.titleSize.value, 20),
    titleBottom: sanitizeNumber(els.titleBottom.value, 14),
    titleAlign: els.titleAlign.value,
    showDocumentHeading: els.showDocumentHeading.checked,
    bodyStartOnNewPage: els.bodyStartOnNewPage.checked,
    heading1FontFamily: els.heading1FontFamily.value,
    heading1Size: sanitizeNumber(els.heading1Size.value, 16),
    heading1Align: els.heading1Align.value,
    heading1SpaceBefore: sanitizeNumber(els.heading1SpaceBefore.value, 10),
    heading1SpaceAfter: sanitizeNumber(els.heading1SpaceAfter.value, 5),
    heading1PageBreakBefore: els.heading1PageBreakBefore.checked,
    heading1KeepWithNext: els.heading1KeepWithNext.checked,
    heading2FontFamily: els.heading2FontFamily.value,
    heading2Size: sanitizeNumber(els.heading2Size.value, 13),
    heading2Align: els.heading2Align.value,
    heading2SpaceBefore: sanitizeNumber(els.heading2SpaceBefore.value, 7),
    heading2SpaceAfter: sanitizeNumber(els.heading2SpaceAfter.value, 3),
    heading2PageBreakBefore: els.heading2PageBreakBefore.checked,
    heading2KeepWithNext: els.heading2KeepWithNext.checked,
    heading3FontFamily: els.heading3FontFamily.value,
    heading3Size: sanitizeNumber(els.heading3Size.value, 11),
    heading3Align: els.heading3Align.value,
    heading3SpaceBefore: sanitizeNumber(els.heading3SpaceBefore.value, 5),
    heading3SpaceAfter: sanitizeNumber(els.heading3SpaceAfter.value, 2),
    heading3PageBreakBefore: els.heading3PageBreakBefore.checked,
    heading3KeepWithNext: els.heading3KeepWithNext.checked,
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
    paragraphRecords = deepClone(normalized.manuscript.paragraphs);
    trailingBlankLines = sanitizeBlankLineCount(normalized.manuscript.trailingBlankLines);
    paragraphOverrides = deepClone(normalized.paragraphOverrides);
    selectedParagraphId = null;
    applySettingsToInputs(normalized.settings);
    updateCharCount();
    updateParagraphControls();
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
  els.useTextIndent.checked = Boolean(normalized.useTextIndent);
  els.textIndent.value = normalized.textIndent;
  updateTextIndentControls();
  els.textAlign.value = normalized.textAlign;
  els.preserveBlankLines.checked = Boolean(normalized.preserveBlankLines);
  els.blankLineScale.value = normalized.blankLineScale;
  updateBlankLineControls();
  els.titleSize.value = normalized.titleSize;
  els.titleBottom.value = normalized.titleBottom;
  els.titleAlign.value = normalized.titleAlign;
  els.showDocumentHeading.checked = Boolean(normalized.showDocumentHeading);
  els.bodyStartOnNewPage.checked = Boolean(normalized.bodyStartOnNewPage);
  [1, 2, 3].forEach((level) => {
    els[`heading${level}FontFamily`].value = normalized[`heading${level}FontFamily`];
    els[`heading${level}Size`].value = normalized[`heading${level}Size`];
    els[`heading${level}Align`].value = normalized[`heading${level}Align`];
    els[`heading${level}SpaceBefore`].value = normalized[`heading${level}SpaceBefore`];
    els[`heading${level}SpaceAfter`].value = normalized[`heading${level}SpaceAfter`];
    els[`heading${level}PageBreakBefore`].checked = Boolean(normalized[`heading${level}PageBreakBefore`]);
    els[`heading${level}KeepWithNext`].checked = Boolean(normalized[`heading${level}KeepWithNext`]);
  });
  els.showPageNumbers.checked = Boolean(normalized.showPageNumbers);
  els.firstPageNumber.checked = Boolean(normalized.firstPageNumber);
  els.viewMode.value = normalized.viewMode;
  els.zoomSelect.value = String(normalized.zoom);
  els.toggleGuidesBtn.setAttribute('aria-pressed', String(Boolean(normalized.showGuides)));
  setPaperInputsReadOnly(normalized.paperPreset !== 'custom');
}

function normalizeState(raw) {
  const base = deepClone(DEFAULT_STATE);
  const source = raw && typeof raw === 'object' ? raw : {};
  const manuscriptSource = source.manuscript && typeof source.manuscript === 'object'
    ? source.manuscript
    : {};
  const manuscript = { ...base.manuscript, ...manuscriptSource };
  manuscript.title = String(manuscript.title || '');
  manuscript.subtitle = String(manuscript.subtitle || '');
  manuscript.author = String(manuscript.author || '');
  manuscript.body = String(manuscript.body || '');

  const oldRecords = Array.isArray(manuscriptSource.paragraphs)
    ? manuscriptSource.paragraphs
        .filter((record) => record && typeof record.id === 'string')
        .map((record) => ({
          id: record.id,
          type: record.type === 'heading' ? 'heading' : 'paragraph',
          level: record.type === 'heading' ? Math.min(3, Math.max(1, Number(record.level) || 1)) : null,
          text: String(record.text || ''),
          blankLinesBefore: sanitizeBlankLineCount(record.blankLinesBefore)
        }))
    : [];
  const parsedBody = parseBodyStructure(manuscript.body);
  manuscript.paragraphs = reconcileParagraphRecords(oldRecords, manuscript.body);
  manuscript.trailingBlankLines = parsedBody.trailingBlankLines;
  const validIds = new Set(
    manuscript.paragraphs.filter((record) => record.type !== 'heading').map((record) => record.id)
  );

  const normalizedSettings = { ...base.settings, ...(source.settings || {}) };
  if (!source.settings || source.settings.useTextIndent === undefined) {
    normalizedSettings.useTextIndent = sanitizeNumber(normalizedSettings.textIndent, 1) > 0;
  }

  return {
    projectName: typeof source.projectName === 'string' ? source.projectName : base.projectName,
    manuscript,
    paragraphOverrides: normalizeParagraphOverrides(source.paragraphOverrides, validIds),
    settings: normalizedSettings,
    metadata: {
      ...base.metadata,
      ...(source.metadata || {}),
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION
    }
  };
}

function reconcileParagraphRecords(oldRecords, body) {
  const parsed = parseBodyStructure(body);
  const incoming = parsed.paragraphs;
  const old = Array.isArray(oldRecords)
    ? oldRecords.filter((record) => record && typeof record.id === 'string')
    : [];

  const signature = (record) => `${record.type || 'paragraph'}:${record.level || 0}:${String(record.text || '')}`;

  if (incoming.length === old.length) {
    return incoming.map((record, index) => ({
      id: old[index]?.id || createId(record.type === 'heading' ? 'heading' : 'paragraph'),
      type: record.type,
      level: record.type === 'heading' ? record.level : null,
      text: record.text,
      blankLinesBefore: record.blankLinesBefore
    }));
  }

  if (!old.length) return createParagraphRecords(body);
  if (!incoming.length) return [];

  const oldSignatures = old.map(signature);
  const newSignatures = incoming.map(signature);
  const rows = oldSignatures.length + 1;
  const cols = newSignatures.length + 1;
  const dp = Array.from({ length: rows }, () => new Uint16Array(cols));

  for (let i = oldSignatures.length - 1; i >= 0; i -= 1) {
    for (let j = newSignatures.length - 1; j >= 0; j -= 1) {
      dp[i][j] = oldSignatures[i] === newSignatures[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const matches = [];
  let i = 0;
  let j = 0;
  while (i < oldSignatures.length && j < newSignatures.length) {
    if (oldSignatures[i] === newSignatures[j]) {
      matches.push([i, j]);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  const result = new Array(incoming.length);
  const anchors = [[-1, -1], ...matches, [old.length, incoming.length]];

  for (let anchorIndex = 0; anchorIndex < anchors.length - 1; anchorIndex += 1) {
    const [oldStart, newStart] = anchors[anchorIndex];
    const [oldEnd, newEnd] = anchors[anchorIndex + 1];
    const oldGap = old.slice(oldStart + 1, oldEnd);
    const newGapStart = newStart + 1;
    const newGapLength = newEnd - newGapStart;

    for (let offset = 0; offset < newGapLength; offset += 1) {
      const incomingRecord = incoming[newGapStart + offset];
      const candidate = oldGap[offset];
      result[newGapStart + offset] = {
        id: candidate?.id || createId(incomingRecord.type === 'heading' ? 'heading' : 'paragraph')
      };
    }

    if (oldEnd < old.length && newEnd < incoming.length) {
      result[newEnd] = { id: old[oldEnd].id };
    }
  }

  const usedIds = new Set();
  return incoming.map((record, index) => {
    let id = result[index]?.id || createId(record.type === 'heading' ? 'heading' : 'paragraph');
    if (usedIds.has(id)) id = createId(record.type === 'heading' ? 'heading' : 'paragraph');
    usedIds.add(id);
    return {
      id,
      type: record.type,
      level: record.type === 'heading' ? record.level : null,
      text: record.text,
      blankLinesBefore: record.blankLinesBefore
    };
  });
}

function syncParagraphRecordsFromBody() {
  const parsedBody = parseBodyStructure(els.bodyInput.value);
  paragraphRecords = reconcileParagraphRecords(paragraphRecords, els.bodyInput.value);
  trailingBlankLines = parsedBody.trailingBlankLines;
  const validIds = new Set(
    paragraphRecords.filter((record) => record.type !== 'heading').map((record) => record.id)
  );
  paragraphOverrides = normalizeParagraphOverrides(paragraphOverrides, validIds);
  if (selectedParagraphId && !validIds.has(selectedParagraphId)) selectedParagraphId = null;
}

function normalizeParagraphOverrides(raw, validIds = null) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const normalized = {};

  Object.entries(raw).forEach(([paragraphId, value]) => {
    if (validIds && !validIds.has(paragraphId)) return;
    const override = normalizeParagraphOverride(value);
    if (hasMeaningfulOverride(override)) normalized[paragraphId] = override;
  });

  return normalized;
}

function normalizeParagraphOverride(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const normalized = {};
  ['fontSize', 'lineHeight', 'letterSpacing', 'textIndent', 'spaceBefore', 'spaceAfter'].forEach((key) => {
    const value = Number(source[key]);
    if (source[key] !== '' && source[key] !== null && source[key] !== undefined && Number.isFinite(value)) {
      normalized[key] = value;
    }
  });

  if (['justify', 'left', 'center', 'right'].includes(source.textAlign)) {
    normalized.textAlign = source.textAlign;
  }
  if (source.pageBreakBefore === true) normalized.pageBreakBefore = true;
  if (source.keepWithNext === true) normalized.keepWithNext = true;
  return normalized;
}

function hasMeaningfulOverride(override) {
  return Boolean(override && typeof override === 'object' && Object.keys(override).length > 0);
}

function selectParagraph(paragraphId, shouldScroll = true) {
  const editable = getEditableParagraphRecords();
  const index = editable.findIndex((record) => record.id === paragraphId);
  if (index < 0) return;
  selectedParagraphId = paragraphId;
  updateParagraphControls();
  updateParagraphSelectionHighlight();

  if (shouldScroll) {
    const target = els.pages.querySelector(`.body-paragraph[data-paragraph-id="${CSS.escape(paragraphId)}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

function navigateSelectedParagraph(direction) {
  const editable = getEditableParagraphRecords();
  if (!editable.length) return;
  const currentIndex = editable.findIndex((record) => record.id === selectedParagraphId);
  const nextIndex = Math.min(
    editable.length - 1,
    Math.max(0, (currentIndex < 0 ? 0 : currentIndex) + direction)
  );
  selectParagraph(editable[nextIndex].id, true);
}

function updateParagraphControls() {
  const editable = getEditableParagraphRecords();
  const index = editable.findIndex((record) => record.id === selectedParagraphId);
  const hasSelection = index >= 0;
  els.paragraphSettingsFieldset.classList.toggle('empty', !hasSelection);
  els.paragraphEmptyState.hidden = hasSelection;
  els.paragraphControls.hidden = !hasSelection;

  if (!hasSelection) return;

  const record = editable[index];
  const override = normalizeParagraphOverride(paragraphOverrides[record.id]);
  isApplyingParagraphControls = true;
  try {
    const blankInfo = record.blankLinesBefore > 0 ? `・前に空行${record.blankLinesBefore}行` : '';
    els.selectedParagraphLabel.textContent = `第${index + 1}段落${blankInfo}${hasMeaningfulOverride(override) ? '・個別設定あり' : ''}`;
    els.selectedParagraphExcerpt.textContent = record.text;
    els.paragraphFontSize.value = Number.isFinite(override.fontSize) ? String(override.fontSize) : '';
    els.paragraphLineHeight.value = Number.isFinite(override.lineHeight) ? String(override.lineHeight) : '';
    els.paragraphLetterSpacing.value = Number.isFinite(override.letterSpacing) ? String(override.letterSpacing) : '';
    els.paragraphSpaceBefore.value = Number.isFinite(override.spaceBefore) ? String(override.spaceBefore) : '';
    els.paragraphSpaceAfter.value = Number.isFinite(override.spaceAfter) ? String(override.spaceAfter) : '';
    els.paragraphTextAlign.value = override.textAlign || 'inherit';
    els.paragraphTextIndent.value = Number.isFinite(override.textIndent) ? String(override.textIndent) : 'inherit';
    els.paragraphPageBreakBefore.checked = Boolean(override.pageBreakBefore);
    els.paragraphKeepWithNext.checked = Boolean(override.keepWithNext);
    els.previousParagraphBtn.disabled = index === 0;
    els.nextParagraphBtn.disabled = index === editable.length - 1;
    els.paragraphKeepWithNext.disabled = index === editable.length - 1;
  } finally {
    isApplyingParagraphControls = false;
  }
}

function updateSelectedParagraphOverride() {
  if (isApplyingParagraphControls || !selectedParagraphId) return;
  const override = {};
  setOptionalNumber(override, 'fontSize', els.paragraphFontSize.value);
  setOptionalNumber(override, 'lineHeight', els.paragraphLineHeight.value);
  setOptionalNumber(override, 'letterSpacing', els.paragraphLetterSpacing.value);
  setOptionalNumber(override, 'spaceBefore', els.paragraphSpaceBefore.value);
  setOptionalNumber(override, 'spaceAfter', els.paragraphSpaceAfter.value);
  if (els.paragraphTextAlign.value !== 'inherit') override.textAlign = els.paragraphTextAlign.value;
  if (els.paragraphTextIndent.value !== 'inherit') override.textIndent = Number(els.paragraphTextIndent.value);
  if (els.paragraphPageBreakBefore.checked) override.pageBreakBefore = true;
  if (els.paragraphKeepWithNext.checked) override.keepWithNext = true;

  if (hasMeaningfulOverride(override)) paragraphOverrides[selectedParagraphId] = override;
  else delete paragraphOverrides[selectedParagraphId];

  updateParagraphControls();
  markDirty();
  scheduleRender();
  scheduleAutosave();
}

function setOptionalNumber(target, key, rawValue) {
  if (String(rawValue).trim() === '') return;
  const number = Number(rawValue);
  if (Number.isFinite(number)) target[key] = number;
}

function resetSelectedParagraphOverride() {
  if (!selectedParagraphId) return;
  delete paragraphOverrides[selectedParagraphId];
  updateParagraphControls();
  markDirty();
  scheduleRender();
  scheduleAutosave();
  showToast('選択中の段落を本文全体の設定へ戻しました。');
}

function updateParagraphSelectionHighlight() {
  els.pages.querySelectorAll('.body-paragraph[data-paragraph-id]').forEach((paragraph) => {
    paragraph.classList.toggle('selected-paragraph', paragraph.dataset.paragraphId === selectedParagraphId);
  });
}

function createNewProject(requireConfirmation = true, saveExisting = true) {
  if (requireConfirmation && !window.confirm('新しいプロジェクトを作成しますか？現在の内容は自動保存されます。')) return;
  if (saveExisting) saveCurrentProject(false);

  const blank = normalizeState({
    projectName: '新規組版データ',
    manuscript: { title: '', subtitle: '', author: '', body: '', paragraphs: [] },
    paragraphOverrides: {},
    settings: deepClone(DEFAULT_SETTINGS),
    metadata: {}
  });
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
  const indentLabel = settings.useTextIndent ? `字下げ${settings.textIndent}字` : '字下げなし';
  return `${paper} ／ ${settings.fontSize}pt・行間${settings.lineHeight}pt・${indentLabel} ／ 余白 上${settings.marginTop} 下${settings.marginBottom} 左${settings.marginLeft} 右${settings.marginRight}mm`;
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

function sanitizeBlankLineCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
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
