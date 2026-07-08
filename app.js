'use strict';

const APP_VERSION = 'v020';
const SCHEMA_VERSION = 20;
const AUTOSAVE_DELAY = 700;
const MAX_MEDIA_ASSETS = 20;
const MAX_MEDIA_DATA_CHARS = 3_200_000;
const MAX_MEDIA_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_DECORATIONS = 60;
const MEDIA_MARKER_PATTERN = /^\s*\[\[figure:([a-zA-Z0-9_-]+)\]\]\s*$/;
const LINE_INDENT_MARKER = '\uE000';
const NO_LINE_INDENT_START_PATTERN = /^[\s　]*[「『（【〈《〔［｛“‘〝・●○◎◇◆□■△▲▽▼※＊*#…―—\-!?！？]/u;
const VERTICAL_TOKEN_PATTERN = /…{2,}|[0-9]+|[A-Za-z]+(?:[A-Za-z0-9._/+:-]*[A-Za-z0-9])?/g;

const PROJECT_INDEX_KEY = 'typesetting-app-v019-project-index';
const PROJECT_PREFIX = 'typesetting-app-v019-project:';
const CURRENT_PROJECT_KEY = 'typesetting-app-v019-current-project';
const TEMPLATE_STORAGE_KEY = 'typesetting-app-v019-templates';

const LEGACY_V18_PROJECT_INDEX_KEY = 'typesetting-app-v018-project-index';
const LEGACY_V18_PROJECT_PREFIX = 'typesetting-app-v018-project:';
const LEGACY_V18_CURRENT_PROJECT_KEY = 'typesetting-app-v018-current-project';
const LEGACY_V18_TEMPLATE_STORAGE_KEY = 'typesetting-app-v018-templates';
const LEGACY_V1_STORAGE_KEY = 'typesetting-app-v001';
const MIGRATION_MARKER_KEY = 'typesetting-app-v019-migration-complete';
const WELCOME_SEEN_KEY = 'typesetting-app-v018-welcome-seen';

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
  subtitle: '出力前チェック対応の確認用原稿',
  author: '著者名',
  body: `# 第1章　組版アプリv020

これは、組版アプリv020の動作確認用原稿です。用紙設定から「縦書き・右綴じ」へ切り替えると、同じ原稿を縦書きで確認できます。

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

const DEFAULT_BOOK_MATTER = Object.freeze({
  foreword: { enabled: false, title: 'まえがき', body: '', placement: 'before-toc' },
  afterword: { enabled: false, title: 'あとがき', body: '' },
  authorProfile: { enabled: false, title: '著者紹介', body: '' },
  colophon: {
    enabled: false, heading: '奥付', bookTitle: '', author: '', publicationDate: '',
    edition: '', issuedBy: '', publisher: '', contact: '', copyright: '', notes: ''
  }
});

const DEFAULT_STATE = Object.freeze({
  projectName: '組版アプリ v020 サンプル',
  manuscript: { ...SAMPLE_MANUSCRIPT, paragraphs: [], chapters: [], media: [], decorations: [], matter: deepClone(DEFAULT_BOOK_MATTER) },
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
let decorativeItems = [];
let selectedDecorationId = null;
let decorationGesture = null;
let mediaInsertTarget = 'bodyInput';
let selectedMediaId = null;
let preflightIssues = [];
let preflightFilter = 'all';
let preflightTimer = null;
let currentPreviewPage = 1;
let previewScrollTimer = null;
let searchResults = [];
let currentSearchResultIndex = -1;
let editHistory = [];
let redoHistory = [];
let historyCaptureTimer = null;
let historyResetTimer = null;
let isRestoringHistory = false;
let historyReady = false;
let lastHistorySignature = '';
const historyMediaData = new Map();
const HISTORY_LIMIT = 40;
const MAX_MANUSCRIPT_ISSUES = 300;
const MANUSCRIPT_MODE_KEY = 'typesetting-app-v019-manuscript-mode';
const LEGACY_MANUSCRIPT_MODE_KEY = 'typesetting-app-v018-manuscript-mode';

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
  updateDecorationUi();
  updateBookStructureUi();
  scheduleManuscriptCheck(0);
  schedulePreflightCheck(350);
  scheduleRender();
  refreshCurrentProjectStatus();
  updateWorkflowGuide();
  updateHistoryButtons();
  setTimeout(resetEditHistory, 120);
  setTimeout(maybeOpenWelcome, 260);
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
    'mediaLibraryList', 'mediaEmptyState', 'decorationLibraryList', 'decorationEmptyState', 'decorationCountSummary',
    'decorationSelectionBar', 'selectedDecorationName', 'selectedDecorationMeta', 'decorationLockBtn',
    'decorationLayerBtn', 'decorationDuplicateBtn', 'decorationDetailsBtn', 'decorationDeleteBtn',
    'decorationModal', 'decorationDetailImage', 'decorationDetailName', 'decorationPageNumber',
    'decorationLayer', 'decorationX', 'decorationY', 'decorationWidth', 'decorationOpacity',
    'decorationLocked', 'decorationCenterHorizontalBtn', 'decorationCenterVerticalBtn',
    'decorationFitWidthBtn', 'decorationModalDuplicateBtn', 'decorationModalDeleteBtn',
    'bookStructureBtn', 'bookStructureBadge', 'bookStructureModal', 'bookStructureSummary',
    'bookStructureFlow', 'fillColophonFromBookInfoBtn',
    'forewordEnabled', 'forewordTitle', 'forewordPlacement', 'forewordBody', 'forewordStatus',
    'afterwordEnabled', 'afterwordTitle', 'afterwordBody', 'afterwordStatus',
    'authorProfileEnabled', 'authorProfileTitle', 'authorProfileBody', 'authorProfileStatus',
    'colophonEnabled', 'colophonHeading', 'colophonBookTitle', 'colophonAuthor',
    'colophonPublicationDate', 'colophonEdition', 'colophonIssuedBy', 'colophonPublisher',
    'colophonContact', 'colophonCopyright', 'colophonNotes', 'colophonStatus',
    'preflightBtn', 'preflightBadge', 'preflightModal', 'preflightStatusCard',
    'preflightStatusIcon', 'preflightStatusTitle', 'preflightStatusText',
    'preflightErrors', 'preflightWarnings', 'preflightInfo', 'preflightPages',
    'rerunPreflightBtn', 'preflightList', 'preflightEmpty', 'preflightFooterNote',
    'preflightPdfBtn',
    'topSaveStatus', 'topSaveStatusText', 'toolbarMore', 'undoBtn', 'redoBtn', 'editingToolsBtn',
    'previousPageBtn', 'nextPageBtn', 'currentPageInput', 'totalPageQuick',
    'editingToolsModal', 'searchTextInput', 'replaceTextInput', 'searchScope', 'searchCaseSensitive',
    'runSearchBtn', 'previousSearchResultBtn', 'nextSearchResultBtn', 'replaceCurrentBtn', 'replaceAllBtn',
    'searchResultSummary', 'searchResultsList', 'toolPreviousPageBtn', 'toolNextPageBtn', 'toolPageInput',
    'toolPageTotal', 'jumpPageBtn', 'headingNavigationSummary', 'headingNavigationList',
    'pdfRangeInputs', 'pdfRangeFrom', 'pdfRangeTo', 'pdfRangeSummary', 'saveRangePdfBtn',
    'workflowManuscript', 'workflowLayout', 'workflowStructure', 'workflowOutput',
    'workflowManuscriptState', 'workflowLayoutState', 'workflowStructureState', 'workflowOutputState',
    'guideBtn', 'welcomeModal', 'welcomeNewBtn', 'welcomeImportBtn', 'welcomeSampleBtn',
    'welcomeGuideBtn', 'welcomeContinueBtn', 'projectSetupModal', 'projectSetupTypes',
    'setupProjectName', 'setupBookTitle', 'setupAuthor', 'createFromSetupBtn', 'guideModal',
    'manuscriptPanel', 'settingsPanel', 'previewPanel'
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
      if ([els.titleInput, els.authorInput, els.showDocumentHeading, els.showToc, els.tocTitle].includes(element)) {
        updateBookStructureUi();
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
  els.bookStructureBtn.addEventListener('click', openBookStructureModal);
  els.bookStructureModal.addEventListener('input', handleBookStructureChange);
  els.bookStructureModal.addEventListener('change', handleBookStructureChange);
  els.fillColophonFromBookInfoBtn.addEventListener('click', fillColophonFromBookInfo);
  els.mediaFileInput.addEventListener('change', handleMediaFilesSelected);
  els.mediaLibraryList.addEventListener('input', handleMediaLibraryInput);
  els.mediaLibraryList.addEventListener('change', handleMediaLibraryInput);
  els.mediaLibraryList.addEventListener('click', handleMediaLibraryClick);
  els.decorationLibraryList.addEventListener('click', handleDecorationLibraryClick);
  els.decorationSelectionBar.addEventListener('click', handleDecorationSelectionBarClick);
  els.decorationDetailsBtn.addEventListener('click', openDecorationDetails);
  els.decorationLockBtn.addEventListener('click', toggleSelectedDecorationLock);
  els.decorationLayerBtn.addEventListener('click', toggleSelectedDecorationLayer);
  els.decorationDuplicateBtn.addEventListener('click', duplicateSelectedDecoration);
  els.decorationDeleteBtn.addEventListener('click', deleteSelectedDecoration);
  [els.decorationPageNumber, els.decorationLayer, els.decorationX, els.decorationY, els.decorationWidth, els.decorationOpacity, els.decorationLocked].forEach((input) => {
    const eventName = input.matches('select, input[type="checkbox"]') ? 'change' : 'input';
    input.addEventListener(eventName, updateSelectedDecorationFromForm);
  });
  els.decorationCenterHorizontalBtn.addEventListener('click', () => alignSelectedDecoration('horizontal'));
  els.decorationCenterVerticalBtn.addEventListener('click', () => alignSelectedDecoration('vertical'));
  els.decorationFitWidthBtn.addEventListener('click', () => fitSelectedDecorationWidth(.5));
  els.decorationModalDuplicateBtn.addEventListener('click', duplicateSelectedDecoration);
  els.decorationModalDeleteBtn.addEventListener('click', deleteSelectedDecoration);
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

  els.pages.addEventListener('pointerdown', handleDecorationPointerDown);
  els.pages.addEventListener('click', (event) => {
    const decoration = event.target.closest('.decoration-item[data-decoration-id]');
    if (decoration) {
      selectDecoration(decoration.dataset.decorationId, { openDetails: false });
      return;
    }
    if (event.target.closest('.paper') && !event.target.closest('.decoration-selection-bar')) clearDecorationSelection();
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

  els.newBtn.addEventListener('click', openProjectSetupModal);
  els.projectsBtn.addEventListener('click', openProjectsModal);
  els.saveBtn.addEventListener('click', () => saveCurrentProject(true));
  els.duplicateBtn.addEventListener('click', () => duplicateProjectById(currentProjectId, true));
  els.templatesBtn.addEventListener('click', openTemplatesModal);
  els.exportBtn.addEventListener('click', exportJson);
  els.importBtn.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', importJson);
  els.printBtn.addEventListener('click', handlePdfSaveRequest);
  els.undoBtn.addEventListener('click', undoEditHistory);
  els.redoBtn.addEventListener('click', redoEditHistory);
  els.editingToolsBtn.addEventListener('click', openEditingToolsModal);
  els.previousPageBtn.addEventListener('click', () => jumpToPage(currentPreviewPage - 1));
  els.nextPageBtn.addEventListener('click', () => jumpToPage(currentPreviewPage + 1));
  els.currentPageInput.addEventListener('change', () => jumpToPage(els.currentPageInput.value));
  els.currentPageInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') jumpToPage(els.currentPageInput.value); });
  els.previewViewport.addEventListener('scroll', handlePreviewScroll, { passive: true });
  els.runSearchBtn.addEventListener('click', runEditingSearch);
  els.searchTextInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); runEditingSearch(); } });
  els.previousSearchResultBtn.addEventListener('click', () => navigateSearchResult(-1));
  els.nextSearchResultBtn.addEventListener('click', () => navigateSearchResult(1));
  els.replaceCurrentBtn.addEventListener('click', replaceCurrentSearchResult);
  els.replaceAllBtn.addEventListener('click', replaceAllSearchResults);
  els.searchResultsList.addEventListener('click', handleSearchResultClick);
  els.toolPreviousPageBtn.addEventListener('click', () => jumpToPage(currentPreviewPage - 1));
  els.toolNextPageBtn.addEventListener('click', () => jumpToPage(currentPreviewPage + 1));
  els.jumpPageBtn.addEventListener('click', () => jumpToPage(els.toolPageInput.value));
  els.toolPageInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') jumpToPage(els.toolPageInput.value); });
  els.headingNavigationList.addEventListener('click', handleHeadingNavigationClick);
  document.querySelectorAll('input[name="pdfRangeMode"]').forEach((input) => input.addEventListener('change', updatePdfRangeControls));
  [els.pdfRangeFrom, els.pdfRangeTo].forEach((input) => input.addEventListener('input', updatePdfRangeControls));
  els.saveRangePdfBtn.addEventListener('click', saveSelectedPdfRange);
  els.manuscriptCheckBtn.addEventListener('click', openManuscriptCheckModal);
  els.preflightBtn.addEventListener('click', openPreflightModal);
  els.rerunPreflightBtn.addEventListener('click', () => runPreflightCheck({ announce: true }));
  els.preflightList.addEventListener('click', handlePreflightAction);
  els.preflightPdfBtn.addEventListener('click', exportPdfFromPreflight);
  document.querySelectorAll('[data-preflight-filter]').forEach((button) => {
    button.addEventListener('click', () => setPreflightFilter(button.dataset.preflightFilter));
  });
  els.rerunManuscriptCheckBtn.addEventListener('click', () => runManuscriptCheck({ announce: true }));
  els.fixSafeManuscriptIssuesBtn.addEventListener('click', fixSafeManuscriptIssues);
  els.manuscriptCheckList.addEventListener('click', handleManuscriptCheckAction);
  document.querySelectorAll('[data-check-filter]').forEach((button) => {
    button.addEventListener('click', () => setManuscriptCheckFilter(button.dataset.checkFilter));
  });
  els.resetSettingsBtn.addEventListener('click', resetSettings);
  els.guideBtn.addEventListener('click', () => openModal('guideModal'));
  els.welcomeNewBtn.addEventListener('click', () => { closeModal('welcomeModal'); setTimeout(openProjectSetupModal, 140); });
  els.welcomeImportBtn.addEventListener('click', () => { closeModal('welcomeModal'); setTimeout(() => els.importFile.click(), 140); });
  els.welcomeSampleBtn.addEventListener('click', loadSampleProject);
  els.welcomeGuideBtn.addEventListener('click', () => { closeModal('welcomeModal'); setTimeout(() => openModal('guideModal'), 140); });
  els.welcomeContinueBtn.addEventListener('click', () => closeModal('welcomeModal'));
  els.projectSetupTypes.addEventListener('change', updateProjectSetupSelection);
  els.createFromSetupBtn.addEventListener('click', createProjectFromSetup);
  document.querySelectorAll('[data-workflow-action]').forEach((button) => button.addEventListener('click', () => navigateWorkflow(button.dataset.workflowAction)));
  document.querySelectorAll('[data-guide-action]').forEach((button) => button.addEventListener('click', () => { closeModal('guideModal'); setTimeout(() => navigateWorkflow(button.dataset.guideAction), 140); }));
  document.querySelectorAll('.toolbar-more-menu button').forEach((button) => button.addEventListener('click', () => { if (els.toolbarMore) els.toolbarMore.open = false; }));

  els.createProjectFromModalBtn.addEventListener('click', () => {
    closeModal('projectsModal');
    openProjectSetupModal();
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
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openEditingToolsModal({ focusSearch: true });
      return;
    }
    if (modifier && event.key.toLowerCase() === 'z' && !isTextEditingTarget(event.target)) {
      event.preventDefault();
      if (event.shiftKey) redoEditHistory();
      else undoEditHistory();
      return;
    }
    if (modifier && event.key.toLowerCase() === 'y' && !isTextEditingTarget(event.target)) {
      event.preventDefault();
      redoEditHistory();
      return;
    }
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
    showToast('v001の保存データをv019へ移行しました。');
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

  const legacyIndex = readJsonFromStorage(LEGACY_V18_PROJECT_INDEX_KEY, []);
  let migratedCount = 0;
  let mappedCurrentId = null;
  const legacyCurrentId = safeStorageGet(LEGACY_V18_CURRENT_PROJECT_KEY);

  if (Array.isArray(legacyIndex)) {
    legacyIndex.forEach((item) => {
      if (!item?.id) return;
      const raw = readJsonFromStorage(`${LEGACY_V18_PROJECT_PREFIX}${item.id}`, null);
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

  const legacyTemplates = readJsonFromStorage(LEGACY_V18_TEMPLATE_STORAGE_KEY, []);
  if (Array.isArray(legacyTemplates) && legacyTemplates.length) {
    safeStorageSet(TEMPLATE_STORAGE_KEY, JSON.stringify(legacyTemplates));
  }

  if (mappedCurrentId) safeStorageSet(CURRENT_PROJECT_KEY, mappedCurrentId);
  safeStorageSet(MIGRATION_MARKER_KEY, 'true');

  if (migratedCount > 0) {
    showToast(`v018のプロジェクト${migratedCount}件をv019へ移行しました。`);
  }
}

function restoreManuscriptEditorMode() {
  const stored = safeStorageGet(MANUSCRIPT_MODE_KEY) || safeStorageGet(LEGACY_MANUSCRIPT_MODE_KEY);
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
  if (!Number.isInteger(start) || !Number.isInteger(end)) return;

  const value = textarea.value;
  const selected = value.slice(start, end);
  let result = null;

  if (action === 'ellipsis') {
    result = {
      value: `${value.slice(0, start)}……${value.slice(end)}`,
      selectionStart: start + 2,
      selectionEnd: start + 2,
      message: '三点リーダー「……」を挿入しました。'
    };
  } else if (start === end) {
    textarea.focus();
    showToast('先に装飾したい文字を選択してください。');
    return;
  } else if (action === 'ruby') {
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
    updatePageNavigation({ preserveCurrent: true });
    if (!els.editingToolsModal.hidden) renderHeadingNavigation();
    schedulePreflightCheck(220);
  } catch (error) {
    console.error(error);
    showToast('プレビュー生成中にエラーが発生しました。設定値を確認してください。');
  } finally {
    isRendering = false;
  }
}


function paginateDocumentWithToc(state) {
  const matter = normalizeBookMatter(state.manuscript.matter);
  const records = Array.isArray(state.manuscript.paragraphs)
    ? state.manuscript.paragraphs
    : createParagraphRecords(state.manuscript.body);
  const hasBodyContent = records.length > 0 || sanitizeBlankLineCount(state.manuscript.trailingBlankLines) > 0;

  const titlePages = state.settings.showDocumentHeading
    ? [[{ type: 'heading', data: state.manuscript }]]
    : [];
  const forewordPages = matter.foreword.enabled
    ? paginateMatterSection(matter.foreword, state, 'foreword')
    : [];
  const forewordBeforeToc = matter.foreword.placement !== 'after-toc' ? forewordPages : [];
  const forewordAfterToc = matter.foreword.placement === 'after-toc' ? forewordPages : [];

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

  let tocPages = [];
  if (state.settings.showToc) {
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

    let assumedTocPageCount = 1;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const pageOffset = titlePages.length + forewordBeforeToc.length + assumedTocPageCount + forewordAfterToc.length;
      const entries = rawEntries.map((entry) => ({
        ...entry,
        pageNumber: Math.trunc(sanitizeNumber(state.settings.pageNumberStart, 1)) + pageOffset + entry.bodyPageIndex
      }));
      tocPages = paginateTocEntries(entries, state.settings);
      if (tocPages.length === assumedTocPageCount) break;
      assumedTocPageCount = tocPages.length;
    }
  }

  const afterwordPages = matter.afterword.enabled
    ? paginateMatterSection(matter.afterword, state, 'afterword')
    : [];
  const authorProfilePages = matter.authorProfile.enabled
    ? paginateMatterSection(matter.authorProfile, state, 'authorProfile')
    : [];
  const colophonPages = matter.colophon.enabled
    ? [[{ type: 'colophon', data: deepClone(matter.colophon) }]]
    : [];

  return [
    ...titlePages,
    ...forewordBeforeToc,
    ...tocPages,
    ...forewordAfterToc,
    ...bodyPages,
    ...afterwordPages,
    ...authorProfilePages,
    ...colophonPages
  ];
}

function paginateMatterSection(section, state, sectionKey) {
  const title = String(section?.title || '').trim();
  const body = String(section?.body || '');
  if (!title && !body.trim()) return [];
  const source = `${title ? `# ${title}` : ''}${title && body ? '\n\n' : ''}${body}`;
  const parsed = parseBodyStructure(source);
  const temporaryState = {
    manuscript: {
      title: '', subtitle: '', author: '', body: source,
      paragraphs: createParagraphRecords(source),
      trailingBlankLines: parsed.trailingBlankLines,
      media: state.manuscript.media || []
    },
    paragraphOverrides: {},
    settings: {
      ...state.settings,
      showDocumentHeading: false,
      bodyStartOnNewPage: false,
      showToc: false,
      heading1PageBreakBefore: false
    }
  };
  return paginate(temporaryState).map((page) => page.map((fragment) => {
    const base = { ...fragment, matterSection: sectionKey };
    if (fragment.type === 'body-heading') return { ...base, type: 'matter-heading' };
    if (fragment.type === 'paragraph') return { ...base, type: 'matter-paragraph' };
    if (fragment.type === 'figure') return { ...base, type: 'matter-figure' };
    if (fragment.type === 'blank-space') return { ...base, type: 'matter-blank-space' };
    return base;
  }));
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
  setTypesetParagraphText(paragraph, text, settings, { continuation, override });
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
      if ((fragment.type === 'body-heading' || fragment.type === 'matter-heading') && Number(fragment.record?.level) === 1) {
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
      } else if (fragment.type === 'matter-heading') {
        const matterHeading = createBodyHeadingElement(fragment.record, settings, {
          blankLinesBefore: fragment.blankLinesBefore
        });
        matterHeading.classList.add('matter-heading');
        content.appendChild(matterHeading);
      } else if (fragment.type === 'matter-paragraph') {
        const matterParagraph = createParagraphElement(fragment.text, {
          continuation: fragment.continuation,
          override: fragment.override,
          blankLinesBefore: fragment.blankLinesBefore,
          settings,
          isFinal: fragment.isFinal,
          selectable: false
        });
        matterParagraph.classList.add('matter-paragraph');
        matterParagraph.removeAttribute('data-paragraph-id');
        content.appendChild(matterParagraph);
      } else if (fragment.type === 'matter-figure') {
        const asset = findMediaAsset(fragment.mediaId, manuscript.media);
        content.appendChild(createFigureElement(fragment.record, asset, settings, {
          blankLinesBefore: fragment.blankLinesBefore,
          selectable: false
        }));
      } else if (fragment.type === 'matter-blank-space') {
        content.appendChild(createBlankSpaceElement(fragment.lines, settings));
      } else if (fragment.type === 'colophon') {
        content.appendChild(createColophonElement(fragment.data, manuscript, settings));
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

    appendDecorationsToPaper(paper, index + 1, settings, manuscript, 'back');
    paper.appendChild(content);
    appendRunningElements(paper, index, settings, manuscript, pageChapter);
    appendDecorationsToPaper(paper, index + 1, settings, manuscript, 'front');
    els.pages.appendChild(paper);
  });
}

function createColophonElement(data, manuscript, settings = DEFAULT_SETTINGS) {
  const source = normalizeBookMatter({ colophon: data }).colophon;
  const root = document.createElement('section');
  root.className = 'colophon-page';

  const heading = document.createElement('h2');
  heading.className = 'colophon-heading';
  setTypesetText(heading, source.heading || '奥付', { ...settings, writingMode: 'horizontal-tb' });
  root.appendChild(heading);

  const bookTitle = source.bookTitle || manuscript.title || '';
  if (bookTitle) {
    const title = document.createElement('div');
    title.className = 'colophon-book-title';
    setTypesetText(title, bookTitle, { ...settings, writingMode: 'horizontal-tb' });
    root.appendChild(title);
  }

  const rows = [
    ['著者', source.author || manuscript.author],
    ['発行日', source.publicationDate],
    ['版・刷', source.edition],
    ['発行者', source.issuedBy],
    ['発行所', source.publisher],
    ['連絡先', source.contact]
  ].filter(([, value]) => String(value || '').trim());
  if (rows.length) {
    const details = document.createElement('div');
    details.className = 'colophon-details';
    rows.forEach(([labelText, valueText]) => {
      const row = document.createElement('div');
      row.className = 'colophon-row';
      const label = document.createElement('span');
      label.className = 'colophon-label';
      label.textContent = labelText;
      const value = document.createElement('strong');
      value.className = 'colophon-value';
      value.textContent = String(valueText || '');
      row.append(label, value);
      details.appendChild(row);
    });
    root.appendChild(details);
  }

  if (source.copyright) {
    const copyright = document.createElement('p');
    copyright.className = 'colophon-copyright';
    copyright.textContent = source.copyright;
    root.appendChild(copyright);
  }
  if (source.notes) {
    const notes = document.createElement('p');
    notes.className = 'colophon-notes';
    notes.textContent = source.notes;
    root.appendChild(notes);
  }
  return root;
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
  item.setAttribute('dir', 'auto');
  setTypesetText(item, text, { ...settings, writingMode: 'horizontal-tb', autoTateChuYoko: false });
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

function setTypesetParagraphText(element, text, settings = DEFAULT_SETTINGS, options = {}) {
  const normalizedOverride = normalizeParagraphOverride(options.override || {});
  const configuredIndent = Number.isFinite(normalizedOverride.textIndent)
    ? normalizedOverride.textIndent
    : (settings.useTextIndent ? sanitizeNumber(settings.textIndent, 1) : 0);
  const prepared = addLineIndentMarkers(
    String(text ?? ''),
    Math.max(0, configuredIndent),
    Boolean(options.continuation)
  );
  element.style.setProperty('--line-indent', `${Math.max(0, configuredIndent)}em`);
  element.replaceChildren();
  renderInlineMarkup(element, prepared, settings, 0);
}

function addLineIndentMarkers(value, indentAmount, continuation = false) {
  if (!(indentAmount > 0) || !value) return value;
  return value.split('\n').map((line, index) => {
    if (continuation && index === 0) return line;
    if (!shouldIndentManualLine(line)) return line;
    return `${LINE_INDENT_MARKER}${line}`;
  }).join('\n');
}

function shouldIndentManualLine(line) {
  const raw = String(line ?? '');
  const plain = inlineMarkupToPlainText(raw);
  if (!plain.trim()) return false;
  if (/^[\s　]/u.test(plain)) return false;
  return !NO_LINE_INDENT_START_PATTERN.test(plain);
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
  const normalizedValue = normalizeExclamationSpacing(value);
  const vertical = isVerticalWriting(settings);
  const pattern = vertical ? VERTICAL_TOKEN_PATTERN : new RegExp(LINE_INDENT_MARKER, 'g');
  let cursor = 0;
  let match;

  while ((match = pattern.exec(normalizedValue))) {
    if (match.index > cursor) {
      appendTypesetTextSegment(parent, normalizedValue.slice(cursor, match.index));
    }
    appendTypesetToken(parent, match[0], settings);
    cursor = match.index + match[0].length;
  }
  if (cursor < normalizedValue.length) {
    appendTypesetTextSegment(parent, normalizedValue.slice(cursor));
  }
}

function normalizeExclamationSpacing(value) {
  return String(value ?? '').replace(
    /([！？]+)(?=[^\s\r\n　」』）】〉》〕］｝、。，．！？…―—])/gu,
    '$1　'
  );
}

function appendTypesetTextSegment(parent, segment) {
  if (!segment) return;
  const parts = segment.split(LINE_INDENT_MARKER);
  parts.forEach((part, index) => {
    if (index > 0) appendLineIndentNode(parent);
    if (part) parent.appendChild(document.createTextNode(part));
  });
}

function appendTypesetToken(parent, token, settings = DEFAULT_SETTINGS) {
  if (token === LINE_INDENT_MARKER) {
    appendLineIndentNode(parent);
    return;
  }

  if (/^[0-9]+$/.test(token) && settings.autoTateChuYoko && token.length <= 3) {
    const combined = document.createElement('span');
    combined.className = `tate-chu-yoko digits-${token.length}`;
    combined.textContent = token;
    parent.appendChild(combined);
    return;
  }

  if (/^[A-Za-z]/.test(token)) {
    const latin = document.createElement('span');
    latin.className = `vertical-latin-run ${settings.verticalTextOrientation === 'upright' ? 'latin-upright' : 'latin-sideways'}`;
    latin.textContent = token;
    parent.appendChild(latin);
    return;
  }

  if (/^…{2,}$/.test(token)) {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'vertical-ellipsis';
    ellipsis.textContent = token;
    parent.appendChild(ellipsis);
    return;
  }

  appendTypesetTextSegment(parent, token);
}

function appendLineIndentNode(parent) {
  const indent = document.createElement('span');
  indent.className = 'manual-line-indent';
  indent.setAttribute('aria-hidden', 'true');
  parent.appendChild(indent);
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
      decorations: deepClone(decorativeItems),
      matter: collectBookMatter(),
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
    decorativeItems = deepClone(normalized.manuscript.decorations || []);
    selectedMediaId = null;
    selectedDecorationId = null;
    updateMediaUi();
    updateDecorationUi();
    applyBookMatterToInputs(normalized.manuscript.matter);
    updateBookStructureUi();
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
  if (!isRestoringHistory) scheduleHistoryReset();
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
  manuscript.decorations = normalizeDecorations(manuscriptSource.decorations, manuscript.media);
  manuscript.matter = normalizeBookMatter(manuscriptSource.matter);
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
    manuscript: { title: '', subtitle: '', author: '', body: '', paragraphs: [], chapters: [], media: [], matter: deepClone(DEFAULT_BOOK_MATTER) },
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


function schedulePreflightCheck(delay = 300) {
  clearTimeout(preflightTimer);
  preflightTimer = setTimeout(() => {
    if (isRendering || document.body.classList.contains('pdf-exporting')) {
      schedulePreflightCheck(250);
      return;
    }
    runPreflightCheck({ announce: false });
  }, Math.max(0, delay));
}

function openPreflightModal() {
  renderDocument();
  requestAnimationFrame(() => {
    runPreflightCheck({ announce: false });
    openModal('preflightModal');
  });
}

function runPreflightCheck({ announce = false } = {}) {
  preflightIssues = collectPreflightIssues();
  updatePreflightBadge();
  renderPreflightResults();
  if (announce) {
    const errors = preflightIssues.filter((issue) => issue.severity === 'error').length;
    const warnings = preflightIssues.filter((issue) => issue.severity === 'warning').length;
    if (errors) showToast(`出力を止めるエラーが${errors}件あります。`);
    else if (warnings) showToast(`要確認項目が${warnings}件あります。`);
    else showToast('PDF保存を妨げる問題はありません。');
  }
  return preflightIssues;
}

function collectPreflightIssues() {
  const state = collectState();
  const settings = state.settings;
  const manuscript = state.manuscript;
  const matter = normalizeBookMatter(manuscript.matter);
  const papers = Array.from(els.pages.querySelectorAll('.paper'));
  const issues = [];
  let issueIndex = 0;
  const add = (severity, category, title, message, action = null, location = '') => {
    issues.push({
      id: `preflight-${++issueIndex}`,
      severity: ['error', 'warning', 'info'].includes(severity) ? severity : 'info',
      category: String(category || '確認'), title: String(title || '確認項目'),
      message: String(message || ''), action, location: String(location || '')
    });
  };

  const pageWidth = sanitizeNumber(settings.pageWidth, 0);
  const pageHeight = sanitizeNumber(settings.pageHeight, 0);
  const contentWidth = pageWidth - sanitizeNumber(settings.marginLeft, 0) - sanitizeNumber(settings.marginRight, 0);
  const contentHeight = pageHeight - sanitizeNumber(settings.marginTop, 0) - sanitizeNumber(settings.marginBottom, 0);

  if (pageWidth < 50 || pageHeight < 50 || pageWidth > 500 || pageHeight > 500) {
    add('error', '用紙', '用紙サイズを確認してください', `現在の設定は ${pageWidth} × ${pageHeight} mm です。50～500mmの範囲を目安にしてください。`, { type: 'focus', target: 'pageWidth' }, '組版設定');
  }
  if (contentWidth <= 20 || contentHeight <= 20) {
    add('error', '余白', '本文を配置できる領域が不足しています', `本文領域は約 ${Math.max(0, contentWidth).toFixed(1)} × ${Math.max(0, contentHeight).toFixed(1)} mm です。用紙または余白を見直してください。`, { type: 'focus', target: 'marginTop' }, '組版設定');
  }
  const smallMargins = [settings.marginTop, settings.marginBottom, settings.marginLeft, settings.marginRight].filter((value) => sanitizeNumber(value, 0) < 5);
  if (smallMargins.length) {
    add('warning', '余白', '5mm未満の余白があります', '裁ち落としやプリンターの印刷不可領域を考慮し、必要な余白が確保されているか確認してください。', { type: 'focus', target: 'marginTop' }, '組版設定');
  }
  if (sanitizeNumber(settings.fontSize, 9) < 7) {
    add('warning', '本文', '本文文字が小さく設定されています', `${settings.fontSize}ptです。印刷後に読みやすい大きさか実寸で確認してください。`, { type: 'focus', target: 'fontSize' }, '組版設定');
  }
  if (sanitizeNumber(settings.lineHeight, 15) < sanitizeNumber(settings.fontSize, 9) * 1.1) {
    add('warning', '本文', '行間が文字サイズに対して狭い可能性があります', `文字 ${settings.fontSize}pt／行間 ${settings.lineHeight}ptです。文字の重なりや読みづらさを確認してください。`, { type: 'focus', target: 'lineHeight' }, '組版設定');
  }

  if (settings.showDocumentHeading && !String(manuscript.title || '').trim()) {
    add('warning', '書籍情報', '扉を表示していますがタイトルが空です', 'タイトルを入力するか、組版設定の「タイトルを表示」をOFFにしてください。', { type: 'focus', target: 'titleInput' }, '扉');
  }
  if (!String(state.projectName || '').trim()) {
    add('warning', '保存', 'プロジェクト名が空です', 'JSON・PDFのファイル名を識別しやすくするため、プロジェクト名を入力してください。', { type: 'focus', target: 'projectName' }, '上部メニュー');
  }

  const records = Array.isArray(manuscript.paragraphs) ? manuscript.paragraphs : createParagraphRecords(manuscript.body);
  const bodyText = String(manuscript.body || '').replace(/\[\[figure:[^\]]+\]\]/g, '').replace(/^#{1,3}\s*/gm, '').replace(/[\s*_＿《》｜]+/g, '');
  const enabledMatterHasText = [matter.foreword, matter.afterword, matter.authorProfile].some((section) => section.enabled && String(section.body || '').trim()) || matter.colophon.enabled;
  if (!bodyText && !enabledMatterHasText) {
    add('warning', '原稿', '本文が入力されていません', 'タイトルだけの出力でない場合は、全文編集または章別編集から本文を入力してください。', { type: 'manuscript' }, '本文');
  }

  const headings = records.filter((record) => record.type === 'heading');
  if (settings.showToc && !headings.some((record) => getTocIncludedLevels(settings).includes(Number(record.level) || 1))) {
    add('warning', '目次', '目次に掲載できる見出しがありません', '目次対象の見出し階層をONにするか、本文へ見出しを追加してください。', { type: 'focus', target: 'showToc' }, '目次');
  }
  let seenH1 = false;
  let seenH2 = false;
  headings.forEach((heading) => {
    const level = Number(heading.level) || 1;
    if (level === 1) { seenH1 = true; seenH2 = false; }
    if (level === 2 && !seenH1) add('warning', '見出し', '大見出しより前に中見出しがあります', `「${heading.text || '無題'}」の階層を確認してください。`, { type: 'manuscript', search: heading.text }, '本文');
    if (level === 2) seenH2 = true;
    if (level === 3 && !seenH2) add('warning', '見出し', '中見出しより前に小見出しがあります', `「${heading.text || '無題'}」の階層を確認してください。`, { type: 'manuscript', search: heading.text }, '本文');
  });
  const h1Counts = new Map();
  headings.filter((record) => Number(record.level) === 1).forEach((record) => {
    const key = String(record.text || '').trim();
    if (key) h1Counts.set(key, (h1Counts.get(key) || 0) + 1);
  });
  const duplicateH1 = [...h1Counts.entries()].filter(([, count]) => count > 1);
  if (duplicateH1.length) {
    add('info', '見出し', '同じ章タイトルが複数あります', duplicateH1.map(([title, count]) => `「${title}」${count}件`).join('、'), { type: 'manuscript', search: duplicateH1[0][0] }, '本文');
  }

  [['foreword', matter.foreword, 'まえがき'], ['afterword', matter.afterword, 'あとがき'], ['authorProfile', matter.authorProfile, '著者紹介']].forEach(([key, section, label]) => {
    if (section.enabled && !String(section.body || '').trim()) {
      add('warning', '書籍構成', `${label}を使用中ですが本文が空です`, '内容を入力するか、書籍構成でこのページをOFFにしてください。', { type: 'matter', key }, label);
    }
  });
  if (matter.colophon.enabled) {
    if (!String(matter.colophon.bookTitle || manuscript.title || '').trim()) add('warning', '奥付', '奥付の書名が空です', '書籍タイトルを入力するか、奥付へ書名を入力してください。', { type: 'matter', key: 'colophon' }, '奥付');
    if (!String(matter.colophon.author || manuscript.author || '').trim()) add('warning', '奥付', '奥付の著者が空です', '著者名を入力するか、奥付へ著者を入力してください。', { type: 'matter', key: 'colophon' }, '奥付');
    if (!String(matter.colophon.publicationDate || '').trim()) add('info', '奥付', '発行日が未入力です', '発行情報として必要な場合は、奥付へ発行日を入力してください。', { type: 'matter', key: 'colophon' }, '奥付');
    if (!String(matter.colophon.publisher || '').trim()) add('info', '奥付', '発行所が未入力です', '発行所を掲載する場合は入力してください。', { type: 'matter', key: 'colophon' }, '奥付');
  }

  const allTextSources = [manuscript.body, matter.foreword.body, matter.afterword.body, matter.authorProfile.body].map((value) => String(value || ''));
  const referencedMedia = new Set();
  allTextSources.forEach((source) => {
    for (const match of source.matchAll(/\[\[figure:([a-zA-Z0-9_-]+)\]\]/g)) referencedMedia.add(match[1]);
  });
  const mediaMap = new Map((manuscript.media || []).map((asset) => [String(asset.id), asset]));
  referencedMedia.forEach((id) => {
    if (!mediaMap.has(id)) add('error', '画像', '本文から参照している画像が見つかりません', `画像ID「${id}」が画像ライブラリにありません。記号を削除するか画像を再挿入してください。`, { type: 'manuscript', search: `[[figure:${id}]]` }, '本文');
  });
  (manuscript.media || []).forEach((asset) => {
    const label = asset.fileName || '画像';
    if (!String(asset.dataUrl || '').startsWith('data:image/')) {
      add('error', '画像', '画像データを読み込めません', `「${label}」の画像データが壊れている可能性があります。`, { type: 'media', id: asset.id }, '画像・図表');
      return;
    }
    if (!referencedMedia.has(String(asset.id))) {
      add('info', '画像', '本文で使われていない画像があります', `「${label}」は画像ライブラリに保存されていますが、本文中に挿入されていません。`, { type: 'media', id: asset.id }, '画像・図表');
    }
    if (!String(asset.alt || '').trim()) {
      add('info', '画像', '代替テキストが未入力です', `「${label}」に内容を説明する代替テキストを設定すると、管理しやすくなります。`, { type: 'media', id: asset.id }, '画像・図表');
    }
    const widthMm = Math.max(1, contentWidth * (sanitizeNumber(asset.widthPercent, 100) / 100));
    const estimatedPpi = sanitizeNumber(asset.width, 0) / (widthMm / 25.4);
    if (estimatedPpi && estimatedPpi < 150) {
      add('warning', '画像', '画像の解像度が低い可能性があります', `「${label}」は配置幅から約${Math.round(estimatedPpi)}ppiと推定されます。印刷時の粗さを実寸で確認してください。`, { type: 'media', id: asset.id }, '画像・図表');
    } else if (estimatedPpi && estimatedPpi < 220) {
      add('info', '画像', '画像解像度を確認してください', `「${label}」は配置幅から約${Math.round(estimatedPpi)}ppiと推定されます。高精細印刷では元画像の確認を推奨します。`, { type: 'media', id: asset.id }, '画像・図表');
    }
  });

  if (!papers.length) {
    add('error', 'ページ', '出力できるページがありません', '原稿または書籍構成を入力して、プレビューを生成してください。', { type: 'manuscript' }, 'プレビュー');
  }
  papers.forEach((paper, index) => {
    const pageNumber = index + 1;
    const content = paper.querySelector('.page-content');
    if (!content) return;
    const visibleText = String(content.textContent || '').replace(/\s+/g, '');
    const hasVisual = Boolean(content.querySelector('img, .figure-block, .colophon-page'));
    if (!visibleText && !hasVisual) {
      add('info', 'ページ', '内容のないページがあります', `${pageNumber}ページ目は本文領域が空です。意図した空白ページか確認してください。`, { type: 'page', page: pageNumber }, `${pageNumber}ページ`);
    }
    const overflowX = content.scrollWidth > content.clientWidth + 4;
    const overflowY = content.scrollHeight > content.clientHeight + 4;
    let childOverflow = false;
    const cRect = content.getBoundingClientRect();
    Array.from(content.children).forEach((child) => {
      const rect = child.getBoundingClientRect();
      if (rect.right > cRect.right + 5 || rect.left < cRect.left - 5 || rect.bottom > cRect.bottom + 5 || rect.top < cRect.top - 5) childOverflow = true;
    });
    if (overflowX || overflowY || childOverflow) {
      add('error', 'ページ', '本文領域からはみ出している可能性があります', `${pageNumber}ページ目で文字または画像のはみ出しを検出しました。余白、文字サイズ、個別設定を確認してください。`, { type: 'page', page: pageNumber }, `${pageNumber}ページ`);
    }
    if (content.querySelector('.figure-missing')) {
      add('error', '画像', '表示できない画像があります', `${pageNumber}ページ目の画像を再登録してください。`, { type: 'page', page: pageNumber }, `${pageNumber}ページ`);
    }
  });

  const firstFont = String(settings.fontFamily || '').split(',')[0].trim().replace(/^['\"]|['\"]$/g, '');
  if (firstFont && document.fonts?.check && !document.fonts.check(`12px "${firstFont.replace(/"/g, '')}"`)) {
    add('warning', 'フォント', '先頭指定フォントを確認できませんでした', `「${firstFont}」がこのPCで利用できず、代替フォントで表示されている可能性があります。`, { type: 'focus', target: 'fontFamily' }, '組版設定');
  }
  if (papers.length > 60) {
    add('warning', 'PDF', 'ページ数が多いためPDF生成に時間がかかります', `${papers.length}ページあります。保存中は画面を閉じずにお待ちください。`, { type: 'page', page: 1 }, 'PDF');
  }
  add('info', 'PDF', 'PDFは画像固定型で生成されます', 'アプリ内レイアウトとの一致を優先しています。文字検索・コピー、PDF/X、CMYK、フォント埋め込み検査には対応していません。', null, '出力仕様');

  return deduplicatePreflightIssues(issues);
}

function deduplicatePreflightIssues(issues) {
  const seen = new Set();
  return issues.filter((issue) => {
    const key = `${issue.severity}|${issue.category}|${issue.title}|${issue.location}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function updatePreflightBadge() {
  if (!els.preflightBadge || !els.preflightBtn) return;
  const errors = preflightIssues.filter((issue) => issue.severity === 'error').length;
  const warnings = preflightIssues.filter((issue) => issue.severity === 'warning').length;
  const count = errors + warnings;
  els.preflightBadge.textContent = count ? (count > 99 ? '99+' : String(count)) : '✓';
  els.preflightBadge.classList.toggle('clear', count === 0);
  els.preflightBtn.classList.toggle('has-errors', errors > 0);
  els.preflightBtn.classList.toggle('has-warnings', warnings > 0);
  els.preflightBtn.title = errors
    ? `PDF保存前に修正が必要なエラーが${errors}件あります`
    : warnings ? `要確認項目が${warnings}件あります` : 'PDF保存を妨げる問題はありません';
}

function setPreflightFilter(filter) {
  preflightFilter = ['all', 'error', 'warning', 'info'].includes(filter) ? filter : 'all';
  document.querySelectorAll('[data-preflight-filter]').forEach((button) => {
    const active = button.dataset.preflightFilter === preflightFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderPreflightResults();
}

function renderPreflightResults() {
  if (!els.preflightList) return;
  const errors = preflightIssues.filter((issue) => issue.severity === 'error').length;
  const warnings = preflightIssues.filter((issue) => issue.severity === 'warning').length;
  const infos = preflightIssues.filter((issue) => issue.severity === 'info').length;
  const pageCount = els.pages.querySelectorAll('.paper').length;
  els.preflightErrors.textContent = `${errors}件`;
  els.preflightWarnings.textContent = `${warnings}件`;
  els.preflightInfo.textContent = `${infos}件`;
  els.preflightPages.textContent = `${pageCount}ページ`;
  els.preflightStatusCard.classList.toggle('has-errors', errors > 0);
  els.preflightStatusCard.classList.toggle('has-warnings', warnings > 0);
  if (errors) {
    els.preflightStatusIcon.textContent = '!';
    els.preflightStatusTitle.textContent = 'PDF保存前に修正が必要です';
    els.preflightStatusText.textContent = `${errors}件のエラーがあります。項目の「確認する」から修正箇所へ移動できます。`;
  } else if (warnings) {
    els.preflightStatusIcon.textContent = '△';
    els.preflightStatusTitle.textContent = 'PDF保存は可能ですが、確認項目があります';
    els.preflightStatusText.textContent = `${warnings}件の要確認項目があります。意図した設定であれば、そのまま保存できます。`;
  } else {
    els.preflightStatusIcon.textContent = '✓';
    els.preflightStatusTitle.textContent = 'PDF保存を妨げる問題はありません';
    els.preflightStatusText.textContent = '最終的な文字・画像・ページ順を目視確認してから保存してください。';
  }
  els.preflightPdfBtn.disabled = errors > 0;
  els.preflightPdfBtn.textContent = errors ? 'エラー修正後に保存できます' : 'PDFを保存';

  const filtered = preflightFilter === 'all' ? preflightIssues : preflightIssues.filter((issue) => issue.severity === preflightFilter);
  els.preflightList.replaceChildren();
  els.preflightEmpty.hidden = preflightIssues.length !== 0;
  els.preflightEmpty.querySelector('strong').textContent = 'PDF保存を妨げる問題はありません';
  if (!filtered.length) {
    if (preflightIssues.length) {
      const empty = document.createElement('div');
      empty.className = 'preflight-filter-empty';
      empty.textContent = 'この条件に該当する項目はありません。';
      els.preflightList.appendChild(empty);
    }
    return;
  }
  filtered.forEach((issue) => {
    const row = document.createElement('article');
    row.className = `preflight-issue ${issue.severity}`;
    const head = document.createElement('div');
    head.className = 'preflight-issue-head';
    const main = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'preflight-issue-meta';
    const severity = document.createElement('span');
    severity.className = `preflight-severity-badge ${issue.severity}`;
    severity.textContent = issue.severity === 'error' ? 'エラー' : issue.severity === 'warning' ? '要確認' : '情報';
    const category = document.createElement('span');
    category.className = 'preflight-category-badge'; category.textContent = issue.category;
    meta.append(severity, category);
    if (issue.location) {
      const location = document.createElement('span');
      location.className = 'preflight-location-badge'; location.textContent = issue.location;
      meta.appendChild(location);
    }
    const title = document.createElement('strong');
    title.className = 'preflight-issue-title'; title.textContent = issue.title;
    const message = document.createElement('p');
    message.className = 'preflight-issue-message'; message.textContent = issue.message;
    main.append(meta, title, message); head.appendChild(main);
    if (issue.action) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'button modal-secondary preflight-issue-action';
      button.dataset.preflightIssueId = issue.id; button.textContent = '確認する';
      head.appendChild(button);
    }
    row.appendChild(head); els.preflightList.appendChild(row);
  });
}

function handlePreflightAction(event) {
  const button = event.target.closest('[data-preflight-issue-id]');
  if (!button) return;
  const issue = preflightIssues.find((item) => item.id === button.dataset.preflightIssueId);
  if (!issue?.action) return;
  navigateToPreflightAction(issue.action);
}

function navigateToPreflightAction(action) {
  closeModal('preflightModal');
  setTimeout(() => {
    if (action.type === 'focus') {
      const target = document.getElementById(action.target);
      if (!target) return;
      const details = target.closest('details');
      if (details) details.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('preflight-highlight');
      target.focus({ preventScroll: true });
      setTimeout(() => target.classList.remove('preflight-highlight'), 1900);
    } else if (action.type === 'manuscript') {
      setManuscriptEditorMode('full');
      const search = String(action.search || '');
      if (search) {
        const index = els.bodyInput.value.indexOf(search);
        if (index >= 0) els.bodyInput.setSelectionRange(index, index + search.length);
      }
      els.bodyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      els.bodyInput.focus({ preventScroll: true });
      els.bodyInput.classList.add('preflight-highlight');
      setTimeout(() => els.bodyInput.classList.remove('preflight-highlight'), 1900);
    } else if (action.type === 'matter') {
      openBookStructureModal();
      requestAnimationFrame(() => {
        const card = document.querySelector(`[data-matter-card="${CSS.escape(action.key || '')}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card?.classList.add('preflight-highlight');
        setTimeout(() => card?.classList.remove('preflight-highlight'), 1900);
      });
    } else if (action.type === 'media') {
      selectedMediaId = action.id || null;
      openMediaManager(manuscriptEditorMode === 'chapters' && selectedChapterIndex >= 0 ? 'chapterBodyInput' : 'bodyInput', selectedMediaId);
    } else if (action.type === 'page') {
      const paper = els.pages.querySelector(`.paper[data-page="${Number(action.page) || 1}"]`);
      paper?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paper?.classList.add('preflight-highlight');
      setTimeout(() => paper?.classList.remove('preflight-highlight'), 1900);
    }
  }, 150);
}

async function handlePdfSaveRequest() {
  if (els.printBtn.disabled) return;
  renderDocument();
  await waitForFrames(2);
  const issues = runPreflightCheck({ announce: false });
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  if (errors) {
    openModal('preflightModal');
    showToast(`PDF保存前に修正が必要なエラーが${errors}件あります。`);
    return;
  }
  await exportPdf();
}

async function exportPdfFromPreflight() {
  const errors = preflightIssues.filter((issue) => issue.severity === 'error').length;
  if (errors) {
    showToast('エラーを修正してからPDFを保存してください。');
    return;
  }
  closeModal('preflightModal');
  await new Promise((resolve) => setTimeout(resolve, 150));
  await exportPdf();
}

async function exportPdf(pageRange = null) {
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

  const allPapers = Array.from(els.pages.querySelectorAll('.paper'));
  if (!allPapers.length) {
    showToast('出力できるページがありません。');
    return;
  }
  const normalizedRange = normalizePdfRange(pageRange, allPapers.length);
  const papers = allPapers.slice(normalizedRange.from - 1, normalizedRange.to);

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

      const canvas = await renderPdfPageCanvas(
        html2canvasRenderer,
        clone,
        renderScale,
        isVerticalWriting(state.settings)
      );

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
    const rangeSuffix = normalizedRange.from === 1 && normalizedRange.to === allPapers.length
      ? ''
      : `_p${normalizedRange.from}-${normalizedRange.to}`;
    const fileName = `${sanitizeFileName(state.projectName)}${rangeSuffix}_${dateStamp()}.pdf`;
    pdf.save(fileName);
    updateSaveStatus('PDF保存済み');
    showToast(rangeSuffix ? `${normalizedRange.from}～${normalizedRange.to}ページをPDF保存しました。` : 'アプリのレイアウトを固定したPDFを保存しました。');
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
  clone.querySelectorAll('.decoration-item').forEach((element) => element.classList.remove('selected'));
  clone.querySelectorAll('.decoration-layer').forEach((element) => element.classList.remove('has-selected'));
  clone.querySelectorAll('.decoration-resize-handle, .decoration-lock-mark').forEach((element) => element.remove());
  return clone;
}

async function renderPdfPageCanvas(renderer, clone, scale, verticalWriting) {
  const options = {
    backgroundColor: '#ffffff',
    scale,
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
  };

  if (!verticalWriting) {
    return renderer(clone, { ...options, foreignObjectRendering: false });
  }

  // html2canvasの通常描画は縦書きの約物・英数字・縦中横を
  // 横書き用のCanvas座標で処理するため、PDFで位置ずれが起きる。
  // 縦書きページのみブラウザ自身の描画結果をSVG foreignObject経由で取得する。
  clone.classList.add('pdf-vertical-native-render');
  try {
    return await renderer(clone, { ...options, foreignObjectRendering: true });
  } catch (error) {
    console.warn('縦書き用PDF描画を通常方式へ切り替えました。', error);
    clone.classList.remove('pdf-vertical-native-render');
    return renderer(clone, { ...options, foreignObjectRendering: false });
  }
}

function setPdfExportBusy(busy, status = '', progress = 0) {
  els.printBtn.disabled = busy;
  els.pdfExportOverlay.hidden = !busy;
  document.body.classList.toggle('pdf-exporting', busy);
  document.body.classList.toggle('app-busy', busy);
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
  autosaveTimer = setTimeout(() => {
    updateSaveStatus('自動保存中…');
    requestAnimationFrame(() => saveCurrentProject(false));
  }, AUTOSAVE_DELAY);
}

function markDirty() {
  updateSaveStatus('自動保存待ち');
  updateWorkflowGuide();
  if (historyReady && !isApplyingState && !isRestoringHistory) scheduleHistoryCapture();
}

function updateSaveStatus(text) {
  els.saveStatus.textContent = text;
  if (els.topSaveStatusText) els.topSaveStatusText.textContent = text;
  if (els.topSaveStatus) {
    const mode = /失敗|エラー/.test(text) ? 'error' : /待ち|保存中|準備/.test(text) ? 'pending' : 'saved';
    els.topSaveStatus.classList.remove('saved', 'pending', 'error');
    els.topSaveStatus.classList.add(mode);
  }
}

function refreshCurrentProjectStatus() {
  const count = loadProjectIndex().length;
  els.currentProjectStatus.textContent = `ブラウザ保存 ${count}件`;
  updateWorkflowGuide();
}

function updateCharCount() {
  const count = inlineMarkupToPlainText(els.bodyInput.value).replace(/\s/g, '').length;
  els.charCount.textContent = `${count.toLocaleString('ja-JP')}文字`;
}

function normalizeBookMatter(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const foreword = source.foreword && typeof source.foreword === 'object' ? source.foreword : {};
  const afterword = source.afterword && typeof source.afterword === 'object' ? source.afterword : {};
  const authorProfile = source.authorProfile && typeof source.authorProfile === 'object' ? source.authorProfile : {};
  const colophon = source.colophon && typeof source.colophon === 'object' ? source.colophon : {};
  return {
    foreword: {
      enabled: Boolean(foreword.enabled),
      title: String(foreword.title || 'まえがき'),
      body: String(foreword.body || ''),
      placement: foreword.placement === 'after-toc' ? 'after-toc' : 'before-toc'
    },
    afterword: {
      enabled: Boolean(afterword.enabled),
      title: String(afterword.title || 'あとがき'),
      body: String(afterword.body || '')
    },
    authorProfile: {
      enabled: Boolean(authorProfile.enabled),
      title: String(authorProfile.title || '著者紹介'),
      body: String(authorProfile.body || '')
    },
    colophon: {
      enabled: Boolean(colophon.enabled),
      heading: String(colophon.heading || '奥付'),
      bookTitle: String(colophon.bookTitle || ''),
      author: String(colophon.author || ''),
      publicationDate: String(colophon.publicationDate || ''),
      edition: String(colophon.edition || ''),
      issuedBy: String(colophon.issuedBy || ''),
      publisher: String(colophon.publisher || ''),
      contact: String(colophon.contact || ''),
      copyright: String(colophon.copyright || ''),
      notes: String(colophon.notes || '')
    }
  };
}

function collectBookMatter() {
  return normalizeBookMatter({
    foreword: {
      enabled: els.forewordEnabled.checked,
      title: els.forewordTitle.value,
      body: els.forewordBody.value,
      placement: els.forewordPlacement.value
    },
    afterword: {
      enabled: els.afterwordEnabled.checked,
      title: els.afterwordTitle.value,
      body: els.afterwordBody.value
    },
    authorProfile: {
      enabled: els.authorProfileEnabled.checked,
      title: els.authorProfileTitle.value,
      body: els.authorProfileBody.value
    },
    colophon: {
      enabled: els.colophonEnabled.checked,
      heading: els.colophonHeading.value,
      bookTitle: els.colophonBookTitle.value,
      author: els.colophonAuthor.value,
      publicationDate: els.colophonPublicationDate.value,
      edition: els.colophonEdition.value,
      issuedBy: els.colophonIssuedBy.value,
      publisher: els.colophonPublisher.value,
      contact: els.colophonContact.value,
      copyright: els.colophonCopyright.value,
      notes: els.colophonNotes.value
    }
  });
}

function applyBookMatterToInputs(raw) {
  const matter = normalizeBookMatter(raw);
  els.forewordEnabled.checked = matter.foreword.enabled;
  els.forewordTitle.value = matter.foreword.title;
  els.forewordPlacement.value = matter.foreword.placement;
  els.forewordBody.value = matter.foreword.body;
  els.afterwordEnabled.checked = matter.afterword.enabled;
  els.afterwordTitle.value = matter.afterword.title;
  els.afterwordBody.value = matter.afterword.body;
  els.authorProfileEnabled.checked = matter.authorProfile.enabled;
  els.authorProfileTitle.value = matter.authorProfile.title;
  els.authorProfileBody.value = matter.authorProfile.body;
  els.colophonEnabled.checked = matter.colophon.enabled;
  els.colophonHeading.value = matter.colophon.heading;
  els.colophonBookTitle.value = matter.colophon.bookTitle;
  els.colophonAuthor.value = matter.colophon.author;
  els.colophonPublicationDate.value = matter.colophon.publicationDate;
  els.colophonEdition.value = matter.colophon.edition;
  els.colophonIssuedBy.value = matter.colophon.issuedBy;
  els.colophonPublisher.value = matter.colophon.publisher;
  els.colophonContact.value = matter.colophon.contact;
  els.colophonCopyright.value = matter.colophon.copyright;
  els.colophonNotes.value = matter.colophon.notes;
}

function openBookStructureModal() {
  updateBookStructureUi();
  openModal('bookStructureModal');
}

function handleBookStructureChange(event) {
  if (isApplyingState) return;
  if (!event.target.closest('input, textarea, select')) return;
  updateBookStructureUi();
  markDirty();
  scheduleRender();
  scheduleAutosave();
}

function fillColophonFromBookInfo() {
  if (!els.colophonBookTitle.value.trim()) els.colophonBookTitle.value = els.titleInput.value.trim();
  if (!els.colophonAuthor.value.trim()) els.colophonAuthor.value = els.authorInput.value.trim();
  if (!els.colophonCopyright.value.trim()) {
    const year = new Date().getFullYear();
    const author = els.authorInput.value.trim();
    els.colophonCopyright.value = author ? `© ${year} ${author}` : `© ${year}`;
  }
  els.colophonEnabled.checked = true;
  updateBookStructureUi();
  markDirty(); scheduleRender(); scheduleAutosave();
  showToast('書籍情報を奥付へ反映しました。');
}

function updateBookStructureUi() {
  if (!els.bookStructureFlow) return;
  const matter = collectBookMatter();
  const cards = [
    ['foreword', matter.foreword.enabled],
    ['afterword', matter.afterword.enabled],
    ['authorProfile', matter.authorProfile.enabled],
    ['colophon', matter.colophon.enabled]
  ];
  cards.forEach(([key, enabled]) => {
    const card = document.querySelector(`[data-matter-card="${key}"]`);
    const body = document.querySelector(`[data-matter-body="${key}"]`);
    card?.classList.toggle('active', enabled);
    if (body) body.setAttribute('aria-hidden', String(!enabled));
    const status = els[`${key}Status`];
    if (status) status.textContent = enabled ? '使用中' : '未使用';
  });

  const items = [];
  if (els.showDocumentHeading?.checked) items.push({ label: '扉', kind: 'primary' });
  if (matter.foreword.enabled && matter.foreword.placement !== 'after-toc') items.push({ label: matter.foreword.title || 'まえがき', kind: 'optional' });
  if (els.showToc?.checked) items.push({ label: els.tocTitle?.value || '目次', kind: 'primary' });
  if (matter.foreword.enabled && matter.foreword.placement === 'after-toc') items.push({ label: matter.foreword.title || 'まえがき', kind: 'optional' });
  items.push({ label: '本文', kind: 'primary' });
  if (matter.afterword.enabled) items.push({ label: matter.afterword.title || 'あとがき', kind: 'optional' });
  if (matter.authorProfile.enabled) items.push({ label: matter.authorProfile.title || '著者紹介', kind: 'optional' });
  if (matter.colophon.enabled) items.push({ label: matter.colophon.heading || '奥付', kind: 'optional' });

  els.bookStructureFlow.replaceChildren();
  items.forEach((item) => {
    const wrap = document.createElement('span');
    wrap.className = 'structure-flow-item';
    const chip = document.createElement('span');
    chip.className = `structure-chip ${item.kind}`;
    chip.textContent = item.label;
    wrap.appendChild(chip);
    els.bookStructureFlow.appendChild(wrap);
  });
  const optionalCount = cards.filter(([, enabled]) => enabled).length;
  els.bookStructureBadge.textContent = String(optionalCount);
  els.bookStructureSummary.textContent = `${items.length}区分 ／ 追加ページ ${optionalCount}種類`;
}


function normalizeDecorations(raw, assets = mediaAssets) {
  if (!Array.isArray(raw)) return [];
  const validMedia = new Set((assets || []).map((asset) => asset.id));
  return raw.slice(0, MAX_DECORATIONS).map((item) => ({
    id: String(item?.id || createId('decoration')),
    mediaId: String(item?.mediaId || ''),
    pageNumber: Math.max(1, Math.trunc(sanitizeNumber(item?.pageNumber, 1))),
    xMm: Math.max(0, sanitizeNumber(item?.xMm, 10)),
    yMm: Math.max(0, sanitizeNumber(item?.yMm, 10)),
    widthMm: Math.max(5, sanitizeNumber(item?.widthMm, 35)),
    opacity: Math.max(.05, Math.min(1, sanitizeNumber(item?.opacity, 1))),
    layer: item?.layer === 'back' ? 'back' : 'front',
    locked: Boolean(item?.locked),
    createdAt: String(item?.createdAt || new Date().toISOString())
  })).filter((item) => item.mediaId && (!validMedia.size || validMedia.has(item.mediaId)));
}

function findDecoration(id) {
  return decorativeItems.find((item) => item.id === id) || null;
}

function getDecorationAsset(item) {
  return item ? findMediaAsset(item.mediaId) : null;
}

function createDecorationFromMedia(mediaId) {
  const asset = findMediaAsset(mediaId);
  if (!asset) return;
  if (decorativeItems.length >= MAX_DECORATIONS) {
    showToast(`装飾画像は1プロジェクト${MAX_DECORATIONS}点までです。`);
    return;
  }
  const settings = collectSettings();
  const pageWidth = Math.max(20, sanitizeNumber(settings.pageWidth, 148));
  const pageHeight = Math.max(20, sanitizeNumber(settings.pageHeight, 210));
  const widthMm = Math.min(50, Math.max(22, pageWidth * .28));
  const heightMm = widthMm * (asset.height / Math.max(1, asset.width));
  const item = {
    id: createId('decoration'), mediaId, pageNumber: currentPreviewPage,
    xMm: Math.max(0, (pageWidth - widthMm) / 2),
    yMm: Math.max(0, (pageHeight - heightMm) / 2),
    widthMm, opacity: 1, layer: 'front', locked: false,
    createdAt: new Date().toISOString()
  };
  decorativeItems.push(item);
  selectedDecorationId = item.id;
  closeModal('mediaModal');
  markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi();
  setTimeout(() => { jumpToPage(item.pageNumber); openDecorationDetails(); }, 180);
  showToast(`「${asset.fileName}」を${item.pageNumber}ページへ装飾配置しました。`);
}

function appendDecorationsToPaper(paper, pageNumber, settings, manuscript, layer) {
  const source = Array.isArray(manuscript?.decorations) ? manuscript.decorations : [];
  const items = source.filter((item) => Number(item.pageNumber) === pageNumber && item.layer === layer);
  if (!items.length) return;
  const wrap = document.createElement('div');
  wrap.className = `decoration-layer decoration-layer-${layer}`;
  if (items.some((item) => item.id === selectedDecorationId)) wrap.classList.add('has-selected');
  wrap.dataset.layer = layer;
  items.forEach((item) => {
    const asset = findMediaAsset(item.mediaId, manuscript.media);
    if (!asset?.dataUrl) return;
    const figure = document.createElement('figure');
    figure.className = `decoration-item ${item.locked ? 'locked' : ''} ${item.id === selectedDecorationId ? 'selected' : ''}`;
    figure.dataset.decorationId = item.id;
    figure.dataset.page = String(pageNumber);
    figure.style.left = `${item.xMm}mm`;
    figure.style.top = `${item.yMm}mm`;
    figure.style.width = `${item.widthMm}mm`;
    figure.style.opacity = String(item.opacity);
    const image = document.createElement('img');
    image.src = asset.dataUrl;
    image.alt = asset.alt || asset.fileName || '装飾画像';
    image.draggable = false;
    figure.appendChild(image);
    if (item.locked) {
      const lock = document.createElement('span');
      lock.className = 'decoration-lock-mark'; lock.textContent = '固定';
      figure.appendChild(lock);
    } else {
      const handle = document.createElement('span');
      handle.className = 'decoration-resize-handle';
      handle.dataset.decorationResize = 'true';
      handle.setAttribute('aria-label', '装飾画像を拡大縮小');
      figure.appendChild(handle);
    }
    wrap.appendChild(figure);
  });
  paper.appendChild(wrap);
}

function selectDecoration(id, options = {}) {
  if (!findDecoration(id)) return;
  selectedDecorationId = id;
  els.pages.querySelectorAll('.decoration-item').forEach((element) => element.classList.toggle('selected', element.dataset.decorationId === id));
  updateDecorationUi();
  if (options.openDetails) openDecorationDetails();
}

function clearDecorationSelection() {
  if (!selectedDecorationId) return;
  selectedDecorationId = null;
  els.pages.querySelectorAll('.decoration-item').forEach((element) => element.classList.remove('selected'));
  updateDecorationUi();
}

function updateDecorationUi() {
  const item = findDecoration(selectedDecorationId);
  if (els.decorationSelectionBar) els.decorationSelectionBar.hidden = !item;
  if (els.decorationCountSummary) els.decorationCountSummary.textContent = `${decorativeItems.length}点`;
  if (els.decorationEmptyState) els.decorationEmptyState.hidden = decorativeItems.length > 0;
  if (!item) return;
  const asset = getDecorationAsset(item);
  els.selectedDecorationName.textContent = asset?.fileName || '装飾画像';
  els.selectedDecorationMeta.textContent = `${item.pageNumber}ページ・${item.layer === 'front' ? '前面' : '背面'}・幅${roundOne(item.widthMm)}mm`;
  els.decorationLockBtn.textContent = item.locked ? 'ロック解除' : 'ロック';
  els.decorationLayerBtn.textContent = item.layer === 'front' ? '背面へ' : '前面へ';
}

function renderDecorationLibrary() {
  if (!els.decorationLibraryList) return;
  els.decorationLibraryList.replaceChildren();
  decorativeItems.forEach((item) => {
    const asset = getDecorationAsset(item);
    if (!asset) return;
    const row = document.createElement('article');
    row.className = `decoration-library-row ${item.id === selectedDecorationId ? 'selected' : ''}`;
    row.dataset.decorationId = item.id;
    const thumb = document.createElement('img'); thumb.src = asset.dataUrl; thumb.alt = asset.alt || asset.fileName;
    const copy = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = asset.fileName;
    const meta = document.createElement('span'); meta.textContent = `${item.pageNumber}ページ ／ ${item.layer === 'front' ? '前面' : '背面'} ／ 幅${roundOne(item.widthMm)}mm${item.locked ? ' ／ ロック中' : ''}`;
    copy.append(title, meta);
    const actions = document.createElement('div');
    const select = document.createElement('button'); select.type='button'; select.className='button small modal-secondary'; select.dataset.decorationAction='select'; select.dataset.decorationId=item.id; select.textContent='誌面で選択';
    const detail = document.createElement('button'); detail.type='button'; detail.className='button small decoration-insert-button'; detail.dataset.decorationAction='detail'; detail.dataset.decorationId=item.id; detail.textContent='調整';
    actions.append(select, detail);
    row.append(thumb, copy, actions);
    els.decorationLibraryList.appendChild(row);
  });
  updateDecorationUi();
}

function handleDecorationLibraryClick(event) {
  const button = event.target.closest('[data-decoration-action]');
  if (!button) return;
  const item = findDecoration(button.dataset.decorationId);
  if (!item) return;
  selectedDecorationId = item.id;
  closeModal('mediaModal');
  jumpToPage(item.pageNumber);
  if (button.dataset.decorationAction === 'detail') setTimeout(openDecorationDetails, 170);
  else { updateDecorationUi(); setTimeout(() => els.pages.querySelector(`[data-decoration-id="${CSS.escape(item.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 220); }
}

function handleDecorationSelectionBarClick(event) {
  if (event.target.closest('button')) return;
  openDecorationDetails();
}

function openDecorationDetails() {
  const item = findDecoration(selectedDecorationId);
  if (!item) { showToast('調整する装飾画像を選択してください。'); return; }
  const asset = getDecorationAsset(item);
  const total = Math.max(1, els.pages.querySelectorAll('.paper').length);
  els.decorationDetailImage.src = asset?.dataUrl || '';
  els.decorationDetailImage.alt = asset?.alt || asset?.fileName || '装飾画像';
  els.decorationDetailName.textContent = asset?.fileName || '装飾画像';
  els.decorationPageNumber.max = String(total);
  els.decorationPageNumber.value = String(Math.min(total, item.pageNumber));
  els.decorationLayer.value = item.layer;
  els.decorationX.value = roundOne(item.xMm);
  els.decorationY.value = roundOne(item.yMm);
  els.decorationWidth.value = roundOne(item.widthMm);
  els.decorationOpacity.value = String(Math.round(item.opacity * 100));
  els.decorationLocked.checked = item.locked;
  openModal('decorationModal');
}

function updateSelectedDecorationFromForm() {
  const item = findDecoration(selectedDecorationId);
  if (!item || isApplyingState) return;
  const settings = collectSettings();
  const total = Math.max(1, els.pages.querySelectorAll('.paper').length);
  item.pageNumber = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(els.decorationPageNumber.value, item.pageNumber))));
  item.layer = els.decorationLayer.value === 'back' ? 'back' : 'front';
  item.widthMm = Math.max(5, Math.min(settings.pageWidth, sanitizeNumber(els.decorationWidth.value, item.widthMm)));
  const asset = getDecorationAsset(item);
  const heightMm = item.widthMm * ((asset?.height || 1) / Math.max(1, asset?.width || 1));
  item.xMm = Math.max(0, Math.min(settings.pageWidth - item.widthMm, sanitizeNumber(els.decorationX.value, item.xMm)));
  item.yMm = Math.max(0, Math.min(settings.pageHeight - heightMm, sanitizeNumber(els.decorationY.value, item.yMm)));
  item.opacity = Math.max(.05, Math.min(1, sanitizeNumber(els.decorationOpacity.value, 100) / 100));
  item.locked = Boolean(els.decorationLocked.checked);
  markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi();
}

function alignSelectedDecoration(axis) {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  const settings = collectSettings(); const asset = getDecorationAsset(item);
  const height = item.widthMm * ((asset?.height || 1) / Math.max(1, asset?.width || 1));
  if (axis === 'horizontal') item.xMm = Math.max(0, (settings.pageWidth - item.widthMm) / 2);
  if (axis === 'vertical') item.yMm = Math.max(0, (settings.pageHeight - height) / 2);
  openDecorationDetails(); markDirty(); scheduleRender(); scheduleAutosave();
}

function fitSelectedDecorationWidth(ratio) {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  const settings = collectSettings(); const asset = getDecorationAsset(item);
  item.widthMm = Math.max(5, settings.pageWidth * ratio);
  const height = item.widthMm * ((asset?.height || 1) / Math.max(1, asset?.width || 1));
  item.xMm = (settings.pageWidth - item.widthMm) / 2;
  item.yMm = Math.max(0, Math.min(settings.pageHeight - height, item.yMm));
  openDecorationDetails(); markDirty(); scheduleRender(); scheduleAutosave();
}

function toggleSelectedDecorationLock() {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  item.locked = !item.locked; markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi();
}

function toggleSelectedDecorationLayer() {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  item.layer = item.layer === 'front' ? 'back' : 'front'; markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi();
}

function duplicateSelectedDecoration() {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  if (decorativeItems.length >= MAX_DECORATIONS) { showToast(`装飾画像は${MAX_DECORATIONS}点までです。`); return; }
  const settings = collectSettings();
  const asset = getDecorationAsset(item);
  const height = item.widthMm * ((asset?.height || 1) / Math.max(1, asset?.width || 1));
  const copy = { ...deepClone(item), id: createId('decoration'), xMm: Math.max(0, Math.min(settings.pageWidth - item.widthMm, item.xMm + 5)), yMm: Math.max(0, Math.min(settings.pageHeight - height, item.yMm + 5)), locked: false, createdAt: new Date().toISOString() };
  decorativeItems.push(copy); selectedDecorationId = copy.id;
  closeModal('decorationModal'); markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi();
  showToast('装飾画像を複製しました。');
}

function deleteSelectedDecoration() {
  const item = findDecoration(selectedDecorationId); if (!item) return;
  const asset = getDecorationAsset(item);
  if (!window.confirm(`「${asset?.fileName || '装飾画像'}」の配置を削除しますか？画像素材自体は残ります。`)) return;
  decorativeItems = decorativeItems.filter((entry) => entry.id !== item.id);
  selectedDecorationId = null;
  closeModal('decorationModal'); markDirty(); scheduleRender(); scheduleAutosave(); updateDecorationUi(); renderDecorationLibrary();
}

function handleDecorationPointerDown(event) {
  const element = event.target.closest('.decoration-item[data-decoration-id]');
  if (!element) return;
  const item = findDecoration(element.dataset.decorationId); if (!item) return;
  event.preventDefault(); event.stopPropagation();
  selectDecoration(item.id, { openDetails: false });
  if (item.locked) { showToast('この装飾画像はロックされています。'); return; }
  const paper = element.closest('.paper'); if (!paper) return;
  const settings = collectSettings(); const rect = paper.getBoundingClientRect();
  decorationGesture = { id:item.id, mode:event.target.closest('[data-decoration-resize]') ? 'resize' : 'move', startX:event.clientX, startY:event.clientY, originalX:item.xMm, originalY:item.yMm, originalWidth:item.widthMm, paperRect:rect, pageWidth:settings.pageWidth, pageHeight:settings.pageHeight, pointerId:event.pointerId };
  element.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', handleDecorationPointerMove);
  window.addEventListener('pointerup', handleDecorationPointerUp, { once:true });
}

function handleDecorationPointerMove(event) {
  const gesture = decorationGesture; if (!gesture) return;
  const item = findDecoration(gesture.id); if (!item) return;
  const asset = getDecorationAsset(item);
  const dx = (event.clientX - gesture.startX) / Math.max(1, gesture.paperRect.width) * gesture.pageWidth;
  const dy = (event.clientY - gesture.startY) / Math.max(1, gesture.paperRect.height) * gesture.pageHeight;
  if (gesture.mode === 'resize') {
    item.widthMm = Math.max(5, Math.min(gesture.pageWidth - item.xMm, gesture.originalWidth + dx));
  } else {
    const height = item.widthMm * ((asset?.height || 1) / Math.max(1, asset?.width || 1));
    item.xMm = Math.max(0, Math.min(gesture.pageWidth - item.widthMm, gesture.originalX + dx));
    item.yMm = Math.max(0, Math.min(gesture.pageHeight - height, gesture.originalY + dy));
  }
  const element = els.pages.querySelector(`[data-decoration-id="${CSS.escape(item.id)}"]`);
  if (element) { element.style.left=`${item.xMm}mm`; element.style.top=`${item.yMm}mm`; element.style.width=`${item.widthMm}mm`; }
  updateDecorationUi();
}

function handleDecorationPointerUp() {
  if (!decorationGesture) return;
  decorationGesture = null; window.removeEventListener('pointermove', handleDecorationPointerMove);
  markDirty(); scheduleRender(); scheduleAutosave();
}

function roundOne(value) { return Math.round(Number(value || 0) * 10) / 10; }

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
  if (els.mediaCountBadge) els.mediaCountBadge.textContent = decorativeItems.length ? `${count}＋${decorativeItems.length}` : String(count);
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
  renderDecorationLibrary();
  updateMediaUi();
  updateDecorationUi();
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
  renderDecorationLibrary();
  updateMediaUi();
  updateDecorationUi();
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
    const decorate = document.createElement('button');
    decorate.type = 'button'; decorate.className = 'button small decoration-insert-button';
    decorate.dataset.mediaAction = 'decorate'; decorate.dataset.mediaId = asset.id; decorate.textContent = '装飾として配置';
    const locate = document.createElement('button');
    locate.type = 'button'; locate.className = 'button small modal-secondary';
    locate.dataset.mediaAction = 'locate'; locate.dataset.mediaId = asset.id; locate.textContent = '本文位置を確認';
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'button small media-delete-button';
    remove.dataset.mediaAction = 'delete'; remove.dataset.mediaId = asset.id; remove.textContent = '削除';
    actions.append(insert, decorate, locate, remove);
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
  if (button.dataset.mediaAction === 'decorate') createDecorationFromMedia(mediaId);
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
  const decorationOccurrences = decorativeItems.filter((item) => item.mediaId === mediaId).length;
  const related = [occurrences ? `本文内${occurrences}件` : '', decorationOccurrences ? `装飾配置${decorationOccurrences}件` : ''].filter(Boolean).join('・');
  const message = related
    ? `「${asset.fileName}」を削除しますか？${related}も同時に削除されます。`
    : `「${asset.fileName}」を削除しますか？`;
  if (!window.confirm(message)) return;
  mediaAssets = mediaAssets.filter((item) => item.id !== mediaId);
  decorativeItems = decorativeItems.filter((item) => item.mediaId !== mediaId);
  if (selectedDecorationId && !decorativeItems.some((item) => item.id === selectedDecorationId)) selectedDecorationId = null;
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


function maybeOpenWelcome() {
  if (safeStorageGet(WELCOME_SEEN_KEY) === 'true') return;
  safeStorageSet(WELCOME_SEEN_KEY, 'true');
  openModal('welcomeModal');
}

function openProjectSetupModal() {
  els.setupProjectName.value = '';
  els.setupBookTitle.value = '';
  els.setupAuthor.value = '';
  const first = els.projectSetupTypes.querySelector('input[value="horizontal"]');
  if (first) first.checked = true;
  updateProjectSetupSelection();
  openModal('projectSetupModal');
  setTimeout(() => els.setupProjectName.focus(), 170);
}

function updateProjectSetupSelection() {
  els.projectSetupTypes.querySelectorAll('.setup-type-card').forEach((card) => {
    const input = card.querySelector('input[type="radio"]');
    card.classList.toggle('selected', Boolean(input?.checked));
  });
}

function createProjectFromSetup() {
  const type = els.projectSetupTypes.querySelector('input[name="projectSetupType"]:checked')?.value || 'horizontal';
  saveCurrentProject(false);
  const settings = deepClone(DEFAULT_SETTINGS);
  if (type === 'vertical') {
    const preset = BUILTIN_TEMPLATES.find((item) => item.id === 'builtin-a5-vertical-literary');
    Object.assign(settings, deepClone(preset?.settings || {}));
  } else if (type === 'booklet') {
    const preset = BUILTIN_TEMPLATES.find((item) => item.id === 'builtin-a4-business');
    Object.assign(settings, deepClone(preset?.settings || {}));
  }
  const typeLabel = type === 'vertical' ? '縦書き書籍' : type === 'booklet' ? '冊子・資料' : '横書き書籍';
  const state = normalizeState({
    projectName: els.setupProjectName.value.trim() || `新規${typeLabel}`,
    manuscript: {
      title: els.setupBookTitle.value.trim(), subtitle: '', author: els.setupAuthor.value.trim(), body: '',
      paragraphs: [], chapters: [], media: [], matter: deepClone(DEFAULT_BOOK_MATTER)
    },
    paragraphOverrides: {}, settings, metadata: {}
  });
  assignNewProjectMetadata(state);
  currentProjectId = state.metadata.projectId;
  currentProjectCreatedAt = state.metadata.createdAt;
  applyState(state);
  saveCurrentProject(false);
  closeModal('projectSetupModal');
  setManuscriptEditorMode('full', { focus: true });
  updateSaveStatus('新規作成・保存済み');
  updateWorkflowGuide();
  showToast(`${typeLabel}を新しく作成しました。`);
}

function loadSampleProject() {
  saveCurrentProject(false);
  const state = normalizeState(deepClone(DEFAULT_STATE));
  state.projectName = `組版アプリ ${APP_VERSION} サンプル`;
  assignNewProjectMetadata(state);
  currentProjectId = state.metadata.projectId;
  currentProjectCreatedAt = state.metadata.createdAt;
  applyState(state);
  saveCurrentProject(false);
  closeModal('welcomeModal');
  setManuscriptEditorMode('full', { focus: false });
  updateWorkflowGuide();
  showToast('サンプル原稿を新しいプロジェクトとして開きました。');
}

function navigateWorkflow(action) {
  const target = String(action || '');
  if (target === 'manuscript') {
    setManuscriptEditorMode('full', { focus: true });
    els.manuscriptPanel?.classList.add('workflow-focus-flash');
    setTimeout(() => els.manuscriptPanel?.classList.remove('workflow-focus-flash'), 1200);
    return;
  }
  if (target === 'layout') {
    const accordion = document.querySelector('.layout-settings-accordion');
    if (accordion) accordion.open = true;
    const scroller = els.settingsPanel?.querySelector('.settings-scroll');
    if (scroller && accordion) scroller.scrollTo({ top: Math.max(0, accordion.offsetTop - 8), behavior: 'smooth' });
    setTimeout(() => els.documentLayout?.focus(), 350);
    return;
  }
  if (target === 'structure') {
    openBookStructureModal();
    return;
  }
  if (target === 'output') {
    openPreflightModal();
  }
}

function updateWorkflowGuide() {
  if (!els.workflowManuscript) return;
  const bodyText = inlineMarkupToPlainText(els.bodyInput?.value || '').replace(/\s/g, '');
  const hasManuscript = Boolean(bodyText.length || els.titleInput?.value.trim());
  const pageTotal = els.pages?.querySelectorAll('.paper').length || 0;
  const hasLayout = hasManuscript && pageTotal > 0;
  const hasStructure = hasManuscript && (chapterModel.some((item) => item.type === 'chapter') || Boolean(els.showToc?.checked));
  const hasErrors = preflightIssues.some((item) => item.severity === 'error');
  const outputReady = hasLayout && !hasErrors;
  const records = [
    [els.workflowManuscript, els.workflowManuscriptState, hasManuscript, hasManuscript ? '入力済み' : '入力する'],
    [els.workflowLayout, els.workflowLayoutState, hasLayout, hasLayout ? `${pageTotal}ページ生成` : '見た目を整える'],
    [els.workflowStructure, els.workflowStructureState, hasStructure, hasStructure ? '章構造あり' : '目次・奥付'],
    [els.workflowOutput, els.workflowOutputState, outputReady, outputReady ? 'PDF保存可能' : hasErrors ? '修正が必要' : '問題を確認']
  ];
  records.forEach(([button, label, done, text]) => {
    button?.classList.toggle('done', Boolean(done));
    if (label) label.textContent = text;
  });
  records.forEach(([button]) => button?.classList.remove('current'));
  const current = !hasManuscript ? els.workflowManuscript : !hasLayout ? els.workflowLayout : !hasStructure ? els.workflowStructure : els.workflowOutput;
  current?.classList.add('current');
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

// v019: 編集効率化（履歴・検索・移動・ページ範囲PDF）
function isTextEditingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function scheduleHistoryReset() {
  clearTimeout(historyResetTimer);
  historyResetTimer = setTimeout(resetEditHistory, 80);
}

function resetEditHistory() {
  clearTimeout(historyCaptureTimer);
  historyReady = false;
  editHistory = [];
  redoHistory = [];
  historyMediaData.clear();
  const snapshot = captureHistorySnapshot();
  const signature = historySnapshotSignature(snapshot);
  editHistory.push(snapshot);
  lastHistorySignature = signature;
  historyReady = true;
  updateHistoryButtons();
}

function scheduleHistoryCapture(delay = 520) {
  clearTimeout(historyCaptureTimer);
  historyCaptureTimer = setTimeout(captureHistoryNow, delay);
}

function captureHistoryNow() {
  clearTimeout(historyCaptureTimer);
  if (!historyReady || isApplyingState || isRestoringHistory) return false;
  const snapshot = captureHistorySnapshot();
  const signature = historySnapshotSignature(snapshot);
  if (signature === lastHistorySignature) return false;
  editHistory.push(snapshot);
  if (editHistory.length > HISTORY_LIMIT) editHistory.shift();
  redoHistory = [];
  lastHistorySignature = signature;
  updateHistoryButtons();
  return true;
}

function captureHistorySnapshot() {
  const state = collectState();
  const media = (state.manuscript.media || []).map((asset) => {
    if (asset?.id && asset.dataUrl) historyMediaData.set(asset.id, asset.dataUrl);
    const copy = { ...asset };
    delete copy.dataUrl;
    return copy;
  });
  return {
    projectName: state.projectName,
    manuscript: {
      title: state.manuscript.title,
      subtitle: state.manuscript.subtitle,
      author: state.manuscript.author,
      body: state.manuscript.body,
      paragraphs: deepClone(state.manuscript.paragraphs || []),
      chapters: deepClone(state.manuscript.chapters || []),
      media,
      decorations: deepClone(state.manuscript.decorations || []),
      matter: deepClone(state.manuscript.matter || DEFAULT_BOOK_MATTER),
      trailingBlankLines: state.manuscript.trailingBlankLines || 0
    },
    paragraphOverrides: deepClone(state.paragraphOverrides || {}),
    settings: deepClone(state.settings || DEFAULT_SETTINGS)
  };
}

function historySnapshotSignature(snapshot) {
  try {
    return JSON.stringify(snapshot);
  } catch (error) {
    console.error(error);
    return `${Date.now()}-${Math.random()}`;
  }
}

function restoreHistorySnapshot(snapshot, message) {
  if (!snapshot) return;
  const current = collectState();
  const currentMedia = new Map((current.manuscript.media || []).map((asset) => [asset.id, asset.dataUrl]));
  const media = (snapshot.manuscript.media || []).map((asset) => ({
    ...deepClone(asset),
    dataUrl: historyMediaData.get(asset.id) || currentMedia.get(asset.id) || ''
  })).filter((asset) => asset.dataUrl);
  const restored = normalizeState({
    ...current,
    projectName: snapshot.projectName,
    manuscript: {
      ...current.manuscript,
      ...deepClone(snapshot.manuscript),
      media
    },
    paragraphOverrides: deepClone(snapshot.paragraphOverrides),
    settings: deepClone(snapshot.settings)
  });
  isRestoringHistory = true;
  try {
    applyState(restored);
  } finally {
    isRestoringHistory = false;
  }
  lastHistorySignature = historySnapshotSignature(snapshot);
  updateSaveStatus('自動保存待ち');
  scheduleAutosave();
  scheduleManuscriptCheck();
  schedulePreflightCheck(300);
  updateHistoryButtons();
  showToast(message);
}

function undoEditHistory() {
  if (!historyReady) return;
  captureHistoryNow();
  if (editHistory.length <= 1) {
    showToast('これ以上戻せる編集はありません。');
    return;
  }
  const current = editHistory.pop();
  redoHistory.push(current);
  const target = editHistory[editHistory.length - 1];
  restoreHistorySnapshot(target, '直前の編集状態へ戻しました。');
}

function redoEditHistory() {
  if (!historyReady || !redoHistory.length) {
    showToast('やり直せる編集はありません。');
    return;
  }
  const target = redoHistory.pop();
  editHistory.push(target);
  restoreHistorySnapshot(target, '戻した編集をやり直しました。');
}

function updateHistoryButtons() {
  if (!els.undoBtn || !els.redoBtn) return;
  const undoCount = Math.max(0, editHistory.length - 1);
  const redoCount = redoHistory.length;
  els.undoBtn.disabled = undoCount === 0;
  els.redoBtn.disabled = redoCount === 0;
  els.undoBtn.title = undoCount ? `直前の編集状態へ戻す（残り${undoCount}段階）` : '戻せる編集はありません';
  els.redoBtn.title = redoCount ? `戻した編集をやり直す（残り${redoCount}段階）` : 'やり直せる編集はありません';
}

function openEditingToolsModal(options = {}) {
  renderDocument();
  updatePageNavigation({ preserveCurrent: true });
  renderHeadingNavigation();
  updatePdfRangeControls();
  openModal('editingToolsModal');
  if (options.focusSearch !== false) {
    setTimeout(() => {
      els.searchTextInput.focus();
      els.searchTextInput.select();
    }, 170);
  }
}

function getSearchSources() {
  const sources = [
    { id: 'bodyInput', label: '本文', element: els.bodyInput, type: 'manuscript' }
  ];
  if (els.searchScope.value !== 'all') return sources;
  return [
    { id: 'projectName', label: 'プロジェクト名', element: els.projectName, type: 'field' },
    { id: 'titleInput', label: '書名', element: els.titleInput, type: 'field' },
    { id: 'subtitleInput', label: 'サブタイトル', element: els.subtitleInput, type: 'field' },
    { id: 'authorInput', label: '著者名', element: els.authorInput, type: 'field' },
    ...sources,
    { id: 'forewordTitle', label: 'まえがき見出し', element: els.forewordTitle, type: 'matter', matterKey: 'foreword' },
    { id: 'forewordBody', label: 'まえがき', element: els.forewordBody, type: 'matter', matterKey: 'foreword' },
    { id: 'afterwordTitle', label: 'あとがき見出し', element: els.afterwordTitle, type: 'matter', matterKey: 'afterword' },
    { id: 'afterwordBody', label: 'あとがき', element: els.afterwordBody, type: 'matter', matterKey: 'afterword' },
    { id: 'authorProfileTitle', label: '著者紹介見出し', element: els.authorProfileTitle, type: 'matter', matterKey: 'authorProfile' },
    { id: 'authorProfileBody', label: '著者紹介', element: els.authorProfileBody, type: 'matter', matterKey: 'authorProfile' },
    { id: 'colophonHeading', label: '奥付見出し', element: els.colophonHeading, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonBookTitle', label: '奥付・書名', element: els.colophonBookTitle, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonAuthor', label: '奥付・著者', element: els.colophonAuthor, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonIssuedBy', label: '奥付・発行者', element: els.colophonIssuedBy, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonPublisher', label: '奥付・発行所', element: els.colophonPublisher, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonContact', label: '奥付・連絡先', element: els.colophonContact, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonCopyright', label: '奥付・著作権', element: els.colophonCopyright, type: 'matter', matterKey: 'colophon' },
    { id: 'colophonNotes', label: '奥付・備考', element: els.colophonNotes, type: 'matter', matterKey: 'colophon' }
  ];
}

function runEditingSearch(options = {}) {
  const query = String(els.searchTextInput.value || '');
  searchResults = [];
  currentSearchResultIndex = -1;
  if (!query) {
    renderSearchResults();
    return [];
  }
  const caseSensitive = els.searchCaseSensitive.checked;
  const needle = caseSensitive ? query : query.toLocaleLowerCase('ja-JP');
  getSearchSources().forEach((source) => {
    const value = String(source.element?.value || '');
    const haystack = caseSensitive ? value : value.toLocaleLowerCase('ja-JP');
    let cursor = 0;
    while (cursor <= haystack.length - needle.length && searchResults.length < 500) {
      const index = haystack.indexOf(needle, cursor);
      if (index < 0) break;
      searchResults.push({ ...source, start: index, end: index + query.length, match: value.slice(index, index + query.length), value });
      cursor = index + Math.max(1, needle.length);
    }
  });
  if (searchResults.length) currentSearchResultIndex = Math.max(0, Math.min(searchResults.length - 1, Number(options.keepIndex) || 0));
  renderSearchResults();
  return searchResults;
}

function renderSearchResults() {
  const query = String(els.searchTextInput.value || '');
  const total = searchResults.length;
  els.searchResultSummary.textContent = !query
    ? '検索語を入力してください。'
    : total
      ? `${total}件見つかりました。結果を選ぶと該当箇所へ移動します。`
      : '一致する文字は見つかりませんでした。';
  const hasResults = total > 0;
  els.previousSearchResultBtn.disabled = !hasResults;
  els.nextSearchResultBtn.disabled = !hasResults;
  els.replaceCurrentBtn.disabled = !hasResults;
  els.replaceAllBtn.disabled = !hasResults;
  els.searchResultsList.replaceChildren();
  searchResults.slice(0, 200).forEach((result, index) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `search-result-row${index === currentSearchResultIndex ? ' current' : ''}`;
    row.dataset.searchResultIndex = String(index);
    const meta = document.createElement('span');
    meta.className = 'search-result-meta';
    meta.textContent = `${result.label}・${getLineNumberAt(result.value, result.start)}行目`;
    const excerpt = document.createElement('strong');
    excerpt.textContent = buildSearchExcerpt(result.value, result.start, result.end);
    row.append(meta, excerpt);
    els.searchResultsList.appendChild(row);
  });
  if (total > 200) {
    const note = document.createElement('p');
    note.className = 'search-result-limit-note';
    note.textContent = `最初の200件を表示しています（検出${total}件）。`;
    els.searchResultsList.appendChild(note);
  }
}

function buildSearchExcerpt(value, start, end) {
  const lineStart = Math.max(0, value.lastIndexOf('\n', start - 1) + 1);
  const nextBreak = value.indexOf('\n', end);
  const lineEnd = nextBreak < 0 ? value.length : nextBreak;
  const line = value.slice(lineStart, lineEnd).trim();
  return line.length > 72 ? `${line.slice(0, 69)}…` : line || '（空行）';
}

function getLineNumberAt(value, index) {
  return String(value).slice(0, index).split('\n').length;
}

function handleSearchResultClick(event) {
  const row = event.target.closest('[data-search-result-index]');
  if (!row) return;
  currentSearchResultIndex = Number(row.dataset.searchResultIndex) || 0;
  renderSearchResults();
  focusCurrentSearchResult();
}

function navigateSearchResult(direction) {
  if (!searchResults.length) return;
  currentSearchResultIndex = (currentSearchResultIndex + direction + searchResults.length) % searchResults.length;
  renderSearchResults();
  const row = els.searchResultsList.querySelector(`[data-search-result-index="${currentSearchResultIndex}"]`);
  row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function focusCurrentSearchResult() {
  const result = searchResults[currentSearchResultIndex];
  if (!result?.element) return;
  closeModal('editingToolsModal');
  setTimeout(() => {
    if (result.type === 'manuscript') setManuscriptEditorMode('full', { focus: false });
    if (result.type === 'matter') {
      openBookStructureModal();
      requestAnimationFrame(() => {
        const card = document.querySelector(`[data-matter-card="${CSS.escape(result.matterKey || '')}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    setTimeout(() => {
      result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      result.element.focus({ preventScroll: true });
      if (typeof result.element.setSelectionRange === 'function') result.element.setSelectionRange(result.start, result.end);
      result.element.classList.add('search-target-highlight');
      setTimeout(() => result.element.classList.remove('search-target-highlight'), 1700);
    }, result.type === 'matter' ? 170 : 20);
  }, 130);
}

function replaceCurrentSearchResult() {
  const result = searchResults[currentSearchResultIndex];
  if (!result?.element) return;
  const value = String(result.element.value || '');
  const query = String(els.searchTextInput.value || '');
  const replacement = String(els.replaceTextInput.value || '');
  const actual = value.slice(result.start, result.end);
  const matches = els.searchCaseSensitive.checked
    ? actual === query
    : actual.toLocaleLowerCase('ja-JP') === query.toLocaleLowerCase('ja-JP');
  if (!matches) {
    runEditingSearch();
    showToast('原稿が変更されたため、検索結果を更新しました。');
    return;
  }
  applySearchSourceValue(result.element, `${value.slice(0, result.start)}${replacement}${value.slice(result.end)}`);
  runEditingSearch({ keepIndex: currentSearchResultIndex });
  showToast('選択した1件を置換しました。');
}

function replaceAllSearchResults() {
  const query = String(els.searchTextInput.value || '');
  if (!query || !searchResults.length) return;
  const replacement = String(els.replaceTextInput.value || '');
  if (!window.confirm(`${searchResults.length}件を「${replacement}」へ置換しますか？`)) return;
  const caseSensitive = els.searchCaseSensitive.checked;
  const sources = getSearchSources();
  let replacedCount = 0;
  sources.forEach((source) => {
    const value = String(source.element?.value || '');
    const result = replaceAllLiteral(value, query, replacement, caseSensitive);
    if (!result.count) return;
    replacedCount += result.count;
    applySearchSourceValue(source.element, result.value);
  });
  runEditingSearch();
  showToast(`${replacedCount}件を置換しました。`);
}

function replaceAllLiteral(value, query, replacement, caseSensitive) {
  if (caseSensitive) {
    const parts = value.split(query);
    return { value: parts.join(replacement), count: Math.max(0, parts.length - 1) };
  }
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'giu');
  let count = 0;
  const result = value.replace(regex, () => { count += 1; return replacement; });
  return { value: result, count };
}

function applySearchSourceValue(element, value) {
  if (!element) return;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function handlePreviewScroll() {
  clearTimeout(previewScrollTimer);
  previewScrollTimer = setTimeout(() => {
    const papers = Array.from(els.pages.querySelectorAll('.paper'));
    if (!papers.length) return;
    const viewportRect = els.previewViewport.getBoundingClientRect();
    const center = viewportRect.top + viewportRect.height / 2;
    let bestPage = currentPreviewPage;
    let bestDistance = Number.POSITIVE_INFINITY;
    papers.forEach((paper) => {
      const rect = paper.getBoundingClientRect();
      const distance = Math.abs((rect.top + rect.bottom) / 2 - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPage = Number(paper.dataset.page) || 1;
      }
    });
    currentPreviewPage = bestPage;
    updatePageNavigation({ preserveCurrent: true });
  }, 80);
}

function updatePageNavigation(options = {}) {
  const total = els.pages.querySelectorAll('.paper').length || 1;
  if (!options.preserveCurrent) currentPreviewPage = 1;
  currentPreviewPage = Math.max(1, Math.min(total, Number(currentPreviewPage) || 1));
  [els.currentPageInput, els.toolPageInput, els.pdfRangeFrom, els.pdfRangeTo].forEach((input) => {
    if (!input) return;
    input.max = String(total);
  });
  els.currentPageInput.value = String(currentPreviewPage);
  els.totalPageQuick.textContent = String(total);
  els.toolPageInput.value = String(currentPreviewPage);
  els.toolPageTotal.textContent = `/ ${total}ページ`;
  els.previousPageBtn.disabled = currentPreviewPage <= 1;
  els.nextPageBtn.disabled = currentPreviewPage >= total;
  els.toolPreviousPageBtn.disabled = currentPreviewPage <= 1;
  els.toolNextPageBtn.disabled = currentPreviewPage >= total;
  updatePdfRangeControls();
}

function jumpToPage(value) {
  const total = els.pages.querySelectorAll('.paper').length || 1;
  const page = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(value, currentPreviewPage))));
  currentPreviewPage = page;
  const paper = els.pages.querySelector(`.paper[data-page="${page}"]`);
  if (!els.editingToolsModal.hidden) closeModal('editingToolsModal');
  setTimeout(() => {
    paper?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    paper?.classList.add('page-jump-highlight');
    setTimeout(() => paper?.classList.remove('page-jump-highlight'), 1300);
    updatePageNavigation({ preserveCurrent: true });
  }, 130);
}

function getHeadingNavigationItems() {
  const items = [];
  els.pages.querySelectorAll('.paper').forEach((paper) => {
    paper.querySelectorAll('.body-heading[data-block-id]').forEach((heading) => {
      const id = heading.dataset.blockId;
      if (items.some((item) => item.id === id)) return;
      items.push({
        id,
        level: Number(heading.dataset.headingLevel) || 1,
        text: heading.textContent.trim(),
        page: Number(paper.dataset.page) || 1
      });
    });
  });
  return items;
}

function renderHeadingNavigation() {
  const items = getHeadingNavigationItems();
  els.headingNavigationSummary.textContent = `${items.length}件`;
  els.headingNavigationList.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'heading-navigation-empty';
    empty.innerHTML = '<strong>見出しがありません</strong><span>本文で「# 見出し」を入力すると、ここから移動できます。</span>';
    els.headingNavigationList.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = `heading-navigation-row level-${item.level}`;
    const copy = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'heading-level-badge';
    badge.textContent = item.level === 1 ? '大' : item.level === 2 ? '中' : '小';
    const title = document.createElement('strong');
    title.textContent = item.text || '名称未設定の見出し';
    const page = document.createElement('span');
    page.className = 'heading-page-label';
    page.textContent = `${item.page}ページ`;
    copy.append(badge, title, page);
    const actions = document.createElement('div');
    actions.className = 'heading-navigation-actions';
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'button modal-secondary';
    previewButton.dataset.headingNavigate = 'preview';
    previewButton.dataset.headingId = item.id;
    previewButton.dataset.page = String(item.page);
    previewButton.textContent = '誌面へ';
    const sourceButton = document.createElement('button');
    sourceButton.type = 'button';
    sourceButton.className = 'button modal-secondary';
    sourceButton.dataset.headingNavigate = 'source';
    sourceButton.dataset.headingId = item.id;
    sourceButton.textContent = '原稿へ';
    actions.append(previewButton, sourceButton);
    row.append(copy, actions);
    els.headingNavigationList.appendChild(row);
  });
}

function handleHeadingNavigationClick(event) {
  const button = event.target.closest('[data-heading-navigate]');
  if (!button) return;
  const id = button.dataset.headingId;
  if (button.dataset.headingNavigate === 'preview') {
    const page = Number(button.dataset.page) || 1;
    closeModal('editingToolsModal');
    setTimeout(() => {
      jumpToPage(page);
      const target = els.pages.querySelector(`.body-heading[data-block-id="${CSS.escape(id)}"]`);
      setTimeout(() => {
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.classList.add('search-target-highlight');
        setTimeout(() => target?.classList.remove('search-target-highlight'), 1600);
      }, 220);
    }, 120);
    return;
  }
  navigateHeadingToSource(id);
}

function navigateHeadingToSource(id) {
  const record = paragraphRecords.find((item) => item.id === id && item.type === 'heading');
  if (!record) return;
  const prefix = '#'.repeat(Math.max(1, Math.min(3, Number(record.level) || 1)));
  const line = `${prefix} ${record.text}`;
  const value = els.bodyInput.value;
  let index = value.indexOf(line);
  if (index < 0) index = value.indexOf(String(record.text || ''));
  closeModal('editingToolsModal');
  setTimeout(() => {
    setManuscriptEditorMode('full', { focus: false });
    els.bodyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    els.bodyInput.focus({ preventScroll: true });
    if (index >= 0) els.bodyInput.setSelectionRange(index, index + (line.length || record.text.length));
    els.bodyInput.classList.add('search-target-highlight');
    setTimeout(() => els.bodyInput.classList.remove('search-target-highlight'), 1600);
  }, 140);
}

function updatePdfRangeControls() {
  if (!els.pdfRangeInputs) return;
  const total = els.pages.querySelectorAll('.paper').length || 1;
  const mode = document.querySelector('input[name="pdfRangeMode"]:checked')?.value || 'all';
  els.pdfRangeInputs.hidden = mode !== 'range';
  let from = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(els.pdfRangeFrom.value, 1))));
  let to = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(els.pdfRangeTo.value, total))));
  if (!els.pdfRangeTo.dataset.initialized) {
    to = total;
    els.pdfRangeTo.dataset.initialized = 'true';
  }
  els.pdfRangeFrom.value = String(from);
  els.pdfRangeTo.value = String(to);
  els.pdfRangeSummary.textContent = mode === 'all'
    ? `全${total}ページを保存します。`
    : `${Math.min(from, to)}～${Math.max(from, to)}ページ（${Math.abs(to - from) + 1}ページ）を保存します。`;
}

function normalizePdfRange(range, total) {
  if (!range || range.mode === 'all') return { from: 1, to: total };
  let from = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(range.from, 1))));
  let to = Math.max(1, Math.min(total, Math.trunc(sanitizeNumber(range.to, total))));
  if (from > to) [from, to] = [to, from];
  return { from, to };
}

async function saveSelectedPdfRange() {
  renderDocument();
  await waitForFrames(2);
  const issues = runPreflightCheck({ announce: false });
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  if (errors) {
    closeModal('editingToolsModal');
    setTimeout(() => openModal('preflightModal'), 140);
    showToast(`PDF保存前に修正が必要なエラーが${errors}件あります。`);
    return;
  }
  const mode = document.querySelector('input[name="pdfRangeMode"]:checked')?.value || 'all';
  const range = normalizePdfRange({ mode, from: els.pdfRangeFrom.value, to: els.pdfRangeTo.value }, els.pages.querySelectorAll('.paper').length || 1);
  closeModal('editingToolsModal');
  await new Promise((resolve) => setTimeout(resolve, 150));
  await exportPdf(range);
}
