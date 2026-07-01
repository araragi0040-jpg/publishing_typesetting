'use strict';

const APP_VERSION = 'v015';
const SCHEMA_VERSION = 15;
const AUTOSAVE_DELAY = 700;
const MAX_MEDIA_ASSETS = 20;
const MAX_MEDIA_DATA_CHARS = 3_200_000;
const MAX_MEDIA_SOURCE_BYTES = 12 * 1024 * 1024;
const MEDIA_MARKER_PATTERN = /^\s*\[\[figure:([a-zA-Z0-9_-]+)\]\]\s*$/;

const PROJECT_INDEX_KEY = 'typesetting-app-v015-project-index';
const PROJECT_PREFIX = 'typesetting-app-v015-project:';
const CURRENT_PROJECT_KEY = 'typesetting-app-v015-current-project';
const TEMPLATE_STORAGE_KEY = 'typesetting-app-v015-templates';

const LEGACY_V14_PROJECT_INDEX_KEY = 'typesetting-app-v014-project-index';
const LEGACY_V14_PROJECT_PREFIX = 'typesetting-app-v014-project:';
const LEGACY_V14_CURRENT_PROJECT_KEY = 'typesetting-app-v014-current-project';
const LEGACY_V14_TEMPLATE_STORAGE_KEY = 'typesetting-app-v014-templates';
const LEGACY_V1_STORAGE_KEY = 'typesetting-app-v001';
const MIGRATION_MARKER_KEY = 'typesetting-app-v015-migration-complete';

const DEFAULT_SETTINGS = Object.freeze({
  paperPreset: 'A5',
  pageWidth: 148,
  pageHeight: 210,
  marginTop: 15,
  marginBottom: 18,
  marginLeft: 18,
  marginRight: 15,
  writingMode: 'horizontal-tb',
  bindingDirection: 'left',
  verticalTextOrientation: 'mixed',
  autoTateChuYoko: true,
  fontFamily: "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif",
  fontSize: 9,
  lineHeight: 15,
  letterSpacing: 0.02,
  useTextIndent: true,
  textIndent: 1,
  textAlign: 'justify',
  preserveBlankLines: true,
  blankLineScale: 1,
  lineBreakMode: 'strict',
  hangingPunctuation: true,
  preventWidowOrphan: true,
  minFragmentLines: 2,
  keepWithNextLines: 2,
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
  showToc: false,
  tocTitle: '目次',
  tocIncludeH1: true,
  tocIncludeH2: true,
  tocIncludeH3: false,
  tocShowPageNumbers: true,
  tocLeader: true,
  tocTitleSize: 18,
  tocFontSize: 9,
  tocLineHeight: 15,
  showPageNumbers: true,
  pageNumberStart: 1,
  pageNumberPosition: 'bottom-center',
  firstPageNumber: false,
  showHeader: false,
  headerContent: 'chapter',
  headerCustomText: '',
  headerPosition: 'outer',
  headerFirstPage: false,
  showFooterText: false,
  footerContent: 'custom',
  footerCustomText: '',
  footerPosition: 'center',
  footerFirstPage: false,
  viewMode: 'single',
  zoom: 0.7,
  showGuides: true
});

const SAMPLE_MANUSCRIPT = Object.freeze({
  title: 'サンプルタイトル',
  subtitle: '画像・図表対応の確認用原稿',
  author: '著者名',
  body: `# 第1章　組版アプリv015

これは、組版アプリv015の動作確認用原稿です。用紙設定から「縦書き・右綴じ」へ切り替えると、同じ原稿を縦書きで確認できます。

文字を選択して、**太字**、《《傍点》》、｜組版《くみはん》、__下線__を設定できます。記号はプレビューやPDFには表示されません。

右側の設定を変更すると、用紙サイズ、余白、フォント、文字サイズ、文字間、行間が中央のプレビューへ自動反映されます。

## 全文編集と章別編集

既存のWord原稿などは「全文編集」にまとめて貼り付けられます。行頭に「# 」を付けた大見出しは章タイトルとして認識されます。

### 迷わない編集方法

「章別編集」へ切り替えると、第1章、第2章のように章ごとの一覧から選んで編集できます。どちらで変更しても、もう一方へ自動反映されます。

# 第2章　保存と出力

章の追加、複製、削除、並び替えにも対応しています。JSON出力はバックアップや別端末への移動に使用してください。

「目次を表示」をオンにすると、大見出し・中見出し・小見出しから目次を自動生成します。見出し名やページ位置を変更すると、目次も自動更新されます。

## 日本語組版の調整

行頭・行末の禁則処理、句読点のぶら下がり、ページをまたぐ段落の一行残りを抑える設定を追加しています。通常は「おすすめ設定」のままで使用できます。

右上の「PDF保存」を押すと、横書き・縦書きとも現在のページプレビューをそのままPDFとして直接保存できます。PCの印刷設定は使用しません。`
});

const DEFAULT_STATE = Object.freeze({
  projectName: '組版アプリ v015 サンプル',
  manuscript: { ...SAMPLE_MANUSCRIPT, paragraphs: [], chapters: [], media: [] },
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
    id: 'builtin-a5-vertical-literary',
    name: 'A5 縦書き・右綴じ',
    builtIn: true,
    settings: {
      ...extractTemplateSettings(DEFAULT_SETTINGS),
      writingMode: 'vertical-rl', bindingDirection: 'right',
      paperPreset: 'A5', pageWidth: 148, pageHeight: 210,
      marginTop: 15, marginBottom: 15, marginLeft: 20, marginRight: 14,
      fontSize: 9, lineHeight: 15.5, letterSpacing: 0.03,
      titleSize: 20, titleBottom: 14,
      heading1Align: 'left', heading2Align: 'left', heading3Align: 'left'
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
let manuscriptEditorMode = 'full';
let chapterModel = [];
let selectedChapterIndex = -1;
let isApplyingChapterEdit = false;
let manuscriptIssues = [];
let manuscriptCheckFilter = 'all';
let manuscriptCheckTimer = null;
let mediaAssets = [];
let mediaInsertTarget = 'bodyInput';
let selectedMediaId = null;
const MAX_MANUSCRIPT_ISSUES = 300;
const MANUSCRIPT_MODE_KEY = 'typesetting-app-v015-manuscript-mode';

window.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  bindEvents();
  loadInitialProject();
  restoreManuscriptEditorMode();
  refreshChapterModelFromBody({ preserveSelection: false });
  renderChapterManager();
  updateCharCount();
  applyViewSettings();
  updateBlankLineControls();
  updateTextIndentControls();
  restoreSettingsAccordions();
  updateRunningContentControls();
  updateTocControls();
  updateJapaneseTypesettingControls();
  updateDocumentLayoutControls();
  updateMediaUi();
  scheduleManuscriptCheck(0);
  scheduleRender();
  refreshCurrentProjectStatus();
}

function cacheElements() {
  const ids = [
    'projectName', 'newBtn', 'projectsBtn', 'saveBtn', 'duplicateBtn', 'templatesBtn',
    'exportBtn', 'importBtn', 'printBtn', 'importFile', 'titleInput', 'subtitleInput',
    'authorInput', 'bodyInput', 'charCount', 'pages', 'pageCount', 'saveStatus',
    'currentProjectStatus', 'documentLayout', 'layoutStatus', 'verticalOptions', 'verticalTextOrientation',
    'autoTateChuYoko', 'paperPreset', 'pageWidth', 'pageHeight', 'marginTop',
    'marginBottom', 'marginLeft', 'marginRight', 'fontFamily', 'fontSize', 'lineHeight',
    'letterSpacing', 'useTextIndent', 'textIndent', 'textAlign', 'preserveBlankLines', 'blankLineScale',
    'lineBreakMode', 'hangingPunctuation', 'preventWidowOrphan', 'minFragmentLines',
    'keepWithNextLines', 'resetJapaneseTypesettingBtn', 'japaneseTypesettingSummary',
    'titleSize', 'titleBottom', 'titleAlign', 'showDocumentHeading', 'bodyStartOnNewPage',
    'showPageNumbers', 'pageNumberStart', 'pageNumberPosition', 'firstPageNumber',
    'showHeader', 'headerContent', 'headerCustomText', 'headerPosition', 'headerFirstPage',
    'showFooterText', 'footerContent', 'footerCustomText', 'footerPosition', 'footerFirstPage',
    'settingsExpandAllBtn', 'settingsCollapseAllBtn', 'viewMode', 'zoomSelect', 'toggleGuidesBtn',
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
    'heading3SpaceAfter', 'heading3PageBreakBefore', 'heading3KeepWithNext',
    'showToc', 'tocTitle', 'tocIncludeH1', 'tocIncludeH2', 'tocIncludeH3',
    'tocShowPageNumbers', 'tocLeader', 'tocTitleSize', 'tocFontSize', 'tocLineHeight',
    'tocDetectedSummary',
    'manuscriptModeFull', 'manuscriptModeChapters', 'fullEditorView', 'chapterEditorView',
    'editorModeGuidance', 'insertHeading1Btn', 'insertHeading2Btn', 'insertHeading3Btn',
    'chapterSummary', 'chapterList', 'addChapterBtn', 'addFirstChapterBtn', 'chapterEditCard',
    'selectedChapterLabel', 'selectedChapterMeta', 'chapterEmptyState', 'chapterControls',
    'chapterTitleInput', 'chapterBodyInput', 'chapterMoveUpBtn', 'chapterMoveDownBtn',
    'duplicateChapterBtn', 'deleteChapterBtn',
    'manuscriptCheckBtn', 'manuscriptCheckBadge', 'manuscriptCheckModal',
    'manuscriptCheckTotal', 'manuscriptCheckWarnings', 'manuscriptCheckFixable',
    'rerunManuscriptCheckBtn', 'fixSafeManuscriptIssuesBtn', 'manuscriptCheckList',
    'manuscriptCheckEmpty', 'manuscriptCheckFooterNote',
    'pdfExportOverlay', 'pdfExportStatus', 'pdfExportProgress',
    'mediaManagerBtn', 'mediaCountBadge', 'mediaModal', 'mediaFileInput',
    'mediaStorageSummary', 'mediaStorageProgress', 'mediaTargetNote',
    'mediaLibraryList', 'mediaEmptyState'
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  const renderInputs = [
    els.projectName, els.titleInput, els.subtitleInput, els.authorInput,
    els.documentLayout, els.verticalTextOrientation, els.autoTateChuYoko,
    els.pageWidth, els.pageHeight, els.marginTop, els.marginBottom, els.marginLeft,
    els.marginRight, els.fontFamily, els.fontSize, els.lineHeight, els.letterSpacing,
    els.useTextIndent, els.textIndent, els.textAlign, els.preserveBlankLines, els.blankLineScale,
    els.lineBreakMode, els.hangingPunctuation, els.preventWidowOrphan, els.minFragmentLines,
    els.keepWithNextLines,
    els.titleSize, els.titleBottom, els.titleAlign, els.showDocumentHeading, els.bodyStartOnNewPage,
    els.heading1FontFamily, els.heading1Size, els.heading1Align, els.heading1SpaceBefore,
    els.heading1SpaceAfter, els.heading1PageBreakBefore, els.heading1KeepWithNext,
    els.heading2FontFamily, els.heading2Size, els.heading2Align, els.heading2SpaceBefore,
    els.heading2SpaceAfter, els.heading2PageBreakBefore, els.heading2KeepWithNext,
    els.heading3FontFamily, els.heading3Size, els.heading3Align, els.heading3SpaceBefore,
    els.heading3SpaceAfter, els.heading3PageBreakBefore, els.heading3KeepWithNext,
    els.showToc, els.tocTitle, els.tocIncludeH1, els.tocIncludeH2, els.tocIncludeH3,
    els.tocShowPageNumbers, els.tocLeader, els.tocTitleSize, els.tocFontSize, els.tocLineHeight,
    els.showPageNumbers, els.pageNumberStart, els.pageNumberPosition, els.firstPageNumber,
    els.showHeader, els.headerContent, els.headerCustomText, els.headerPosition, els.headerFirstPage,
    els.showFooterText, els.footerContent, els.footerCustomText, els.footerPosition, els.footerFirstPage
  ];

  renderInputs.forEach((element) => {
    const eventName = element.matches('select, input[type="checkbox"]') ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      if (isApplyingState) return;
      markDirty();
      scheduleRender();
      scheduleAutosave();
      if ([els.titleInput, els.subtitleInput, els.authorInput].includes(element)) {
        scheduleManuscriptCheck();
      }
    });
  });

  els.bodyInput.addEventListener('input', () => {
    if (isApplyingState) return;
    syncParagraphRecordsFromBody();
    refreshChapterModelFromBody({ preserveSelection: true });
    if (manuscriptEditorMode === 'chapters') renderChapterManager();
    updateCharCount();
    updateParagraphControls();
    markDirty();
    scheduleRender();
    scheduleAutosave();
    scheduleManuscriptCheck();
  });

  els.manuscriptModeFull.addEventListener('click', () => setManuscriptEditorMode('full'));
  els.manuscriptModeChapters.addEventListener('click', () => setManuscriptEditorMode('chapters'));
  els.insertHeading1Btn.addEventListener('click', () => applyHeadingToCurrentLines(1));
  els.insertHeading2Btn.addEventListener('click', () => applyHeadingToCurrentLines(2));
  els.insertHeading3Btn.addEventListener('click', () => applyHeadingToCurrentLines(3));
  document.querySelectorAll('[data-inline-format]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolbar = button.closest('[data-format-target]');
      applyInlineFormatting(button.dataset.inlineFormat, toolbar?.dataset.formatTarget);
    });
  });
  [els.bodyInput, els.chapterBodyInput].forEach((textarea) => {
    textarea.addEventListener('keydown', handleInlineFormattingShortcut);
  });
  document.querySelectorAll('[data-media-target]').forEach((button) => {
    button.addEventListener('click', () => openMediaManager(button.dataset.mediaTarget || 'bodyInput'));
  });
  els.mediaManagerBtn.addEventListener('click', () => openMediaManager(manuscriptEditorMode === 'chapters' && selectedChapterIndex >= 0 ? 'chapterBodyInput' : 'bodyInput'));
  els.mediaFileInput.addEventListener('change', handleMediaFilesSelected);
  els.mediaLibraryList.addEventListener('input', handleMediaLibraryInput);
  els.mediaLibraryList.addEventListener('change', handleMediaLibraryInput);
  els.mediaLibraryList.addEventListener('click', handleMediaLibraryClick);
  els.chapterList.addEventListener('click', handleChapterListClick);
  els.addChapterBtn.addEventListener('click', addChapter);
  els.addFirstChapterBtn.addEventListener('click', addChapter);
  els.chapterTitleInput.addEventListener('input', handleChapterEditorInput);
  els.chapterBodyInput.addEventListener('input', handleChapterEditorInput);
  els.chapterMoveUpBtn.addEventListener('click', () => moveSelectedChapter(-1));
  els.chapterMoveDownBtn.addEventListener('click', () => moveSelectedChapter(1));
  els.duplicateChapterBtn.addEventListener('click', duplicateSelectedChapter);
  els.deleteChapterBtn.addEventListener('click', deleteSelectedChapter);

  els.paperPreset.addEventListener('change', handlePresetChange);
  els.documentLayout.addEventListener('change', updateDocumentLayoutControls);
  els.verticalTextOrientation.addEventListener('change', updateDocumentLayoutControls);
  els.autoTateChuYoko.addEventListener('change', updateDocumentLayoutControls);
  els.viewMode.addEventListener('change', handleViewSettingChange);
  els.zoomSelect.addEventListener('change', handleViewSettingChange);
  els.preserveBlankLines.addEventListener('change', updateBlankLineControls);
  els.useTextIndent.addEventListener('change', updateTextIndentControls);
  els.headerContent.addEventListener('change', updateRunningContentControls);
  els.footerContent.addEventListener('change', updateRunningContentControls);
  els.showHeader.addEventListener('change', updateRunningContentControls);
  els.showFooterText.addEventListener('change', updateRunningContentControls);
  els.showToc.addEventListener('change', updateTocControls);
  els.tocShowPageNumbers.addEventListener('change', updateTocControls);
  els.preventWidowOrphan.addEventListener('change', updateJapaneseTypesettingControls);
  els.lineBreakMode.addEventListener('change', updateJapaneseTypesettingControls);
  els.hangingPunctuation.addEventListener('change', updateJapaneseTypesettingControls);
  els.minFragmentLines.addEventListener('change', updateJapaneseTypesettingControls);
  els.keepWithNextLines.addEventListener('change', updateJapaneseTypesettingControls);
  els.resetJapaneseTypesettingBtn.addEventListener('click', applyRecommendedJapaneseTypesetting);
  els.settingsExpandAllBtn.addEventListener('click', () => setAllSettingsAccordions(true));
  els.settingsCollapseAllBtn.addEventListener('click', () => setAllSettingsAccordions(false));
  document.querySelectorAll('.settings-accordion').forEach((details) => {
    details.addEventListener('toggle', saveSettingsAccordionState);
  });

  els.toggleGuidesBtn.addEventListener('click', () => {
    const pressed = els.toggleGuidesBtn.getAttribute('aria-pressed') === 'true';
    els.toggleGuidesBtn.setAttribute('aria-pressed', String(!pressed));
    applyGuides();
    markDirty();
    scheduleAutosave();
  });

  els.pages.addEventListener('click', (event) => {
    const figure = event.target.closest('.figure-block[data-media-id]');
    if (figure) {
      selectedMediaId = figure.dataset.mediaId || null;
      openMediaManager(manuscriptEditorMode === 'chapters' && selectedChapterIndex >= 0 ? 'chapterBodyInput' : 'bodyInput', selectedMediaId);
      return;
    }
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
  els.printBtn.addEventListener('click', exportPdf);
  els.manuscriptCheckBtn.addEventListener('click', openManuscriptCheckModal);
  els.rerunManuscriptCheckBtn.addEventListener('click', () => runManuscriptCheck({ announce: true }));
  els.fixSafeManuscriptIssuesBtn.addEventListener('click', fixSafeManuscriptIssues);
  els.manuscriptCheckList.addEventListener('click', handleManuscriptCheckAction);
  document.querySelectorAll('[data-check-filter]').forEach((button) => {
    button.addEventListener('click', () => setManuscriptCheckFilter(button.dataset.checkFilter));
  });
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
    showToast('v001の保存データをv015へ移行しました。');
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

  const legacyIndex = readJsonFromStorage(LEGACY_V14_PROJECT_INDEX_KEY, []);
  let migratedCount = 0;
  let mappedCurrentId = null;
  const legacyCurrentId = safeStorageGet(LEGACY_V14_CURRENT_PROJECT_KEY);

  if (Array.isArray(legacyIndex)) {
    legacyIndex.forEach((item) => {
      if (!item?.id) return;
      const raw = readJsonFromStorage(`${LEGACY_V14_PROJECT_PREFIX}${item.id}`, null);
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

  const legacyTemplates = readJsonFromStorage(LEGACY_V14_TEMPLATE_STORAGE_KEY, []);
  if (Array.isArray(legacyTemplates) && legacyTemplates.length) {
    safeStorageSet(TEMPLATE_STORAGE_KEY, JSON.stringify(legacyTemplates));
  }

  if (mappedCurrentId) safeStorageSet(CURRENT_PROJECT_KEY, mappedCurrentId);
  safeStorageSet(MIGRATION_MARKER_KEY, 'true');

  if (migratedCount > 0) {
    showToast(`v014のプロジェクト${migratedCount}件をv015へ移行しました。`);
  }
}

function restoreManuscriptEditorMode() {
  const stored = safeStorageGet(MANUSCRIPT_MODE_KEY);
  setManuscriptEditorMode(stored === 'chapters' ? 'chapters' : 'full', {
    save: false,
    refresh: false,
    focus: false
  });
}

function setManuscriptEditorMode(mode, options = {}) {
  const nextMode = mode === 'chapters' ? 'chapters' : 'full';
  manuscriptEditorMode = nextMode;

  const chapterMode = nextMode === 'chapters';
  els.fullEditorView.hidden = chapterMode;
  els.chapterEditorView.hidden = !chapterMode;
  els.manuscriptModeFull.classList.toggle('active', !chapterMode);
  els.manuscriptModeChapters.classList.toggle('active', chapterMode);
  els.manuscriptModeFull.setAttribute('aria-selected', String(!chapterMode));
  els.manuscriptModeChapters.setAttribute('aria-selected', String(chapterMode));
  els.editorModeGuidance.innerHTML = chapterMode
    ? '<strong>おすすめ：</strong>章の追加・並び替え・個別編集をしたい場合はこちらが便利です。'
    : '<strong>おすすめ：</strong>Wordなどの原稿がある場合は、全文編集へそのまま貼り付けてください。';

  if (chapterMode && options.refresh !== false) {
    refreshChapterModelFromBody({ preserveSelection: true });
    renderChapterManager();
  }

  if (options.save !== false) safeStorageSet(MANUSCRIPT_MODE_KEY, nextMode);
  if (options.focus && chapterMode && chapterModel.length) els.chapterTitleInput.focus();
  if (options.focus && !chapterMode) els.bodyInput.focus();
}

function isBlankTextLine(line) {
  return /^[\t \u3000]*$/.test(String(line || ''));
}

function trimBoundaryBlankLines(lines) {
  const copy = [...lines];
  while (copy.length && isBlankTextLine(copy[0])) copy.shift();
  while (copy.length && isBlankTextLine(copy[copy.length - 1])) copy.pop();
  return copy;
}

function parseChaptersFromBody(text) {
  const normalized = normalizeBodyText(text);
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const chapters = [];
  let current = { type: 'preface', title: '', lines: [] };

  const pushCurrent = () => {
    const bodyLines = trimBoundaryBlankLines(current.lines);
    const body = bodyLines.join('\n');
    const shouldKeep = current.type === 'chapter' || body.length > 0;
    if (shouldKeep) {
      chapters.push({
        type: current.type,
        title: current.type === 'chapter' ? String(current.title || '') : '',
        body
      });
    }
  };

  lines.forEach((line) => {
    const match = line.match(/^[\t \u3000]*#[\t \u3000]+(.+?)[\t \u3000]*$/);
    if (match) {
      pushCurrent();
      current = { type: 'chapter', title: match[1], lines: [] };
      return;
    }
    current.lines.push(line);
  });

  pushCurrent();
  return chapters;
}

function serializeChapterModel() {
  return chapterModel.map((chapter) => ({
    type: chapter.type === 'preface' ? 'preface' : 'chapter',
    title: chapter.type === 'preface' ? '' : String(chapter.title || ''),
    body: String(chapter.body || '')
  }));
}

function buildBodyFromChapters(chapters) {
  return (Array.isArray(chapters) ? chapters : [])
    .map((chapter) => {
      const body = normalizeBodyText(chapter.body || '').replace(/^\n+|\n+$/g, '');
      if (chapter.type === 'preface') return body;
      const title = String(chapter.title || '').trim() || '無題の章';
      return body ? `# ${title}\n\n${body}` : `# ${title}`;
    })
    .filter((part) => part !== '')
    .join('\n\n');
}

function refreshChapterModelFromBody(options = {}) {
  const previous = chapterModel[selectedChapterIndex] || null;
  const previousIndex = selectedChapterIndex;
  const parsed = parseChaptersFromBody(els.bodyInput.value);
  chapterModel = parsed;

  if (!chapterModel.length) {
    selectedChapterIndex = -1;
    return;
  }

  if (options.preserveSelection !== false && previous) {
    const exactIndex = chapterModel.findIndex((item) => (
      item.type === previous.type
      && item.title === previous.title
      && item.body === previous.body
    ));
    if (exactIndex >= 0) {
      selectedChapterIndex = exactIndex;
      return;
    }
    selectedChapterIndex = Math.min(Math.max(previousIndex, 0), chapterModel.length - 1);
    return;
  }

  selectedChapterIndex = Math.min(Math.max(selectedChapterIndex, 0), chapterModel.length - 1);
}

function renderChapterManager() {
  renderChapterList();
  renderSelectedChapterEditor(true);
}

function renderChapterList() {
  els.chapterList.replaceChildren();
  const chapterCount = chapterModel.filter((item) => item.type === 'chapter').length;
  const hasPreface = chapterModel.some((item) => item.type === 'preface');
  els.chapterSummary.textContent = `${chapterCount}章${hasPreface ? '・冒頭あり' : ''}`;

  if (!chapterModel.length) {
    const empty = document.createElement('div');
    empty.className = 'chapter-list-empty';
    empty.textContent = '章はまだありません。全文編集で「# 章タイトル」を入力するか、章を追加してください。';
    els.chapterList.appendChild(empty);
    return;
  }

  let chapterNumber = 0;
  chapterModel.forEach((chapter, index) => {
    if (chapter.type === 'chapter') chapterNumber += 1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-list-item';
    button.dataset.chapterIndex = String(index);
    button.classList.toggle('active', index === selectedChapterIndex);

    const main = document.createElement('span');
    main.className = 'chapter-list-item-main';
    const number = document.createElement('span');
    number.className = 'chapter-number';
    number.textContent = chapter.type === 'preface' ? '前' : String(chapterNumber);

    const copy = document.createElement('span');
    copy.className = 'chapter-list-copy';
    const title = document.createElement('span');
    title.className = 'chapter-list-title';
    title.textContent = chapter.type === 'preface' ? '冒頭部分' : (inlineMarkupToPlainText(chapter.title) || '無題の章');
    if (chapter.type === 'preface') {
      const badge = document.createElement('span');
      badge.className = 'chapter-preface-badge';
      badge.textContent = '章タイトルなし';
      title.appendChild(badge);
    }
    const meta = document.createElement('span');
    meta.className = 'chapter-list-meta';
    const bodyLength = inlineMarkupToPlainText(chapter.body || '').length;
    const subheadingCount = extractChapterSubheadings(chapter.body).length;
    meta.textContent = `${bodyLength.toLocaleString('ja-JP')}文字${subheadingCount ? `・小見出し${subheadingCount}件` : ''}`;
    copy.append(title, meta);
    main.append(number, copy);
    button.appendChild(main);

    const subheadings = extractChapterSubheadings(chapter.body).slice(0, 3);
    if (subheadings.length) {
      const summary = document.createElement('div');
      summary.className = 'chapter-subheadings';
      summary.textContent = subheadings.map((item) => `${item.level === 2 ? '└' : '　└'} ${inlineMarkupToPlainText(item.text)}`).join('　');
      button.appendChild(summary);
    }

    els.chapterList.appendChild(button);
  });
}

function extractChapterSubheadings(body) {
  return normalizeBodyText(body || '')
    .split('\n')
    .map((line) => {
      const match = line.match(/^[\t \u3000]*(#{2,3})[\t \u3000]+(.+?)[\t \u3000]*$/);
      return match ? { level: match[1].length, text: match[2] } : null;
    })
    .filter(Boolean);
}

function renderSelectedChapterEditor(populateFields = true) {
  const item = chapterModel[selectedChapterIndex] || null;
  const hasItem = Boolean(item);
  els.chapterEmptyState.hidden = hasItem;
  els.chapterControls.hidden = !hasItem;

  if (!hasItem) {
    els.selectedChapterLabel.textContent = '章を選択してください';
    els.selectedChapterMeta.textContent = '';
    els.chapterMoveUpBtn.disabled = true;
    els.chapterMoveDownBtn.disabled = true;
    return;
  }

  const chapterItemsBefore = chapterModel.slice(0, selectedChapterIndex + 1)
    .filter((chapter) => chapter.type === 'chapter').length;
  const chapterCount = chapterModel.filter((chapter) => chapter.type === 'chapter').length;
  const isPreface = item.type === 'preface';
  els.selectedChapterLabel.textContent = isPreface
    ? '冒頭部分'
    : (inlineMarkupToPlainText(item.title) || `第${chapterItemsBefore}章（無題）`);
  els.selectedChapterMeta.textContent = isPreface
    ? `${inlineMarkupToPlainText(item.body || '').length.toLocaleString('ja-JP')}文字・章タイトルの前にある文章`
    : `${chapterItemsBefore}/${chapterCount}章・${inlineMarkupToPlainText(item.body || '').length.toLocaleString('ja-JP')}文字`;

  if (populateFields) {
    isApplyingChapterEdit = true;
    els.chapterTitleInput.value = isPreface ? '冒頭部分（章タイトルなし）' : item.title;
    els.chapterTitleInput.disabled = isPreface;
    els.chapterBodyInput.value = item.body;
    isApplyingChapterEdit = false;
  }

  const firstMovableIndex = chapterModel[0]?.type === 'preface' ? 1 : 0;
  els.chapterMoveUpBtn.disabled = isPreface || selectedChapterIndex <= firstMovableIndex;
  els.chapterMoveDownBtn.disabled = isPreface || selectedChapterIndex >= chapterModel.length - 1;
  els.duplicateChapterBtn.disabled = isPreface;
  els.deleteChapterBtn.textContent = isPreface ? '冒頭部分を削除' : '章を削除';
}


function handleInlineFormattingShortcut(event) {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  if (String(event.key || '').toLowerCase() !== 'b') return;
  event.preventDefault();
  applyInlineFormatting('bold', event.currentTarget?.id);
}

function applyInlineFormatting(action, targetId) {
  const textarea = document.getElementById(targetId || '');
  if (!(textarea instanceof HTMLTextAreaElement)) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start === end) {
    textarea.focus();
    showToast('先に装飾したい文字を選択してください。');
    return;
  }

  const value = textarea.value;
  const selected = value.slice(start, end);
  let result = null;

  if (action === 'ruby') {
    if (selected.includes('\n')) {
      showToast('ルビは改行を含まない文字を選択してください。');
      return;
    }
    const base = inlineMarkupToPlainText(selected).trim();
    if (!base) {
      showToast('ルビを付ける文字を選択してください。');
      return;
    }
    const reading = window.prompt(`「${base}」の読みを入力してください。`, '');
    if (reading === null) return;
    const normalizedReading = String(reading).trim().replace(/[《》\n\r]/g, '');
    if (!normalizedReading) {
      showToast('読みを入力してください。');
      return;
    }
    result = {
      value: `${value.slice(0, start)}｜${base}《${normalizedReading}》${value.slice(end)}`,
      selectionStart: start + 1,
      selectionEnd: start + 1 + base.length,
      message: 'ルビを設定しました。'
    };
  } else if (action === 'clear') {
    result = clearInlineFormatting(value, start, end);
  } else {
    const markers = {
      bold: ['**', '**'],
      emphasis: ['《《', '》》'],
      underline: ['__', '__']
    }[action];
    if (!markers) return;
    result = toggleInlineWrapper(value, start, end, markers[0], markers[1]);
  }

  if (!result) return;
  textarea.value = result.value;
  textarea.focus();
  textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  showToast(result.message || '文字装飾を更新しました。');
}

function toggleInlineWrapper(value, start, end, open, close) {
  const selected = value.slice(start, end);
  const hasInsideWrapper = selected.startsWith(open)
    && selected.endsWith(close)
    && selected.length >= open.length + close.length;
  if (hasInsideWrapper) {
    const inner = selected.slice(open.length, selected.length - close.length);
    return {
      value: `${value.slice(0, start)}${inner}${value.slice(end)}`,
      selectionStart: start,
      selectionEnd: start + inner.length,
      message: '選択範囲の装飾を解除しました。'
    };
  }

  const wrappedOutside = value.slice(Math.max(0, start - open.length), start) === open
    && value.slice(end, end + close.length) === close;
  if (wrappedOutside) {
    return {
      value: `${value.slice(0, start - open.length)}${selected}${value.slice(end + close.length)}`,
      selectionStart: start - open.length,
      selectionEnd: end - open.length,
      message: '選択範囲の装飾を解除しました。'
    };
  }

  return {
    value: `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`,
    selectionStart: start + open.length,
    selectionEnd: end + open.length,
    message: '選択範囲へ装飾を設定しました。'
  };
}

function clearInlineFormatting(value, start, end) {
  const selected = value.slice(start, end);
  const wrappers = [['**', '**'], ['__', '__'], ['《《', '》》']];
  for (const [open, close] of wrappers) {
    if (value.slice(Math.max(0, start - open.length), start) === open
      && value.slice(end, end + close.length) === close) {
      return {
        value: `${value.slice(0, start - open.length)}${selected}${value.slice(end + close.length)}`,
        selectionStart: start - open.length,
        selectionEnd: end - open.length,
        message: '選択範囲の装飾を解除しました。'
      };
    }
  }

  if (value.slice(start - 1, start) === '｜') {
    const rubyTail = value.slice(end).match(/^《[^《》\n]+》/u);
    if (rubyTail) {
      return {
        value: `${value.slice(0, start - 1)}${selected}${value.slice(end + rubyTail[0].length)}`,
        selectionStart: start - 1,
        selectionEnd: end - 1,
        message: 'ルビを解除しました。'
      };
    }
  }

  const plain = inlineMarkupToPlainText(selected);
  if (plain === selected) {
    return {
      value,
      selectionStart: start,
      selectionEnd: end,
      message: '選択範囲内に解除できる装飾がありません。'
    };
  }
  return {
    value: `${value.slice(0, start)}${plain}${value.slice(end)}`,
    selectionStart: start,
    selectionEnd: start + plain.length,
    message: '選択範囲の装飾を解除しました。'
  };
}

function handleChapterListClick(event) {
  const button = event.target.closest('[data-chapter-index]');
  if (!button) return;
  const index = Number(button.dataset.chapterIndex);
  if (!Number.isInteger(index) || !chapterModel[index]) return;
  selectedChapterIndex = index;
  renderChapterManager();
  els.chapterTitleInput.focus();
}

function normalizeChapterBodyHeadings(value) {
  return normalizeBodyText(value).replace(/^([\t \u3000]*)#[\t \u3000]+(.+)$/gm, '$1## $2');
}

function handleChapterEditorInput() {
  if (isApplyingChapterEdit || isApplyingState) return;
  const item = chapterModel[selectedChapterIndex];
  if (!item) return;

  if (item.type === 'chapter') item.title = els.chapterTitleInput.value;
  const normalizedBody = normalizeChapterBodyHeadings(els.chapterBodyInput.value);
  if (normalizedBody !== els.chapterBodyInput.value) {
    const selectionStart = els.chapterBodyInput.selectionStart;
    els.chapterBodyInput.value = normalizedBody;
    els.chapterBodyInput.setSelectionRange(selectionStart + 1, selectionStart + 1);
    showToast('章本文内の大見出し「#」を中見出し「##」へ変更しました。');
  }
  item.body = els.chapterBodyInput.value;

  syncBodyFromChapterModel();
  renderChapterList();
  renderSelectedChapterEditor(false);
}

function syncBodyFromChapterModel() {
  els.bodyInput.value = buildBodyFromChapters(chapterModel);
  syncParagraphRecordsFromBody();
  updateCharCount();
  updateParagraphControls();
  markDirty();
  scheduleRender();
  scheduleAutosave();
}

function addChapter() {
  refreshChapterModelFromBody({ preserveSelection: true });
  const chapterCount = chapterModel.filter((item) => item.type === 'chapter').length;
  const newChapter = {
    type: 'chapter',
    title: `第${chapterCount + 1}章　新しい章`,
    body: ''
  };
  let insertIndex = chapterModel.length;
  if (selectedChapterIndex >= 0) insertIndex = selectedChapterIndex + 1;
  chapterModel.splice(insertIndex, 0, newChapter);
  selectedChapterIndex = insertIndex;
  syncBodyFromChapterModel();
  setManuscriptEditorMode('chapters', { refresh: false, save: true });
  renderChapterManager();
  els.chapterTitleInput.focus();
  els.chapterTitleInput.select();
  showToast('新しい章を追加しました。');
}

function duplicateSelectedChapter() {
  const item = chapterModel[selectedChapterIndex];
  if (!item || item.type === 'preface') return;
  const copy = {
    type: 'chapter',
    title: `${item.title || '無題の章'}（コピー）`,
    body: item.body
  };
  chapterModel.splice(selectedChapterIndex + 1, 0, copy);
  selectedChapterIndex += 1;
  syncBodyFromChapterModel();
  renderChapterManager();
  showToast('選択中の章を複製しました。');
}

function deleteSelectedChapter() {
  const item = chapterModel[selectedChapterIndex];
  if (!item) return;
  const label = item.type === 'preface' ? '冒頭部分' : `「${item.title || '無題の章'}」`;
  if (!window.confirm(`${label}を削除しますか？\nこの操作は元に戻せません。`)) return;

  chapterModel.splice(selectedChapterIndex, 1);
  selectedChapterIndex = chapterModel.length
    ? Math.min(selectedChapterIndex, chapterModel.length - 1)
    : -1;
  syncBodyFromChapterModel();
  renderChapterManager();
  showToast(`${label}を削除しました。`);
}

function moveSelectedChapter(direction) {
  const item = chapterModel[selectedChapterIndex];
  if (!item || item.type === 'preface') return;
  const target = selectedChapterIndex + direction;
  const firstMovableIndex = chapterModel[0]?.type === 'preface' ? 1 : 0;
  if (target < firstMovableIndex || target >= chapterModel.length) return;

  [chapterModel[selectedChapterIndex], chapterModel[target]] = [chapterModel[target], chapterModel[selectedChapterIndex]];
  selectedChapterIndex = target;
  syncBodyFromChapterModel();
  renderChapterManager();
  showToast('章の順番を変更しました。');
}

function applyHeadingToCurrentLines(level) {
  const textarea = els.bodyInput;
  const prefix = `${'#'.repeat(Math.min(3, Math.max(1, level)))} `;
  const value = textarea.value;
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf('\n', selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selectedLines = value.slice(lineStart, lineEnd).split('\n');
  const replacement = selectedLines.map((line) => {
    if (!line.trim()) return prefix;
    return `${prefix}${line.replace(/^[\t \u3000]*#{1,3}[\t \u3000]*/, '')}`;
  }).join('\n');

  textarea.value = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
  textarea.focus();
  textarea.setSelectionRange(lineStart, lineStart + replacement.length);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  showToast(`${level === 1 ? '大' : level === 2 ? '中' : '小'}見出しに設定しました。`);
}


function scheduleManuscriptCheck(delay = 380) {
  clearTimeout(manuscriptCheckTimer);
  manuscriptCheckTimer = setTimeout(() => runManuscriptCheck({ announce: false }), Math.max(0, delay));
}

function openManuscriptCheckModal() {
  runManuscriptCheck({ announce: false });
  openModal('manuscriptCheckModal');
}

function runManuscriptCheck({ announce = false } = {}) {
  manuscriptIssues = analyzeManuscript();
  updateManuscriptCheckBadge();
  renderManuscriptCheckResults();
  if (announce) {
    showToast(manuscriptIssues.length
      ? `${manuscriptIssues.length}件の確認項目が見つかりました。`
      : '確認が必要な項目は見つかりませんでした。');
  }
  return manuscriptIssues;
}

function getManuscriptCheckFields() {
  return [
    { key: 'title', label: 'タイトル', element: els.titleInput, value: String(els.titleInput?.value || '') },
    { key: 'subtitle', label: 'サブタイトル', element: els.subtitleInput, value: String(els.subtitleInput?.value || '') },
    { key: 'author', label: '著者名', element: els.authorInput, value: String(els.authorInput?.value || '') },
    { key: 'body', label: '本文', element: els.bodyInput, value: String(els.bodyInput?.value || '') }
  ];
}

function analyzeManuscript() {
  const issues = [];
  let serial = 0;

  const addIssue = (field, data) => {
    if (issues.length >= MAX_MANUSCRIPT_ISSUES) return;
    const start = Math.max(0, Number(data.start) || 0);
    const end = Math.max(start, Number.isFinite(data.end) ? data.end : start);
    const original = typeof data.original === 'string'
      ? data.original
      : field.value.slice(start, end);
    issues.push({
      id: `check-${serial += 1}`,
      fieldKey: field.key,
      fieldLabel: field.label,
      start,
      end,
      original,
      replacement: typeof data.replacement === 'string' ? data.replacement : null,
      safe: Boolean(data.safe),
      severity: data.severity === 'info' ? 'info' : 'warning',
      category: data.category || '表記確認',
      title: data.title || '確認項目',
      message: data.message || '',
      line: field.key === 'body' ? lineNumberAt(field.value, start) : null,
      excerpt: createCheckExcerpt(field.value, start, end)
    });
  };

  getManuscriptCheckFields().forEach((field) => {
    const value = field.value;
    if (!value) return;

    scanRegex(value, /\t+/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '',
      safe: true,
      category: '不要文字',
      title: 'タブ文字があります',
      message: 'タブは環境によって幅が変わります。組版設定の字下げや余白を使用してください。'
    }));

    scanRegex(value, /[\u00A0\u2007\u202F]+/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: ' ',
      safe: true,
      category: '不要文字',
      title: '特殊な空白があります',
      message: 'コピー元に由来する特殊空白です。通常の半角スペースへ置き換えられます。'
    }));

    scanRegex(value, /[\u200B-\u200D\uFEFF]+/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '',
      safe: true,
      category: '不要文字',
      title: '見えない制御文字があります',
      message: '表示されない文字が混ざっています。削除しても見た目は変わりません。'
    }));

    scanRegex(value, /[ \u3000]+(?=\n|$)/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '',
      safe: true,
      category: '空白',
      title: '行末に空白があります',
      message: '行末の空白は誌面に不要なため削除できます。'
    }));

    scanRegex(value, /[Ａ-Ｚａ-ｚ０-９]+/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: toHalfWidthAlphaNumeric(match[0]),
      safe: false,
      severity: 'info',
      category: '全角・半角',
      title: '全角英数字があります',
      message: '英数字を半角へ統一する場合に修正してください。出版社の表記ルールによっては、そのままで問題ありません。'
    }));

    scanRegex(value, /…+/g, (match) => {
      if (match[0].length % 2 === 0) return;
      addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: `${match[0]}…`,
        safe: false,
        category: '約物',
        title: '三点リーダーが奇数個です',
        message: '出版物では「……」のように偶数個で使用することが一般的です。'
      });
    });

    scanRegex(value, /\.{3,}/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '……',
      safe: false,
      category: '約物',
      title: 'ピリオドで三点リーダーが入力されています',
      message: '日本語本文の三点リーダーへ統一する場合は「……」へ置き換えます。'
    }));

    scanRegex(value, /・{3,}/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '……',
      safe: false,
      category: '約物',
      title: '中黒が連続しています',
      message: '三点リーダーとして使用している場合は「……」へ置き換えます。'
    }));

    scanRegex(value, /―+/g, (match) => {
      if (match[0].length % 2 === 0) return;
      addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: `${match[0]}―`,
        safe: false,
        category: '約物',
        title: 'ダッシュが奇数本です',
        message: '出版物では「――」のように2本単位で使用することが一般的です。'
      });
    });

    scanRegex(value, /(?:--+|—+)/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: '――',
      safe: false,
      category: '約物',
      title: 'ダッシュの種類を確認してください',
      message: '日本語本文のダッシュへ統一する場合は「――」へ置き換えます。'
    }));

    scanRegex(value, /([。、])\1+/g, (match) => addIssue(field, {
      start: match.index,
      end: match.index + match[0].length,
      replacement: match[1],
      safe: false,
      category: '句読点',
      title: '同じ句読点が連続しています',
      message: '意図した表現でなければ、1文字へ修正してください。'
    }));

    if (field.key === 'body') {
      scanRegex(value, /^(#{1,3})(?!#)(\S)/gm, (match) => addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: `${match[1]} ${match[2]}`,
        safe: true,
        category: '見出し',
        title: '見出し記号の後に空白がありません',
        message: '見出しとして認識するため、#の後に半角スペースを追加します。'
      }));

      scanRegex(value, /^#{1,3}[ \u3000]*$/gm, (match) => addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: null,
        safe: false,
        category: '見出し',
        title: 'タイトルのない見出しがあります',
        message: '見出し名を入力するか、この行を削除してください。'
      }));

      scanRegex(value, /^[ \u3000]+(?=\S)/gm, (match) => addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: '',
        safe: false,
        category: '字下げ',
        title: '行頭に手入力の空白があります',
        message: '段落字下げは組版設定で制御できます。詩・引用など意図的な空白の場合はそのままにしてください。'
      }));

      scanRegex(value, / {2,}/g, (match) => {
        const before = value[match.index - 1] || '\n';
        const after = value[match.index + match[0].length] || '\n';
        if (before === '\n' || after === '\n') return;
        addIssue(field, {
          start: match.index,
          end: match.index + match[0].length,
          replacement: ' ',
          safe: false,
          category: '空白',
          title: '半角スペースが連続しています',
          message: '語間の空白であれば1文字へ統一できます。位置合わせに使用している場合は組版設定を使用してください。'
        });
      });

      scanRegex(value, /\n(?:[ \u3000]*\n){3,}/g, (match) => addIssue(field, {
        start: match.index,
        end: match.index + match[0].length,
        replacement: '\n\n',
        safe: false,
        severity: 'info',
        category: '改行',
        title: '空行が3行以上続いています',
        message: '意図した章間の空きでなければ、空行1行へ整理できます。'
      }));
    }

    scanUnmatchedBrackets(field, addIssue);
  });

  return issues;
}

function scanRegex(value, regex, callback) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(value)) !== null) {
    callback(match);
    if (!match[0].length) regex.lastIndex += 1;
  }
}

function scanUnmatchedBrackets(field, addIssue) {
  const pairs = [
    ['「', '」'], ['『', '』'], ['（', '）'], ['【', '】'], ['［', '］'], ['(', ')'], ['[', ']']
  ];
  pairs.forEach(([openChar, closeChar]) => {
    const stack = [];
    for (let index = 0; index < field.value.length; index += 1) {
      const char = field.value[index];
      if (char === openChar) {
        stack.push(index);
      } else if (char === closeChar) {
        if (stack.length) {
          stack.pop();
        } else {
          addIssue(field, {
            start: index,
            end: index + 1,
            replacement: null,
            safe: false,
            category: '括弧',
            title: `対応する「${openChar}」が見つかりません`,
            message: `閉じ括弧「${closeChar}」に対応する開き括弧を確認してください。`
          });
        }
      }
    }
    stack.forEach((index) => addIssue(field, {
      start: index,
      end: index + 1,
      replacement: null,
      safe: false,
      category: '括弧',
      title: `対応する「${closeChar}」が見つかりません`,
      message: `開き括弧「${openChar}」に対応する閉じ括弧を確認してください。`
    }));
  });
}

function lineNumberAt(value, index) {
  return value.slice(0, Math.max(0, index)).split('\n').length;
}

function createCheckExcerpt(value, start, end) {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextBreak = value.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const line = value.slice(lineStart, lineEnd).replace(/\t/g, '⇥');
  const compact = line.length > 72 ? `${line.slice(0, 69)}…` : line;
  return compact || '（空の行）';
}

function toHalfWidthAlphaNumeric(value) {
  return value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
}

function updateManuscriptCheckBadge() {
  if (!els.manuscriptCheckBadge || !els.manuscriptCheckBtn) return;
  const count = manuscriptIssues.length;
  els.manuscriptCheckBadge.textContent = count > 99 ? '99+' : String(count);
  els.manuscriptCheckBadge.classList.toggle('clear', count === 0);
  els.manuscriptCheckBtn.classList.toggle('has-issues', count > 0);
  els.manuscriptCheckBtn.title = count
    ? `${count}件の確認項目があります`
    : '現在、確認が必要な項目はありません';
}

function setManuscriptCheckFilter(filter) {
  manuscriptCheckFilter = ['all', 'warning', 'fixable'].includes(filter) ? filter : 'all';
  document.querySelectorAll('[data-check-filter]').forEach((button) => {
    const active = button.dataset.checkFilter === manuscriptCheckFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderManuscriptCheckResults();
}

function getFilteredManuscriptIssues() {
  if (manuscriptCheckFilter === 'warning') {
    return manuscriptIssues.filter((issue) => issue.severity === 'warning');
  }
  if (manuscriptCheckFilter === 'fixable') {
    return manuscriptIssues.filter((issue) => typeof issue.replacement === 'string');
  }
  return manuscriptIssues;
}

function renderManuscriptCheckResults() {
  if (!els.manuscriptCheckList) return;
  const warningCount = manuscriptIssues.filter((issue) => issue.severity === 'warning').length;
  const fixableCount = manuscriptIssues.filter((issue) => typeof issue.replacement === 'string').length;
  const safeCount = manuscriptIssues.filter((issue) => issue.safe && typeof issue.replacement === 'string').length;

  els.manuscriptCheckTotal.textContent = `${manuscriptIssues.length}件`;
  els.manuscriptCheckWarnings.textContent = `${warningCount}件`;
  els.manuscriptCheckFixable.textContent = `${fixableCount}件`;
  els.fixSafeManuscriptIssuesBtn.disabled = safeCount === 0;
  els.fixSafeManuscriptIssuesBtn.textContent = safeCount
    ? `安全な項目を一括修正（${safeCount}件）`
    : '安全な項目を一括修正';

  const filtered = getFilteredManuscriptIssues();
  els.manuscriptCheckList.replaceChildren();
  els.manuscriptCheckEmpty.hidden = manuscriptIssues.length !== 0;

  if (!manuscriptIssues.length) {
    els.manuscriptCheckList.hidden = true;
  } else {
    els.manuscriptCheckList.hidden = false;
  }

  if (manuscriptIssues.length && !filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'check-filter-empty';
    empty.textContent = 'この条件に該当する項目はありません。';
    els.manuscriptCheckList.appendChild(empty);
  }

  filtered.forEach((issue) => {
    const row = document.createElement('article');
    row.className = `check-issue ${issue.severity}`;

    const top = document.createElement('div');
    top.className = 'check-issue-top';
    const labels = document.createElement('div');
    labels.className = 'check-issue-labels';
    const category = document.createElement('span');
    category.className = 'check-category-badge';
    category.textContent = issue.category;
    const location = document.createElement('span');
    location.className = 'check-location';
    location.textContent = issue.line ? `${issue.fieldLabel}・${issue.line}行目` : issue.fieldLabel;
    labels.append(category, location);
    if (issue.safe) {
      const safe = document.createElement('span');
      safe.className = 'check-safe-badge';
      safe.textContent = '安全に一括修正可';
      labels.appendChild(safe);
    }
    top.appendChild(labels);

    const title = document.createElement('strong');
    title.className = 'check-issue-title';
    title.textContent = issue.title;
    const excerpt = document.createElement('code');
    excerpt.className = 'check-excerpt';
    excerpt.textContent = issue.excerpt;
    const message = document.createElement('p');
    message.className = 'check-issue-message';
    message.textContent = issue.message;

    const actions = document.createElement('div');
    actions.className = 'check-issue-actions';
    const locateButton = document.createElement('button');
    locateButton.type = 'button';
    locateButton.className = 'button modal-secondary small';
    locateButton.dataset.checkAction = 'locate';
    locateButton.dataset.issueId = issue.id;
    locateButton.textContent = '該当箇所を確認';
    actions.appendChild(locateButton);

    if (typeof issue.replacement === 'string') {
      const fixButton = document.createElement('button');
      fixButton.type = 'button';
      fixButton.className = 'button modal-primary small';
      fixButton.dataset.checkAction = 'fix';
      fixButton.dataset.issueId = issue.id;
      fixButton.textContent = 'この項目を修正';
      actions.appendChild(fixButton);
    }

    row.append(top, title, excerpt, message, actions);
    els.manuscriptCheckList.appendChild(row);
  });

  els.manuscriptCheckFooterNote.textContent = manuscriptIssues.length >= MAX_MANUSCRIPT_ISSUES
    ? `表示上限の${MAX_MANUSCRIPT_ISSUES}件に達しました。修正後に再チェックしてください。`
    : '「該当箇所を確認」を押すと、全文編集の対象位置へ移動します。原稿は自動で書き換えません。';
}

function handleManuscriptCheckAction(event) {
  const button = event.target.closest('[data-check-action][data-issue-id]');
  if (!button) return;
  const issue = manuscriptIssues.find((item) => item.id === button.dataset.issueId);
  if (!issue) {
    runManuscriptCheck({ announce: false });
    return;
  }
  if (button.dataset.checkAction === 'locate') {
    locateManuscriptIssue(issue);
  } else if (button.dataset.checkAction === 'fix') {
    fixManuscriptIssue(issue);
  }
}

function getCheckFieldElement(fieldKey) {
  return {
    title: els.titleInput,
    subtitle: els.subtitleInput,
    author: els.authorInput,
    body: els.bodyInput
  }[fieldKey] || null;
}

function locateManuscriptIssue(issue) {
  const element = getCheckFieldElement(issue.fieldKey);
  if (!element) return;
  if (issue.fieldKey === 'body') setManuscriptEditorMode('full');
  closeModal('manuscriptCheckModal');
  requestAnimationFrame(() => {
    element.focus();
    if (typeof element.setSelectionRange === 'function') {
      element.setSelectionRange(issue.start, Math.max(issue.start + 1, issue.end));
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.remove('check-focus-flash');
    void element.offsetWidth;
    element.classList.add('check-focus-flash');
    setTimeout(() => element.classList.remove('check-focus-flash'), 1500);
  });
}

function fixManuscriptIssue(issue) {
  if (typeof issue.replacement !== 'string') return;
  const element = getCheckFieldElement(issue.fieldKey);
  if (!element) return;
  const current = String(element.value || '');
  if (current.slice(issue.start, issue.end) !== issue.original) {
    runManuscriptCheck({ announce: false });
    showToast('原稿が更新されていたため、チェック結果を更新しました。');
    return;
  }
  element.value = current.slice(0, issue.start) + issue.replacement + current.slice(issue.end);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  runManuscriptCheck({ announce: false });
  showToast('選択した項目を修正しました。');
}

function fixSafeManuscriptIssues() {
  const safeIssues = manuscriptIssues.filter((issue) => issue.safe && typeof issue.replacement === 'string');
  if (!safeIssues.length) return;
  if (!window.confirm(`安全に修正できる${safeIssues.length}件を一括修正しますか？\nタブ・見えない文字・行末空白などが対象です。`)) return;

  const byField = new Map();
  safeIssues.forEach((issue) => {
    if (!byField.has(issue.fieldKey)) byField.set(issue.fieldKey, []);
    byField.get(issue.fieldKey).push(issue);
  });

  let fixedCount = 0;
  byField.forEach((issues, fieldKey) => {
    const element = getCheckFieldElement(fieldKey);
    if (!element) return;
    let value = String(element.value || '');
    issues.sort((a, b) => b.start - a.start).forEach((issue) => {
      if (value.slice(issue.start, issue.end) !== issue.original) return;
      value = value.slice(0, issue.start) + issue.replacement + value.slice(issue.end);
      fixedCount += 1;
    });
    if (value !== element.value) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  runManuscriptCheck({ announce: false });
  showToast(`${fixedCount}件を一括修正しました。`);
}


function updateBlankLineControls() {
  if (!els.blankLineScale || !els.preserveBlankLines) return;
  els.blankLineScale.disabled = !els.preserveBlankLines.checked;
}

function updateTextIndentControls() {
  if (!els.textIndent || !els.useTextIndent) return;
  els.textIndent.disabled = !els.useTextIndent.checked;
}

function setAllSettingsAccordions(open) {
  document.querySelectorAll('.settings-accordion').forEach((details) => {
    details.open = open;
  });
  saveSettingsAccordionState();
}

function saveSettingsAccordionState() {
  const state = {};
  document.querySelectorAll('.settings-accordion').forEach((details, index) => {
    const key = details.id || `section-${index}`;
    state[key] = details.open;
  });
  safeStorageSet('typesetting-app-v012-settings-ui', JSON.stringify(state));
}

function restoreSettingsAccordions() {
  const state = readJsonFromStorage('typesetting-app-v012-settings-ui', null);
  if (!state || typeof state !== 'object') return;
  document.querySelectorAll('.settings-accordion').forEach((details, index) => {
    const key = details.id || `section-${index}`;
    if (typeof state[key] === 'boolean') details.open = state[key];
  });
}

function updateRunningContentControls() {
  const headerEnabled = Boolean(els.showHeader?.checked);
  const footerEnabled = Boolean(els.showFooterText?.checked);
  if (els.headerCustomText) {
    els.headerCustomText.disabled = !headerEnabled || els.headerContent.value !== 'custom';
  }
  if (els.footerCustomText) {
    els.footerCustomText.disabled = !footerEnabled || els.footerContent.value !== 'custom';
  }
  ['headerContent', 'headerPosition', 'headerFirstPage'].forEach((id) => {
    if (els[id]) els[id].disabled = !headerEnabled;
  });
  ['footerContent', 'footerPosition', 'footerFirstPage'].forEach((id) => {
    if (els[id]) els[id].disabled = !footerEnabled;
  });
}


function updateTocControls() {
  const enabled = Boolean(els.showToc?.checked);
  [
    'tocTitle', 'tocIncludeH1', 'tocIncludeH2', 'tocIncludeH3',
    'tocShowPageNumbers', 'tocTitleSize', 'tocFontSize', 'tocLineHeight'
  ].forEach((id) => {
    if (els[id]) els[id].disabled = !enabled;
  });
  if (els.tocLeader) els.tocLeader.disabled = !enabled || !els.tocShowPageNumbers.checked;
  updateTocDetectedSummary();
}

function getTocIncludedLevels(settings = null) {
  const source = settings || {
    tocIncludeH1: Boolean(els.tocIncludeH1?.checked),
    tocIncludeH2: Boolean(els.tocIncludeH2?.checked),
    tocIncludeH3: Boolean(els.tocIncludeH3?.checked)
  };
  return [1, 2, 3].filter((level) => Boolean(source[`tocIncludeH${level}`]));
}

function updateTocDetectedSummary(state = null) {
  if (!els.tocDetectedSummary) return;
  const records = state?.manuscript?.paragraphs || paragraphRecords || [];
  const counts = [1, 2, 3].map((level) => records.filter((record) => record.type === 'heading' && Number(record.level) === level).length);
  const selected = getTocIncludedLevels(state?.settings || null);
  const selectedCount = selected.reduce((sum, level) => sum + counts[level - 1], 0);
  const breakdown = [`大${counts[0]}`, `中${counts[1]}`, `小${counts[2]}`].join('・');
  els.tocDetectedSummary.textContent = `検出：${breakdown} ／ 目次対象 ${selectedCount}件`;
}

function updateJapaneseTypesettingControls() {
  const enabled = Boolean(els.preventWidowOrphan?.checked);
  if (els.minFragmentLines) els.minFragmentLines.disabled = !enabled;

  if (els.japaneseTypesettingSummary) {
    const lineBreakLabel = els.lineBreakMode?.value === 'strict' ? '禁則：厳密' : '禁則：標準';
    const hangingLabel = els.hangingPunctuation?.checked ? 'ぶら下がり：有効' : 'ぶら下がり：無効';
    const splitLabel = enabled
      ? `一行残り防止：${Math.max(2, Math.trunc(sanitizeNumber(els.minFragmentLines?.value, 2)))}行`
      : '一行残り防止：無効';
    els.japaneseTypesettingSummary.textContent = `${lineBreakLabel} ／ ${hangingLabel} ／ ${splitLabel}`;
  }
}

function applyRecommendedJapaneseTypesetting() {
  els.lineBreakMode.value = 'strict';
  els.hangingPunctuation.checked = true;
  els.preventWidowOrphan.checked = true;
  els.minFragmentLines.value = '2';
  els.keepWithNextLines.value = '2';
  updateJapaneseTypesettingControls();
  markDirty();
  scheduleRender();
  scheduleAutosave();
  showToast('日本語組版をおすすめ設定に戻しました。');
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
    const fragments = paginateDocumentWithToc(state);
    buildPreview(fragments, state.settings, state.manuscript);
    updateTocDetectedSummary(state);
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


function paginateDocumentWithToc(state) {
  if (!state.settings.showToc) return paginate(state);

  const records = Array.isArray(state.manuscript.paragraphs)
    ? state.manuscript.paragraphs
    : createParagraphRecords(state.manuscript.body);
  const hasBodyContent = records.length > 0 || sanitizeBlankLineCount(state.manuscript.trailingBlankLines) > 0;
  const titlePages = [];
  if (state.settings.showDocumentHeading) {
    titlePages.push([{ type: 'heading', data: state.manuscript }]);
  }

  const bodyState = {
    ...state,
    settings: {
      ...state.settings,
      showDocumentHeading: false,
      bodyStartOnNewPage: false,
      showToc: false
    }
  };
  let bodyPages = hasBodyContent ? paginate(bodyState) : [];
  if (bodyPages.length === 1 && bodyPages[0].length === 0) bodyPages = [];

  const includedLevels = getTocIncludedLevels(state.settings);
  const rawEntries = [];
  bodyPages.forEach((fragments, bodyPageIndex) => {
    fragments.forEach((fragment) => {
      if (fragment.type !== 'body-heading') return;
      const level = Math.min(3, Math.max(1, Number(fragment.record?.level) || 1));
      if (!includedLevels.includes(level)) return;
      rawEntries.push({
        id: fragment.record?.id || createId('toc'),
        level,
        text: String(fragment.record?.text || ''),
        bodyPageIndex
      });
    });
  });

  let tocPages = [];
  let assumedTocPageCount = 1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const pageOffset = titlePages.length + assumedTocPageCount;
    const entries = rawEntries.map((entry) => ({
      ...entry,
      pageNumber: Math.trunc(sanitizeNumber(state.settings.pageNumberStart, 1)) + pageOffset + entry.bodyPageIndex
    }));
    tocPages = paginateTocEntries(entries, state.settings);
    if (tocPages.length === assumedTocPageCount) break;
    assumedTocPageCount = tocPages.length;
  }

  return [...titlePages, ...tocPages, ...bodyPages];
}

function paginateTocEntries(entries, settings) {
  const root = createMeasurePage();
  const content = root.querySelector('.page-content');
  const pages = [[]];
  let pageIndex = 0;

  const titleFragment = { type: 'toc-title', text: String(settings.tocTitle || '目次') };
  const titleElement = createTocTitleElement(titleFragment.text, settings);
  content.appendChild(titleElement);
  pages[0].push(titleFragment);

  if (!entries.length) {
    const emptyFragment = { type: 'toc-empty', text: '目次に表示できる見出しがありません。本文に「# 大見出し」などを追加してください。' };
    const emptyElement = createTocEmptyElement(emptyFragment.text, settings);
    content.appendChild(emptyElement);
    pages[0].push(emptyFragment);
    root.remove();
    return pages;
  }

  entries.forEach((entry) => {
    const fragment = { type: 'toc-entry', entry: deepClone(entry) };
    const element = createTocEntryElement(entry, settings);
    content.appendChild(element);
    if (!fits(content) && content.childElementCount > 1) {
      element.remove();
      pageIndex += 1;
      pages.push([]);
      content.replaceChildren();
      const continuation = createTocContinuationElement(settings);
      content.appendChild(continuation);
      pages[pageIndex].push({ type: 'toc-continuation', text: String(settings.tocTitle || '目次') });
      content.appendChild(element);
    }
    pages[pageIndex].push(fragment);
  });

  root.remove();
  return pages;
}

function createTocTitleElement(text, settings) {
  const element = document.createElement('h2');
  element.className = 'toc-title';
  setTypesetText(element, text || '目次', settings);
  element.style.fontFamily = settings.heading1FontFamily || settings.fontFamily;
  element.style.fontSize = `${sanitizeNumber(settings.tocTitleSize, 18)}pt`;
  return element;
}

function createTocContinuationElement(settings) {
  const element = document.createElement('div');
  element.className = 'toc-continuation-title';
  setTypesetText(element, `${String(settings.tocTitle || '目次')}（続き）`, settings);
  element.style.fontFamily = settings.heading1FontFamily || settings.fontFamily;
  element.style.fontSize = `${Math.max(9, sanitizeNumber(settings.tocFontSize, 9) + 1)}pt`;
  return element;
}

function createTocEntryElement(entry, settings) {
  const row = document.createElement('div');
  row.className = `toc-entry toc-level-${entry.level}`;
  row.style.fontFamily = settings.fontFamily;
  row.style.fontSize = `${sanitizeNumber(settings.tocFontSize, 9)}pt`;
  row.style.minHeight = `${sanitizeNumber(settings.tocLineHeight, 15)}pt`;
  row.style.lineHeight = `${sanitizeNumber(settings.tocLineHeight, 15)}pt`;

  const showPageNumber = Boolean(settings.tocShowPageNumbers);
  const showLeader = showPageNumber && Boolean(settings.tocLeader);
  row.classList.toggle('toc-no-page-number', !showPageNumber);
  row.classList.toggle('toc-no-leader', showPageNumber && !showLeader);

  const title = document.createElement('span');
  title.className = 'toc-entry-title';
  setTypesetText(title, entry.text, settings);
  row.appendChild(title);

  if (showLeader) {
    const leader = document.createElement('span');
    leader.className = 'toc-entry-leader';
    leader.setAttribute('aria-hidden', 'true');
    row.appendChild(leader);
  }

  if (showPageNumber) {
    const page = document.createElement('span');
    page.className = 'toc-entry-page';
    setTypesetText(page, String(entry.pageNumber), settings);
    row.appendChild(page);
  }
  return row;
}

function createTocEmptyElement(text, settings) {
  const element = document.createElement('p');
  element.className = 'toc-empty-message';
  setTypesetText(element, text, settings);
  element.style.fontFamily = settings.fontFamily;
  element.style.fontSize = `${sanitizeNumber(settings.tocFontSize, 9)}pt`;
  return element;
}

function paginate(state) {
  const root = createMeasurePage();
  const content = root.querySelector('.page-content');
  const pages = [[]];
  let pageIndex = 0;

  const heading = state.settings.showDocumentHeading ? createHeadingElement(state.manuscript, state.settings) : null;
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
    if (record.type === 'figure') {
      appendBodyFigure(record, recordIndex);
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
      const nextProbe = createKeepWithNextProbe(nextRecord, state, state.settings.keepWithNextLines);
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

  function appendBodyFigure(record, recordIndex) {
    const asset = findMediaAsset(record.mediaId, state.manuscript.media);
    const blankLinesBefore = state.settings.preserveBlankLines
      ? sanitizeBlankLineCount(record.blankLinesBefore)
      : 0;

    if (asset?.pageBreakBefore && content.childElementCount > 0) startNewPage();

    const element = createFigureElement(record, asset, state.settings, {
      blankLinesBefore,
      selectable: false
    });
    content.appendChild(element);
    if (!fits(content) && content.childElementCount > 1) {
      element.remove();
      startNewPage();
      content.appendChild(element);
    }

    pages[pageIndex].push({
      type: 'figure',
      record: deepClone(record),
      mediaId: record.mediaId,
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
      const nextProbe = createKeepWithNextProbe(nextRecord, state, state.settings.keepWithNextLines);
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
      let splitIndex = findFittingLength(
        content,
        remaining,
        isContinuation,
        override,
        fragmentBlankLines,
        state.settings
      );

      if (splitIndex > 0 && splitIndex < remaining.length && state.settings.preventWidowOrphan) {
        const balanced = balanceParagraphSplit(remaining, splitIndex, {
          continuation: isContinuation,
          override,
          blankLinesBefore: fragmentBlankLines,
          settings: state.settings
        });
        if (balanced.moveWhole && content.childElementCount > 0) {
          startNewPage();
          continue;
        }
        splitIndex = balanced.index;
      }

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
  const settings = collectSettings();
  paper.className = `paper ${isVerticalWriting(settings) ? 'writing-vertical' : 'writing-horizontal'}`;
  applyPhysicalPageMargins(paper, 0, settings);
  const content = document.createElement('div');
  content.className = `page-content ${isVerticalWriting(settings) ? 'writing-vertical' : 'writing-horizontal'}`;
  paper.appendChild(content);
  els.measureRoot.appendChild(paper);
  return paper;
}

function fits(content) {
  const vertical = String(getComputedStyle(content).writingMode || '').startsWith('vertical');
  return vertical ? content.scrollWidth <= content.clientWidth + 0.5 : content.scrollHeight <= content.clientHeight + 0.5;
}

function measureParagraphLineCount(text, options = {}) {
  if (!String(text || '').length) return 0;

  const paper = document.createElement('div');
  paper.className = 'paper line-measure-paper';
  const content = document.createElement('div');
  content.className = 'page-content line-measure-content';
  paper.appendChild(content);
  els.measureRoot.appendChild(paper);

  const paragraph = createParagraphElement(text, {
    continuation: Boolean(options.continuation),
    override: options.override || {},
    blankLinesBefore: 0,
    settings: options.settings || DEFAULT_SETTINGS,
    isFinal: false
  });
  paragraph.style.paddingBlockStart = '0';
  paragraph.style.paddingBlockEnd = '0';
  content.appendChild(paragraph);

  const computed = getComputedStyle(paragraph);
  const lineHeight = parseFloat(computed.lineHeight) || sanitizeNumber(options.settings?.lineHeight, 15) * (96 / 72);
  const rect = paragraph.getBoundingClientRect();
  const vertical = isVerticalWriting(options.settings || DEFAULT_SETTINGS);
  const extent = vertical ? rect.width : rect.height;
  paper.remove();
  return Math.max(1, Math.round(extent / Math.max(1, lineHeight)));
}

function balanceParagraphSplit(text, splitIndex, options = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...(options.settings || {}) };
  const minimumLines = Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(settings.minFragmentLines, 2))));
  if (!settings.preventWidowOrphan || minimumLines <= 1 || splitIndex <= 0 || splitIndex >= text.length) {
    return { index: splitIndex, moveWhole: false };
  }

  const headOptions = {
    continuation: Boolean(options.continuation),
    override: options.override || {},
    settings
  };
  const tailOptions = {
    continuation: true,
    override: options.override || {},
    settings
  };
  const headLines = measureParagraphLineCount(text.slice(0, splitIndex), headOptions);
  if (headLines < minimumLines) return { index: splitIndex, moveWhole: true };

  const tailLines = measureParagraphLineCount(text.slice(splitIndex), tailOptions);
  if (tailLines >= minimumLines) return { index: splitIndex, moveWhole: false };

  let low = Math.max(1, splitIndex - 500);
  let high = splitIndex - 1;
  let best = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const lines = measureParagraphLineCount(text.slice(middle), tailOptions);
    if (lines >= minimumLines) {
      best = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  if (!best) return { index: splitIndex, moveWhole: false };
  if (settings.lineBreakMode === 'strict') {
    best = findSafeJapaneseBreak(text, best, 48) || best;
  }
  const balancedHeadLines = measureParagraphLineCount(text.slice(0, best), headOptions);
  if (balancedHeadLines < minimumLines) return { index: splitIndex, moveWhole: true };
  return { index: adjustInlineMarkupBreak(text, best), moveWhole: false };
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

  return preferNaturalBreak(text, best, settings);
}

const JAPANESE_LINE_START_PROHIBITED = new Set(Array.from('、。，．？！‼⁇⁈⁉・：；)]）］｝〕〉》」』】〙〗〟’”»ァィゥェォッャュョヮヵヶーゝゞヽヾ々〻'));
const JAPANESE_LINE_END_PROHIBITED = new Set(Array.from('([（［｛〔〈《「『【〘〖〝‘“«'));

function preferNaturalBreak(text, index, settings = DEFAULT_SETTINGS) {
  if (index <= 1 || index >= text.length) return adjustInlineMarkupBreak(text, index);
  const windowStart = Math.max(1, index - 24);
  const candidate = text.slice(windowStart, index);
  const punctuation = ['。', '、', '！', '？', '」', '』', '）', '】', '》', '〉', '\n'];
  let preferred = index;

  for (let i = candidate.length - 1; i >= 0; i -= 1) {
    if (punctuation.includes(candidate[i])) {
      preferred = windowStart + i + 1;
      break;
    }
  }

  if (settings.lineBreakMode !== 'strict') return adjustInlineMarkupBreak(text, preferred);
  const safe = findSafeJapaneseBreak(text, preferred, 48)
    || findSafeJapaneseBreak(text, index, 48)
    || preferred;
  return adjustInlineMarkupBreak(text, safe);
}

function isSafeJapaneseBreak(text, index) {
  if (index <= 0 || index >= text.length) return true;
  const previous = text[index - 1];
  const next = text[index];
  return !JAPANESE_LINE_END_PROHIBITED.has(previous) && !JAPANESE_LINE_START_PROHIBITED.has(next);
}

function findSafeJapaneseBreak(text, index, maxDistance = 64) {
  const start = Math.min(text.length - 1, Math.max(1, index));
  const lower = Math.max(1, start - maxDistance);
  let fallback = 0;
  for (let cursor = start; cursor >= lower; cursor -= 1) {
    if (!isSafeJapaneseBreak(text, cursor)) continue;
    if (!fallback) fallback = cursor;
    const previous = text[cursor - 1];
    if (/[_\s、。！？!?）」』】〉》]/u.test(previous)) return cursor;
  }
  return fallback;
}

function findMediaAsset(mediaId, source = mediaAssets) {
  return (Array.isArray(source) ? source : []).find((asset) => asset?.id === mediaId) || null;
}

function createFigureElement(record, asset, settings = DEFAULT_SETTINGS, options = {}) {
  const figure = document.createElement('figure');
  figure.className = `figure-block figure-align-${asset?.align || 'center'}`;
  figure.dataset.mediaId = String(record?.mediaId || asset?.id || '');
  const widthPercent = Math.max(25, Math.min(100, Math.trunc(sanitizeNumber(asset?.widthPercent, 100))));
  figure.style.width = `${widthPercent}%`;

  const blankCount = settings.preserveBlankLines
    ? sanitizeBlankLineCount(options.blankLinesBefore ?? record?.blankLinesBefore)
    : 0;
  const blankSpace = blankCount * sanitizeNumber(settings.lineHeight, 15) * Math.max(0, sanitizeNumber(settings.blankLineScale, 1));
  const spaceBefore = Math.max(0, sanitizeNumber(asset?.spaceBefore, 3));
  const spaceAfter = Math.max(0, sanitizeNumber(asset?.spaceAfter, 3));
  if (blankSpace > 0) figure.style.paddingBlockStart = `calc(${blankSpace}pt + ${spaceBefore}mm)`;
  else if (spaceBefore > 0) figure.style.paddingBlockStart = `${spaceBefore}mm`;
  if (spaceAfter > 0) figure.style.paddingBlockEnd = `${spaceAfter}mm`;

  if (!asset?.dataUrl) {
    const missing = document.createElement('div');
    missing.className = 'figure-missing';
    missing.textContent = '画像データが見つかりません。画像・図表画面から確認してください。';
    figure.appendChild(missing);
    return figure;
  }

  const frame = document.createElement('div');
  frame.className = 'figure-media-frame';
  const image = document.createElement('img');
  image.src = asset.dataUrl;
  image.alt = String(asset.alt || asset.caption || asset.fileName || '');
  image.loading = 'eager';
  image.decoding = 'sync';
  if (asset.width && asset.height) image.style.aspectRatio = `${asset.width} / ${asset.height}`;
  const availableHeight = Math.max(25, sanitizeNumber(settings.pageHeight, 210) - sanitizeNumber(settings.marginTop, 15) - sanitizeNumber(settings.marginBottom, 18) - 18);
  image.style.maxHeight = `${availableHeight}mm`;
  frame.appendChild(image);
  figure.appendChild(frame);

  if (asset.caption) {
    const caption = document.createElement('figcaption');
    caption.className = 'figure-caption';
    setTypesetText(caption, asset.caption, { ...settings, writingMode: 'horizontal-tb' });
    figure.appendChild(caption);
  }

  if (options.selectable) figure.tabIndex = 0;
  return figure;
}

function createHeadingElement(manuscript, settings = DEFAULT_SETTINGS) {
  if (!manuscript.title && !manuscript.subtitle && !manuscript.author) return null;
  const wrap = document.createElement('section');
  wrap.className = 'document-heading';

  if (manuscript.title) {
    const title = document.createElement('h3');
    title.className = 'doc-title';
    setTypesetText(title, manuscript.title, settings);
    wrap.appendChild(title);
  }
  if (manuscript.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'doc-subtitle';
    setTypesetText(subtitle, manuscript.subtitle, settings);
    wrap.appendChild(subtitle);
  }
  if (manuscript.author) {
    const author = document.createElement('p');
    author.className = 'doc-author';
    setTypesetText(author, manuscript.author, settings);
    wrap.appendChild(author);
  }
  return wrap;
}

function getEditableParagraphRecords() {
  return paragraphRecords.filter((record) => record.type === 'paragraph');
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
  setTypesetText(heading, record.text, settings);
  heading.dataset.headingLevel = String(headingSettings.level);
  if (record.id) heading.dataset.blockId = record.id;
  heading.style.fontFamily = headingSettings.fontFamily;
  heading.style.fontSize = `${headingSettings.size}pt`;
  heading.style.lineHeight = headingSettings.level === 1 ? '1.45' : '1.5';
  heading.style.textAlign = resolveTypesetAlign(headingSettings.align, settings);

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
  if (beforeParts.length === 1) heading.style.paddingBlockStart = beforeParts[0];
  if (beforeParts.length > 1) heading.style.paddingBlockStart = `calc(${beforeParts.join(' + ')})`;
  if (headingSettings.spaceAfter > 0) heading.style.paddingBlockEnd = `${headingSettings.spaceAfter}mm`;

  return heading;
}

function createKeepWithNextProbe(record, state, requiredLines = 1) {
  if (record.type === 'figure') {
    return createFigureElement(record, findMediaAsset(record.mediaId, state.manuscript.media), state.settings, {
      blankLinesBefore: state.settings.preserveBlankLines ? sanitizeBlankLineCount(record.blankLinesBefore) : 0,
      selectable: false
    });
  }
  if (record.type === 'heading') {
    return createBodyHeadingElement(record, state.settings, {
      blankLinesBefore: state.settings.preserveBlankLines
        ? sanitizeBlankLineCount(record.blankLinesBefore)
        : 0
    });
  }

  const override = normalizeParagraphOverride(state.paragraphOverrides?.[record.id]);
  const lineCount = Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(requiredLines, 1))));
  const excerpt = Array.from({ length: lineCount }, (_, index) => index === 0 ? 'あ' : 'い').join('\n');
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
  setTypesetText(paragraph, text, settings);
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
  if (normalized.textAlign && normalized.textAlign !== 'inherit') paragraph.style.textAlign = resolveTypesetAlign(normalized.textAlign, effectiveSettings);
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
    if (beforeParts.length === 1) paragraph.style.paddingBlockStart = beforeParts[0];
    if (beforeParts.length > 1) paragraph.style.paddingBlockStart = `calc(${beforeParts.join(' + ')})`;
  }

  if (isFinal && Number.isFinite(normalized.spaceAfter) && normalized.spaceAfter > 0) {
    paragraph.style.paddingBlockEnd = `${normalized.spaceAfter}mm`;
  }
}

function createBlankSpaceElement(lines, settings = DEFAULT_SETTINGS) {
  const spacer = document.createElement('div');
  spacer.className = 'blank-space';
  const effectiveSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const count = sanitizeBlankLineCount(lines);
  const lineHeight = sanitizeNumber(effectiveSettings.lineHeight, 15);
  const scale = Math.max(0, sanitizeNumber(effectiveSettings.blankLineScale, 1));
  if (isVerticalWriting(effectiveSettings)) {
    spacer.style.width = `${count * lineHeight * scale}pt`;
    spacer.style.height = '100%';
  } else {
    spacer.style.height = `${count * lineHeight * scale}pt`;
  }
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

    const figureMatch = line.match(MEDIA_MARKER_PATTERN);
    if (figureMatch) {
      flushParagraph();
      records.push({
        type: 'figure',
        level: null,
        text: line.trim(),
        mediaId: figureMatch[1],
        blankLinesBefore: sanitizeBlankLineCount(pendingBlankLines)
      });
      pendingBlankLines = 0;
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
    id: createId(record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph'),
    type: record.type,
    level: record.type === 'heading' ? record.level : null,
    text: record.text,
    mediaId: record.type === 'figure' ? record.mediaId : null,
    blankLinesBefore: record.blankLinesBefore
  }));
}

function buildPreview(pageFragments, settings, manuscript) {
  els.pages.replaceChildren();
  let runningChapter = '';

  pageFragments.forEach((fragments, index) => {
    const paper = document.createElement('article');
    paper.className = `paper ${isVerticalWriting(settings) ? 'writing-vertical' : 'writing-horizontal'}`;
    paper.dataset.page = String(index + 1);
    applyPhysicalPageMargins(paper, index, settings);
    const content = document.createElement('div');
    content.className = `page-content ${isVerticalWriting(settings) ? 'writing-vertical' : 'writing-horizontal'}`;

    let pageChapter = runningChapter;
    fragments.forEach((fragment) => {
      if (fragment.type === 'body-heading' && Number(fragment.record?.level) === 1) {
        pageChapter = String(fragment.record.text || '');
        runningChapter = pageChapter;
      }
      if (fragment.type === 'heading') {
        const heading = createHeadingElement(fragment.data, settings);
        if (heading) content.appendChild(heading);
      } else if (fragment.type === 'toc-title') {
        content.appendChild(createTocTitleElement(fragment.text, settings));
      } else if (fragment.type === 'toc-continuation') {
        content.appendChild(createTocContinuationElement(settings));
      } else if (fragment.type === 'toc-entry') {
        content.appendChild(createTocEntryElement(fragment.entry, settings));
      } else if (fragment.type === 'toc-empty') {
        content.appendChild(createTocEmptyElement(fragment.text, settings));
      } else if (fragment.type === 'body-heading') {
        content.appendChild(createBodyHeadingElement(fragment.record, settings, {
          blankLinesBefore: fragment.blankLinesBefore
        }));
      } else if (fragment.type === 'figure') {
        const asset = findMediaAsset(fragment.mediaId, manuscript.media);
        content.appendChild(createFigureElement(fragment.record, asset, settings, {
          blankLinesBefore: fragment.blankLinesBefore,
          selectable: true
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

    appendRunningElements(paper, index, settings, manuscript, pageChapter);
    paper.appendChild(content);
    els.pages.appendChild(paper);
  });
}

function appendRunningElements(paper, pageIndex, settings, manuscript, chapterTitle) {
  const headerArea = createMarginArea('header');
  const footerArea = createMarginArea('footer');
  const isFirstPage = pageIndex === 0;

  if (settings.showHeader && (!isFirstPage || settings.headerFirstPage)) {
    const text = resolveRunningText(settings.headerContent, settings.headerCustomText, manuscript, chapterTitle);
    if (text) addMarginItem(headerArea, settings.headerPosition, text, 'running-text', pageIndex, settings);
  }

  if (settings.showFooterText && (!isFirstPage || settings.footerFirstPage)) {
    const text = resolveRunningText(settings.footerContent, settings.footerCustomText, manuscript, chapterTitle);
    if (text) addMarginItem(footerArea, settings.footerPosition, text, 'running-text', pageIndex, settings);
  }

  if (settings.showPageNumbers && (!isFirstPage || settings.firstPageNumber)) {
    const value = Math.trunc(sanitizeNumber(settings.pageNumberStart, 1)) + pageIndex;
    const [areaName, position] = String(settings.pageNumberPosition || 'bottom-center').split('-');
    const area = areaName === 'top' ? headerArea : footerArea;
    addMarginItem(area, position || 'center', String(value), 'page-number-item', pageIndex, settings);
  }

  if (headerArea.dataset.hasItems === 'true') paper.appendChild(headerArea);
  if (footerArea.dataset.hasItems === 'true') paper.appendChild(footerArea);
}

function createMarginArea(kind) {
  const area = document.createElement('div');
  area.className = `page-margin-area page-${kind}-area`;
  ['left', 'center', 'right'].forEach((position) => {
    const slot = document.createElement('div');
    slot.className = `page-margin-slot slot-${position}`;
    slot.dataset.slot = position;
    area.appendChild(slot);
  });
  return area;
}

function addMarginItem(area, position, text, className, pageIndex, settings = DEFAULT_SETTINGS) {
  const resolved = resolveMarginPosition(position, pageIndex, settings);
  const slot = area.querySelector(`[data-slot="${resolved}"]`);
  if (!slot) return;
  const item = document.createElement('span');
  item.className = className;
  setTypesetText(item, text, settings);
  slot.appendChild(item);
  area.dataset.hasItems = 'true';
}

function resolveMarginPosition(position, pageIndex, settings = DEFAULT_SETTINGS) {
  if (position === 'center') return 'center';
  const isOddPage = pageIndex % 2 === 0;
  const rightBound = settings.bindingDirection === 'right';
  if (position === 'outer') return rightBound
    ? (isOddPage ? 'left' : 'right')
    : (isOddPage ? 'right' : 'left');
  if (position === 'inner') return rightBound
    ? (isOddPage ? 'right' : 'left')
    : (isOddPage ? 'left' : 'right');
  return ['left', 'right'].includes(position) ? position : 'center';
}

function resolveRunningText(contentType, customText, manuscript, chapterTitle) {
  if (contentType === 'title') return String(manuscript?.title || '');
  if (contentType === 'author') return String(manuscript?.author || '');
  if (contentType === 'chapter') return String(chapterTitle || '');
  return String(customText || '');
}

function isVerticalWriting(settings = DEFAULT_SETTINGS) {
  return settings?.writingMode === 'vertical-rl';
}

function resolveTypesetAlign(value, settings = DEFAULT_SETTINGS) {
  const align = ['left', 'center', 'right', 'justify', 'start', 'end'].includes(value) ? value : 'justify';
  if (!isVerticalWriting(settings)) return align;
  if (align === 'left') return 'start';
  if (align === 'right') return 'end';
  return align;
}

function setTypesetText(element, text, settings = DEFAULT_SETTINGS) {
  element.replaceChildren();
  renderInlineMarkup(element, String(text ?? ''), settings, 0);
}

function renderInlineMarkup(parent, value, settings = DEFAULT_SETTINGS, depth = 0) {
  if (!value) return;
  if (depth > 8) {
    appendPlainTypesetText(parent, value, settings);
    return;
  }

  let cursor = 0;
  while (cursor < value.length) {
    if (value.startsWith('｜', cursor)) {
      const baseEnd = value.indexOf('《', cursor + 1);
      const readingEnd = baseEnd >= 0 ? value.indexOf('》', baseEnd + 1) : -1;
      const base = baseEnd >= 0 ? value.slice(cursor + 1, baseEnd) : '';
      const reading = readingEnd >= 0 ? value.slice(baseEnd + 1, readingEnd) : '';
      if (baseEnd > cursor + 1 && readingEnd > baseEnd + 1 && !/[\n\r｜《》]/u.test(base + reading)) {
        const ruby = document.createElement('ruby');
        ruby.className = 'inline-ruby';
        const rb = document.createElement('rb');
        appendPlainTypesetText(rb, base, settings);
        const rt = document.createElement('rt');
        rt.textContent = reading;
        ruby.append(rb, rt);
        parent.appendChild(ruby);
        cursor = readingEnd + 1;
        continue;
      }
    }

    const matched = [
      { open: '《《', close: '》》', tag: 'span', className: 'inline-emphasis' },
      { open: '**', close: '**', tag: 'strong', className: 'inline-bold' },
      { open: '__', close: '__', tag: 'span', className: 'inline-underline' }
    ].find((item) => value.startsWith(item.open, cursor));

    if (matched) {
      const closeIndex = value.indexOf(matched.close, cursor + matched.open.length);
      if (closeIndex > cursor + matched.open.length) {
        const node = document.createElement(matched.tag);
        node.className = matched.className;
        renderInlineMarkup(
          node,
          value.slice(cursor + matched.open.length, closeIndex),
          settings,
          depth + 1
        );
        parent.appendChild(node);
        cursor = closeIndex + matched.close.length;
        continue;
      }
    }

    const nextIndexes = ['｜', '《《', '**', '__']
      .map((marker) => value.indexOf(marker, cursor + 1))
      .filter((index) => index >= 0);
    const next = nextIndexes.length ? Math.min(...nextIndexes) : value.length;
    appendPlainTypesetText(parent, value.slice(cursor, next), settings);
    cursor = next;
  }
}

function appendPlainTypesetText(parent, value, settings = DEFAULT_SETTINGS) {
  if (!value) return;
  if (!isVerticalWriting(settings) || !settings.autoTateChuYoko) {
    parent.appendChild(document.createTextNode(value));
    return;
  }
  const pattern = /[0-9]+/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(value))) {
    if (match.index > cursor) parent.appendChild(document.createTextNode(value.slice(cursor, match.index)));
    if (match[0].length <= 3) {
      const combined = document.createElement('span');
      combined.className = 'tate-chu-yoko';
      combined.textContent = match[0];
      parent.appendChild(combined);
    } else {
      parent.appendChild(document.createTextNode(match[0]));
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) parent.appendChild(document.createTextNode(value.slice(cursor)));
}

function inlineMarkupToPlainText(value) {
  let result = String(value ?? '').replace(/^\s*\[\[figure:[a-zA-Z0-9_-]+\]\]\s*$/gmu, '');
  for (let pass = 0; pass < 6; pass += 1) {
    const previous = result;
    result = result
      .replace(/｜([^｜《》\n]+)《([^《》\n]+)》/gu, '$1')
      .replace(/《《([\s\S]*?)》》/gu, '$1')
      .replace(/\*\*([\s\S]*?)\*\*/gu, '$1')
      .replace(/__([\s\S]*?)__/gu, '$1');
    if (result === previous) break;
  }
  return result;
}

function getInlineMarkupRanges(value) {
  const text = String(value ?? '');
  const ranges = [];
  let cursor = 0;
  while (cursor < text.length) {
    if (text.startsWith('｜', cursor)) {
      const baseEnd = text.indexOf('《', cursor + 1);
      const readingEnd = baseEnd >= 0 ? text.indexOf('》', baseEnd + 1) : -1;
      if (baseEnd > cursor + 1 && readingEnd > baseEnd + 1) {
        ranges.push({ start: cursor, end: readingEnd + 1, type: 'ruby' });
        cursor = readingEnd + 1;
        continue;
      }
    }
    const marker = [
      ['《《', '》》', 'emphasis'],
      ['**', '**', 'bold'],
      ['__', '__', 'underline']
    ].find(([open]) => text.startsWith(open, cursor));
    if (marker) {
      const closeIndex = text.indexOf(marker[1], cursor + marker[0].length);
      if (closeIndex > cursor + marker[0].length) {
        ranges.push({ start: cursor, end: closeIndex + marker[1].length, type: marker[2] });
        cursor = closeIndex + marker[1].length;
        continue;
      }
    }
    cursor += 1;
  }
  return ranges;
}

function adjustInlineMarkupBreak(value, index) {
  const safeIndex = Math.max(0, Math.min(Number(index) || 0, String(value ?? '').length));
  const range = getInlineMarkupRanges(value).find((item) => item.start < safeIndex && safeIndex < item.end);
  return range ? range.start : safeIndex;
}

function getPhysicalPageMargins(pageIndex, settings = DEFAULT_SETTINGS) {
  const inside = Math.max(0, sanitizeNumber(settings.marginLeft, 18));
  const outside = Math.max(0, sanitizeNumber(settings.marginRight, 15));
  const isOddPage = pageIndex % 2 === 0;
  const rightBound = settings.bindingDirection === 'right';
  const insideOnRight = rightBound ? isOddPage : !isOddPage;
  return { left: insideOnRight ? outside : inside, right: insideOnRight ? inside : outside };
}

function applyPhysicalPageMargins(paper, pageIndex, settings = DEFAULT_SETTINGS) {
  const margins = getPhysicalPageMargins(pageIndex, settings);
  paper.style.setProperty('--page-margin-left', `${margins.left}mm`);
  paper.style.setProperty('--page-margin-right', `${margins.right}mm`);
}

function updateDocumentLayoutControls() {
  const vertical = els.documentLayout?.value === 'vertical-rtl';
  if (els.verticalOptions) els.verticalOptions.hidden = !vertical;
  if (els.layoutStatus) {
    els.layoutStatus.textContent = vertical
      ? '縦書き・右綴じ：ページは右から左へ読み進めます。'
      : '横書き・左綴じ：一般的な冊子・資料向けです。';
  }
  if (!isApplyingState) {
    applyViewSettings();
    scheduleRender();
  }
}

function applyCssVariables(settings) {
  const root = document.documentElement;
  root.style.setProperty('--page-width', `${settings.pageWidth}mm`);
  root.style.setProperty('--page-height', `${settings.pageHeight}mm`);
  root.style.setProperty('--page-margin-top', `${settings.marginTop}mm`);
  root.style.setProperty('--page-margin-bottom', `${settings.marginBottom}mm`);
  root.style.setProperty('--page-margin-left', `${settings.marginLeft}mm`);
  root.style.setProperty('--page-margin-right', `${settings.marginRight}mm`);
  root.style.setProperty('--writing-mode', settings.writingMode === 'vertical-rl' ? 'vertical-rl' : 'horizontal-tb');
  root.style.setProperty('--text-orientation', settings.verticalTextOrientation === 'upright' ? 'upright' : 'mixed');
  root.style.setProperty('--body-font', settings.fontFamily);
  root.style.setProperty('--body-size', `${settings.fontSize}pt`);
  root.style.setProperty('--body-leading', `${settings.lineHeight}pt`);
  root.style.setProperty('--body-tracking', `${settings.letterSpacing}em`);
  const bodyIndent = settings.useTextIndent ? sanitizeNumber(settings.textIndent, 1) : 0;
  root.style.setProperty('--body-indent', `${bodyIndent}em`);
  root.style.setProperty('--body-align', resolveTypesetAlign(settings.textAlign, settings));
  root.style.setProperty('--body-line-break', settings.lineBreakMode === 'strict' ? 'strict' : 'normal');
  root.style.setProperty('--body-hanging-punctuation', settings.hangingPunctuation ? 'allow-end' : 'none');
  root.style.setProperty('--title-size', `${settings.titleSize}pt`);
  root.style.setProperty('--title-align', settings.titleAlign);
  root.style.setProperty('--title-bottom', `${settings.titleBottom}mm`);
}

function applyViewSettings() {
  const mode = els.viewMode.value;
  const zoom = Number(els.zoomSelect.value) || 0.7;
  els.pages.classList.toggle('single', mode === 'single');
  els.pages.classList.toggle('spread', mode === 'spread');
  const vertical = els.documentLayout?.value === 'vertical-rtl';
  els.pages.classList.toggle('writing-vertical', vertical);
  els.pages.classList.toggle('writing-horizontal', !vertical);
  els.pages.classList.toggle('binding-right', vertical);
  els.pages.classList.toggle('binding-left', !vertical);
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
      chapters: serializeChapterModel(),
      media: deepClone(mediaAssets),
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
    writingMode: els.documentLayout.value === 'vertical-rtl' ? 'vertical-rl' : 'horizontal-tb',
    bindingDirection: els.documentLayout.value === 'vertical-rtl' ? 'right' : 'left',
    verticalTextOrientation: els.verticalTextOrientation.value === 'upright' ? 'upright' : 'mixed',
    autoTateChuYoko: els.autoTateChuYoko.checked,
    fontFamily: els.fontFamily.value,
    fontSize: sanitizeNumber(els.fontSize.value, 9),
    lineHeight: sanitizeNumber(els.lineHeight.value, 15),
    letterSpacing: sanitizeNumber(els.letterSpacing.value, 0.02),
    useTextIndent: els.useTextIndent.checked,
    textIndent: sanitizeNumber(els.textIndent.value, 1),
    textAlign: els.textAlign.value,
    preserveBlankLines: els.preserveBlankLines.checked,
    blankLineScale: sanitizeNumber(els.blankLineScale.value, 1),
    lineBreakMode: els.lineBreakMode.value === 'normal' ? 'normal' : 'strict',
    hangingPunctuation: els.hangingPunctuation.checked,
    preventWidowOrphan: els.preventWidowOrphan.checked,
    minFragmentLines: Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(els.minFragmentLines.value, 2)))),
    keepWithNextLines: Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(els.keepWithNextLines.value, 2)))),
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
    showToc: els.showToc.checked,
    tocTitle: els.tocTitle.value.trim() || '目次',
    tocIncludeH1: els.tocIncludeH1.checked,
    tocIncludeH2: els.tocIncludeH2.checked,
    tocIncludeH3: els.tocIncludeH3.checked,
    tocShowPageNumbers: els.tocShowPageNumbers.checked,
    tocLeader: els.tocLeader.checked,
    tocTitleSize: sanitizeNumber(els.tocTitleSize.value, 18),
    tocFontSize: sanitizeNumber(els.tocFontSize.value, 9),
    tocLineHeight: sanitizeNumber(els.tocLineHeight.value, 15),
    showPageNumbers: els.showPageNumbers.checked,
    pageNumberStart: Math.trunc(sanitizeNumber(els.pageNumberStart.value, 1)),
    pageNumberPosition: els.pageNumberPosition.value,
    firstPageNumber: els.firstPageNumber.checked,
    showHeader: els.showHeader.checked,
    headerContent: els.headerContent.value,
    headerCustomText: els.headerCustomText.value,
    headerPosition: els.headerPosition.value,
    headerFirstPage: els.headerFirstPage.checked,
    showFooterText: els.showFooterText.checked,
    footerContent: els.footerContent.value,
    footerCustomText: els.footerCustomText.value,
    footerPosition: els.footerPosition.value,
    footerFirstPage: els.footerFirstPage.checked,
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
    mediaAssets = deepClone(normalized.manuscript.media || []);
    selectedMediaId = null;
    updateMediaUi();
    selectedParagraphId = null;
    selectedChapterIndex = -1;
    refreshChapterModelFromBody({ preserveSelection: false });
    renderChapterManager();
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
  els.documentLayout.value = normalized.writingMode === 'vertical-rl' ? 'vertical-rtl' : 'horizontal-ltr';
  els.verticalTextOrientation.value = normalized.verticalTextOrientation === 'upright' ? 'upright' : 'mixed';
  els.autoTateChuYoko.checked = normalized.autoTateChuYoko !== false;
  updateDocumentLayoutControls();
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
  els.lineBreakMode.value = normalized.lineBreakMode === 'normal' ? 'normal' : 'strict';
  els.hangingPunctuation.checked = Boolean(normalized.hangingPunctuation);
  els.preventWidowOrphan.checked = Boolean(normalized.preventWidowOrphan);
  els.minFragmentLines.value = String(Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(normalized.minFragmentLines, 2)))));
  els.keepWithNextLines.value = String(Math.max(1, Math.min(3, Math.trunc(sanitizeNumber(normalized.keepWithNextLines, 2)))));
  updateJapaneseTypesettingControls();
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
  els.showToc.checked = Boolean(normalized.showToc);
  els.tocTitle.value = normalized.tocTitle || '目次';
  els.tocIncludeH1.checked = Boolean(normalized.tocIncludeH1);
  els.tocIncludeH2.checked = Boolean(normalized.tocIncludeH2);
  els.tocIncludeH3.checked = Boolean(normalized.tocIncludeH3);
  els.tocShowPageNumbers.checked = Boolean(normalized.tocShowPageNumbers);
  els.tocLeader.checked = Boolean(normalized.tocLeader);
  els.tocTitleSize.value = normalized.tocTitleSize;
  els.tocFontSize.value = normalized.tocFontSize;
  els.tocLineHeight.value = normalized.tocLineHeight;
  updateTocControls();
  els.showPageNumbers.checked = Boolean(normalized.showPageNumbers);
  els.pageNumberStart.value = normalized.pageNumberStart;
  els.pageNumberPosition.value = normalized.pageNumberPosition;
  els.firstPageNumber.checked = Boolean(normalized.firstPageNumber);
  els.showHeader.checked = Boolean(normalized.showHeader);
  els.headerContent.value = normalized.headerContent;
  els.headerCustomText.value = normalized.headerCustomText;
  els.headerPosition.value = normalized.headerPosition;
  els.headerFirstPage.checked = Boolean(normalized.headerFirstPage);
  els.showFooterText.checked = Boolean(normalized.showFooterText);
  els.footerContent.value = normalized.footerContent;
  els.footerCustomText.value = normalized.footerCustomText;
  els.footerPosition.value = normalized.footerPosition;
  els.footerFirstPage.checked = Boolean(normalized.footerFirstPage);
  updateRunningContentControls();
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
  manuscript.media = normalizeMediaAssets(manuscriptSource.media);
  if (!manuscript.body && Array.isArray(manuscriptSource.chapters)) {
    manuscript.body = buildBodyFromChapters(manuscriptSource.chapters);
  }
  manuscript.chapters = parseChaptersFromBody(manuscript.body);

  const oldRecords = Array.isArray(manuscriptSource.paragraphs)
    ? manuscriptSource.paragraphs
        .filter((record) => record && typeof record.id === 'string')
        .map((record) => ({
          id: record.id,
          type: record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph',
          level: record.type === 'heading' ? Math.min(3, Math.max(1, Number(record.level) || 1)) : null,
          text: String(record.text || ''),
          mediaId: record.type === 'figure' ? String(record.mediaId || extractMediaIdFromMarker(record.text) || '') : null,
          blankLinesBefore: sanitizeBlankLineCount(record.blankLinesBefore)
        }))
    : [];
  const parsedBody = parseBodyStructure(manuscript.body);
  manuscript.paragraphs = reconcileParagraphRecords(oldRecords, manuscript.body);
  manuscript.trailingBlankLines = parsedBody.trailingBlankLines;
  const validIds = new Set(
    manuscript.paragraphs.filter((record) => record.type === 'paragraph').map((record) => record.id)
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
    const oldSignaturesForOrder = old.map(signature);
    const newSignaturesForOrder = incoming.map(signature);
    const sameOrder = oldSignaturesForOrder.every((value, index) => value === newSignaturesForOrder[index]);
    const sameContents = [...oldSignaturesForOrder].sort().join('\u0001')
      === [...newSignaturesForOrder].sort().join('\u0001');

    if (sameOrder || !sameContents) {
      return incoming.map((record, index) => ({
        id: old[index]?.id || createId(record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph'),
        type: record.type,
        level: record.type === 'heading' ? record.level : null,
        text: record.text,
        mediaId: record.type === 'figure' ? record.mediaId : null,
        blankLinesBefore: record.blankLinesBefore
      }));
    }

    const signatureQueues = new Map();
    old.forEach((record) => {
      const key = signature(record);
      if (!signatureQueues.has(key)) signatureQueues.set(key, []);
      signatureQueues.get(key).push(record.id);
    });
    return incoming.map((record) => {
      const queue = signatureQueues.get(signature(record)) || [];
      return {
        id: queue.shift() || createId(record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph'),
        type: record.type,
        level: record.type === 'heading' ? record.level : null,
        text: record.text,
        mediaId: record.type === 'figure' ? record.mediaId : null,
        blankLinesBefore: record.blankLinesBefore
      };
    });
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
        id: candidate?.id || createId(incomingRecord.type === 'heading' ? 'heading' : incomingRecord.type === 'figure' ? 'figure' : 'paragraph')
      };
    }

    if (oldEnd < old.length && newEnd < incoming.length) {
      result[newEnd] = { id: old[oldEnd].id };
    }
  }

  const usedIds = new Set();
  return incoming.map((record, index) => {
    let id = result[index]?.id || createId(record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph');
    if (usedIds.has(id)) id = createId(record.type === 'heading' ? 'heading' : record.type === 'figure' ? 'figure' : 'paragraph');
    usedIds.add(id);
    return {
      id,
      type: record.type,
      level: record.type === 'heading' ? record.level : null,
      text: record.text,
      mediaId: record.type === 'figure' ? record.mediaId : null,
      blankLinesBefore: record.blankLinesBefore
    };
  });
}

function syncParagraphRecordsFromBody() {
  const parsedBody = parseBodyStructure(els.bodyInput.value);
  paragraphRecords = reconcileParagraphRecords(paragraphRecords, els.bodyInput.value);
  trailingBlankLines = parsedBody.trailingBlankLines;
  const validIds = new Set(
    paragraphRecords.filter((record) => record.type === 'paragraph').map((record) => record.id)
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
  if (els.paragraphSettingsFieldset) els.paragraphSettingsFieldset.open = true;
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
    els.selectedParagraphExcerpt.textContent = inlineMarkupToPlainText(record.text);
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
    manuscript: { title: '', subtitle: '', author: '', body: '', paragraphs: [], chapters: [], media: [] },
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
  const layoutLabel = settings.writingMode === 'vertical-rl' ? '縦書き・右綴じ' : '横書き・左綴じ';
  return `${layoutLabel} ／ ${paper} ／ ${settings.fontSize}pt・行間${settings.lineHeight}pt・${indentLabel} ／ 余白 上${settings.marginTop} 下${settings.marginBottom} 内${settings.marginLeft} 外${settings.marginRight}mm`;
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

async function exportPdf() {
  if (els.printBtn.disabled) return;

  const html2canvasRenderer = window.html2canvas;
  const JsPdfConstructor = window.jspdf?.jsPDF;
  if (typeof html2canvasRenderer !== 'function' || typeof JsPdfConstructor !== 'function') {
    showToast('PDF生成ライブラリを読み込めませんでした。ページを再読み込みしてください。');
    return;
  }

  renderDocument();
  saveCurrentProject(false);
  await waitForFrames(2);

  const papers = Array.from(els.pages.querySelectorAll('.paper'));
  if (!papers.length) {
    showToast('出力できるページがありません。');
    return;
  }

  const state = collectState();
  const pageWidth = Math.max(1, sanitizeNumber(state.settings.pageWidth, 148));
  const pageHeight = Math.max(1, sanitizeNumber(state.settings.pageHeight, 210));
  const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';
  const renderScale = choosePdfRenderScale(papers.length, pageWidth, pageHeight);
  const originalButtonText = els.printBtn.textContent;
  let stage = null;

  try {
    setPdfExportBusy(true, 'ページを準備しています。', 0);
    els.printBtn.textContent = '生成中…';
    updateSaveStatus('PDF生成中');

    if (document.fonts?.ready) await document.fonts.ready;
    stage = createPdfExportStage(pageWidth, pageHeight);

    const pdf = new JsPdfConstructor({
      orientation,
      unit: 'mm',
      format: [pageWidth, pageHeight],
      compress: true,
      putOnlyUsedFonts: true
    });

    pdf.setProperties({
      title: state.manuscript.title || state.projectName,
      author: state.manuscript.author || '',
      subject: '組版アプリで生成したレイアウト確認用PDF',
      creator: `組版アプリ ${APP_VERSION}`
    });

    for (let index = 0; index < papers.length; index += 1) {
      const progress = Math.round((index / papers.length) * 100);
      setPdfExportBusy(true, `${index + 1} / ${papers.length} ページを生成しています。`, progress);

      const clone = preparePaperCloneForPdf(papers[index]);
      stage.replaceChildren(clone);
      await waitForFrames(1);

      const canvas = await html2canvasRenderer(clone, {
        backgroundColor: '#ffffff',
        scale: renderScale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        removeContainer: true,
        imageTimeout: 15000,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
        windowWidth: clone.offsetWidth,
        windowHeight: clone.offsetHeight,
        scrollX: 0,
        scrollY: 0
      });

      if (index > 0) pdf.addPage([pageWidth, pageHeight], orientation);
      let imageData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

      imageData = null;
      canvas.width = 1;
      canvas.height = 1;
      stage.replaceChildren();
      await waitForFrames(1);
    }

    setPdfExportBusy(true, 'PDFファイルをまとめています。', 100);
    await waitForFrames(1);
    const fileName = `${sanitizeFileName(state.projectName)}_${dateStamp()}.pdf`;
    pdf.save(fileName);
    updateSaveStatus('PDF保存済み');
    showToast('アプリのレイアウトを固定したPDFを保存しました。');
  } catch (error) {
    console.error(error);
    updateSaveStatus('PDF生成エラー');
    showToast('PDF生成に失敗しました。ページ数を減らすか、再読み込み後にお試しください。');
  } finally {
    stage?.remove();
    els.printBtn.textContent = originalButtonText;
    setPdfExportBusy(false);
  }
}

function choosePdfRenderScale(pageCount, pageWidth, pageHeight) {
  const pageArea = pageWidth * pageHeight;
  if (pageCount >= 80 || pageArea >= 60000) return 1.75;
  if (pageCount >= 40 || pageArea >= 45000) return 2;
  return 2.25;
}

function createPdfExportStage(pageWidth, pageHeight) {
  const stage = document.createElement('div');
  stage.className = 'pdf-export-stage';
  stage.style.width = `${pageWidth}mm`;
  stage.style.height = `${pageHeight}mm`;
  document.body.appendChild(stage);
  return stage;
}

function preparePaperCloneForPdf(sourcePaper) {
  const clone = sourcePaper.cloneNode(true);
  clone.classList.add('pdf-export-paper');
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.zoom = '1';
  clone.querySelectorAll('.page-content').forEach((content) => content.classList.remove('guides'));
  clone.querySelectorAll('.selected-paragraph, .has-override').forEach((element) => {
    element.classList.remove('selected-paragraph', 'has-override');
  });
  return clone;
}

function setPdfExportBusy(busy, status = '', progress = 0) {
  els.printBtn.disabled = busy;
  els.pdfExportOverlay.hidden = !busy;
  document.body.classList.toggle('pdf-exporting', busy);
  if (busy) {
    els.pdfExportStatus.textContent = status;
    els.pdfExportProgress.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}

function waitForFrames(count = 1) {
  return new Promise((resolve) => {
    const step = (remaining) => {
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(remaining - 1));
    };
    step(count);
  });
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
  const count = inlineMarkupToPlainText(els.bodyInput.value).replace(/\s/g, '').length;
  els.charCount.textContent = `${count.toLocaleString('ja-JP')}文字`;
}

function normalizeMediaAssets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_MEDIA_ASSETS).map((asset) => ({
    id: String(asset?.id || createId('media')),
    fileName: String(asset?.fileName || '画像'),
    mimeType: String(asset?.mimeType || 'image/webp'),
    dataUrl: String(asset?.dataUrl || ''),
    width: Math.max(1, Math.trunc(sanitizeNumber(asset?.width, 1))),
    height: Math.max(1, Math.trunc(sanitizeNumber(asset?.height, 1))),
    originalBytes: Math.max(0, Math.trunc(sanitizeNumber(asset?.originalBytes, 0))),
    caption: String(asset?.caption || ''),
    alt: String(asset?.alt || ''),
    widthPercent: [25, 40, 50, 60, 75, 80, 100].includes(Number(asset?.widthPercent)) ? Number(asset.widthPercent) : 100,
    align: ['left', 'center', 'right'].includes(asset?.align) ? asset.align : 'center',
    pageBreakBefore: Boolean(asset?.pageBreakBefore),
    spaceBefore: Math.max(0, sanitizeNumber(asset?.spaceBefore, 3)),
    spaceAfter: Math.max(0, sanitizeNumber(asset?.spaceAfter, 3)),
    createdAt: String(asset?.createdAt || new Date().toISOString())
  })).filter((asset) => asset.dataUrl || asset.id);
}

function extractMediaIdFromMarker(value) {
  const match = String(value || '').match(MEDIA_MARKER_PATTERN);
  return match ? match[1] : '';
}

function mediaDataCharCount() {
  return mediaAssets.reduce((total, asset) => total + String(asset.dataUrl || '').length, 0);
}

function updateMediaUi() {
  const count = mediaAssets.length;
  if (els.mediaCountBadge) els.mediaCountBadge.textContent = String(count);
  if (!els.mediaStorageSummary || !els.mediaStorageProgress) return;
  const chars = mediaDataCharCount();
  const approximateBytes = Math.round(chars * .75);
  els.mediaStorageSummary.textContent = `${formatBytes(approximateBytes)} / 約3.2 MB`;
  const percent = Math.min(100, Math.round((chars / MAX_MEDIA_DATA_CHARS) * 100));
  els.mediaStorageProgress.style.width = `${percent}%`;
  els.mediaStorageProgress.style.background = percent >= 90 ? '#b04b4b' : percent >= 70 ? '#b17b36' : '#5277a6';
}

function openMediaManager(targetId = 'bodyInput', mediaId = null) {
  mediaInsertTarget = targetId === 'chapterBodyInput' ? 'chapterBodyInput' : 'bodyInput';
  selectedMediaId = mediaId || selectedMediaId;
  els.mediaTargetNote.textContent = mediaInsertTarget === 'chapterBodyInput'
    ? '現在選択中の章本文のカーソル位置へ挿入します。'
    : '全文編集のカーソル位置へ挿入します。';
  renderMediaLibrary();
  updateMediaUi();
  openModal('mediaModal');
  if (selectedMediaId) {
    requestAnimationFrame(() => els.mediaLibraryList.querySelector(`[data-media-card-id="${CSS.escape(selectedMediaId)}"]`)?.scrollIntoView({ block: 'center' }));
  }
}

async function handleMediaFilesSelected(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  if (mediaAssets.length + files.length > MAX_MEDIA_ASSETS) {
    showToast(`画像は1プロジェクト${MAX_MEDIA_ASSETS}点までです。`);
    return;
  }

  for (const file of files) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      showToast(`「${file.name}」は対応していない形式です。`);
      continue;
    }
    if (file.size > MAX_MEDIA_SOURCE_BYTES) {
      showToast(`「${file.name}」は12MB以下にしてください。`);
      continue;
    }
    try {
      const optimized = await optimizeImageFile(file);
      const nextChars = mediaDataCharCount() + optimized.dataUrl.length;
      if (nextChars > MAX_MEDIA_DATA_CHARS) {
        showToast('画像保存容量を超えるため追加できません。不要な画像を削除するか、画像を小さくしてください。');
        continue;
      }
      const asset = {
        id: createId('media'),
        fileName: file.name,
        mimeType: optimized.mimeType,
        dataUrl: optimized.dataUrl,
        width: optimized.width,
        height: optimized.height,
        originalBytes: file.size,
        caption: '',
        alt: file.name.replace(/\.[^.]+$/, ''),
        widthPercent: 100,
        align: 'center',
        pageBreakBefore: false,
        spaceBefore: 3,
        spaceAfter: 3,
        createdAt: new Date().toISOString()
      };
      mediaAssets.push(asset);
      selectedMediaId = asset.id;
    } catch (error) {
      console.error(error);
      showToast(`「${file.name}」を読み込めませんでした。`);
    }
  }
  renderMediaLibrary();
  updateMediaUi();
  markDirty();
  scheduleAutosave();
}

function optimizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const maxDimension = 2000;
        const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * ratio));
        const height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { alpha: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/webp', .88);
        let mimeType = 'image/webp';
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', .9);
          mimeType = 'image/jpeg';
        }
        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl, mimeType, width, height });
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('image load failed')); };
    image.src = objectUrl;
  });
}

function renderMediaLibrary() {
  els.mediaLibraryList.replaceChildren();
  els.mediaEmptyState.hidden = mediaAssets.length > 0;
  if (!mediaAssets.length) return;

  mediaAssets.forEach((asset) => {
    const card = document.createElement('article');
    card.className = 'media-asset-card';
    card.dataset.mediaCardId = asset.id;
    card.classList.toggle('selected', asset.id === selectedMediaId);

    const preview = document.createElement('div');
    preview.className = 'media-asset-preview';
    const img = document.createElement('img');
    img.src = asset.dataUrl;
    img.alt = asset.alt || asset.fileName;
    preview.appendChild(img);

    const fields = document.createElement('div');
    fields.className = 'media-asset-fields';
    const heading = document.createElement('div');
    heading.className = 'media-asset-heading';
    const headingCopy = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = asset.fileName;
    const meta = document.createElement('small');
    meta.textContent = `${asset.width} × ${asset.height}px ／ 元画像 ${formatBytes(asset.originalBytes)}`;
    headingCopy.append(name, meta);
    heading.appendChild(headingCopy);

    const grid = document.createElement('div');
    grid.className = 'media-form-grid';
    grid.innerHTML = `
      <label class="wide">キャプション<input data-media-field="caption" data-media-id="${escapeAttribute(asset.id)}" value="${escapeAttribute(asset.caption)}" placeholder="例：図1　全体構成"></label>
      <label class="wide">代替テキスト<input data-media-field="alt" data-media-id="${escapeAttribute(asset.id)}" value="${escapeAttribute(asset.alt)}" placeholder="画像内容の説明"></label>
      <label>表示幅<select data-media-field="widthPercent" data-media-id="${escapeAttribute(asset.id)}">
        ${[25,40,50,60,75,80,100].map((value) => `<option value="${value}" ${value === asset.widthPercent ? 'selected' : ''}>${value}%</option>`).join('')}
      </select></label>
      <label>配置<select data-media-field="align" data-media-id="${escapeAttribute(asset.id)}">
        <option value="left" ${asset.align === 'left' ? 'selected' : ''}>左寄せ</option>
        <option value="center" ${asset.align === 'center' ? 'selected' : ''}>中央</option>
        <option value="right" ${asset.align === 'right' ? 'selected' : ''}>右寄せ</option>
      </select></label>
      <label>前の余白<input data-media-field="spaceBefore" data-media-id="${escapeAttribute(asset.id)}" type="number" min="0" max="50" step="0.5" value="${asset.spaceBefore}"></label>
      <label>後の余白<input data-media-field="spaceAfter" data-media-id="${escapeAttribute(asset.id)}" type="number" min="0" max="50" step="0.5" value="${asset.spaceAfter}"></label>
      <label class="wide"><span><input data-media-field="pageBreakBefore" data-media-id="${escapeAttribute(asset.id)}" type="checkbox" ${asset.pageBreakBefore ? 'checked' : ''}> 画像の前で改ページ</span></label>`;

    const actions = document.createElement('div');
    actions.className = 'media-asset-actions';
    const insert = document.createElement('button');
    insert.type = 'button'; insert.className = 'button small media-insert-button';
    insert.dataset.mediaAction = 'insert'; insert.dataset.mediaId = asset.id; insert.textContent = '本文へ挿入';
    const locate = document.createElement('button');
    locate.type = 'button'; locate.className = 'button small modal-secondary';
    locate.dataset.mediaAction = 'locate'; locate.dataset.mediaId = asset.id; locate.textContent = '挿入位置を確認';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'button small media-delete-button';
    remove.dataset.mediaAction = 'delete'; remove.dataset.mediaId = asset.id; remove.textContent = '削除';
    actions.append(insert, locate, remove);
    fields.append(heading, grid, actions);
    card.append(preview, fields);
    els.mediaLibraryList.appendChild(card);
  });
}

function handleMediaLibraryInput(event) {
  const field = event.target.closest('[data-media-field]');
  if (!field) return;
  const asset = findMediaAsset(field.dataset.mediaId);
  if (!asset) return;
  const key = field.dataset.mediaField;
  if (key === 'pageBreakBefore') asset[key] = field.checked;
  else if (['widthPercent', 'spaceBefore', 'spaceAfter'].includes(key)) asset[key] = Number(field.value);
  else asset[key] = field.value;
  selectedMediaId = asset.id;
  updateMediaUi();
  markDirty();
  scheduleRender();
  scheduleAutosave();
}

function handleMediaLibraryClick(event) {
  const button = event.target.closest('[data-media-action]');
  if (!button) return;
  const mediaId = button.dataset.mediaId;
  if (button.dataset.mediaAction === 'insert') insertMediaMarker(mediaId);
  if (button.dataset.mediaAction === 'locate') locateMediaMarker(mediaId);
  if (button.dataset.mediaAction === 'delete') deleteMediaAsset(mediaId);
}

function insertMediaMarker(mediaId) {
  const asset = findMediaAsset(mediaId);
  const textarea = els[mediaInsertTarget] || els.bodyInput;
  if (!asset || !textarea) return;
  const marker = `[[figure:${mediaId}]]`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const prefix = before && !before.endsWith('\n') ? '\n\n' : before.endsWith('\n\n') || !before ? '' : '\n';
  const suffix = after && !after.startsWith('\n') ? '\n\n' : after.startsWith('\n\n') || !after ? '' : '\n';
  textarea.value = before + prefix + marker + suffix + after;
  const cursor = (before + prefix + marker + suffix).length;
  textarea.focus(); textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  selectedMediaId = mediaId;
  closeModal('mediaModal');
  showToast(`「${asset.fileName}」を本文へ挿入しました。`);
}

function locateMediaMarker(mediaId) {
  const marker = `[[figure:${mediaId}]]`;
  const fullIndex = els.bodyInput.value.indexOf(marker);
  if (fullIndex < 0) {
    showToast('この画像はまだ本文へ挿入されていません。');
    return;
  }
  closeModal('mediaModal');
  setManuscriptEditorMode('full', { focus: false });
  els.bodyInput.focus();
  els.bodyInput.setSelectionRange(fullIndex, fullIndex + marker.length);
  requestAnimationFrame(() => els.bodyInput.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

function deleteMediaAsset(mediaId) {
  const asset = findMediaAsset(mediaId);
  if (!asset) return;
  const marker = `[[figure:${mediaId}]]`;
  const occurrences = els.bodyInput.value.split(marker).length - 1;
  const message = occurrences
    ? `「${asset.fileName}」を削除しますか？本文内の挿入位置${occurrences}件も削除されます。`
    : `「${asset.fileName}」を削除しますか？`;
  if (!window.confirm(message)) return;
  mediaAssets = mediaAssets.filter((item) => item.id !== mediaId);
  els.bodyInput.value = els.bodyInput.value.replace(new RegExp(`(?:\\n)?\\[\\[figure:${escapeRegExp(mediaId)}\\]\\](?:\\n)?`, 'g'), '\n');
  syncParagraphRecordsFromBody();
  refreshChapterModelFromBody({ preserveSelection: true });
  if (manuscriptEditorMode === 'chapters') renderChapterManager();
  selectedMediaId = null;
  renderMediaLibrary();
  updateMediaUi();
  updateCharCount();
  markDirty(); scheduleRender(); scheduleAutosave(); scheduleManuscriptCheck();
  showToast('画像を削除しました。');
}

function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
