export type Language = "en" | "he";

export interface Translations {
  appName: string;
  settings: string;
  language: string;
  english: string;
  hebrew: string;
  version: string;
  restartRequired: string;
  restartRequiredMessage: string;
  ok: string;
  noDocumentsYet: string;
  tapToScan: string;
  newScan: string;
  howToAdd: string;
  camera: string;
  fromGallery: string;
  cancel: string;
  error: string;
  failedToScan: string;
  failedToImport: string;
  deleteScan: string;
  deleteDocMessage: (name: string) => string;
  delete: string;
  pagesCount: (n: number) => string;
  addPage: string;
  exportPDF: string;
  noPages: string;
  noPagesYet: string;
  addPagesBeforeExporting: string;
  addPageHint: string;
  noScanHint: string;
  longPressHint: (n: number) => string;
  chooseSource: string;
  cameraPermission: string;
  cameraPermissionMessage: string;
  galleryPermission: string;
  galleryPermissionMessage: string;
  removePageTitle: string;
  removePageMessage: string;
  remove: string;
  exportFailed: string;
  exportFailedMessage: string;
  shareDoc: (name: string) => string;
  pdfExported: string;
  documentNotFound: string;
}

const en: Translations = {
  appName: "PDF Scanner",
  settings: "Settings",
  language: "Language",
  english: "English",
  hebrew: "עברית (Hebrew)",
  version: "Version",
  restartRequired: "Restart Required",
  restartRequiredMessage:
    "Close and reopen the app to fully apply the language change.",
  ok: "OK",
  noDocumentsYet: "No documents yet",
  tapToScan: "Tap the + button to scan your first document",
  newScan: "New Scan",
  howToAdd: "How would you like to add pages?",
  camera: "Camera",
  fromGallery: "From Gallery",
  cancel: "Cancel",
  error: "Error",
  failedToScan: "Failed to start scan. Please try again.",
  failedToImport: "Failed to import photos. Please try again.",
  deleteScan: "Delete Scan",
  deleteDocMessage: (name) => `Delete "${name}"? This cannot be undone.`,
  delete: "Delete",
  pagesCount: (n) => `${n} ${n === 1 ? "page" : "pages"}`,
  addPage: "Add Page",
  exportPDF: "Export PDF",
  noPages: "No pages",
  noPagesYet: "No pages yet",
  addPagesBeforeExporting: "Add at least one page before exporting.",
  addPageHint: 'Add pages by tapping "Add Page" below',
  noScanHint: "No pages yet — add some below",
  longPressHint: (n) =>
    `${n} ${n === 1 ? "page" : "pages"} · Long-press to preview`,
  chooseSource: "Choose a source",
  cameraPermission: "Camera Permission",
  cameraPermissionMessage: "Camera access is required to scan documents.",
  galleryPermission: "Gallery Permission",
  galleryPermissionMessage: "Gallery access is required to import photos.",
  removePageTitle: "Remove Page",
  removePageMessage: "Remove this page from the scan?",
  remove: "Remove",
  exportFailed: "Export Failed",
  exportFailedMessage: "Could not generate PDF. Please try again.",
  shareDoc: (name) => `Share ${name}`,
  pdfExported: "PDF Exported",
  documentNotFound: "Document not found",
};

const he: Translations = {
  appName: "סורק PDF",
  settings: "הגדרות",
  language: "שפה",
  english: "English",
  hebrew: "עברית",
  version: "גרסה",
  restartRequired: "נדרשת הפעלה מחדש",
  restartRequiredMessage:
    "סגור ופתח את האפליקציה מחדש להחלת שינוי השפה במלואו.",
  ok: "אישור",
  noDocumentsYet: "אין מסמכים עדיין",
  tapToScan: "לחץ על כפתור + כדי לסרוק את המסמך הראשון שלך",
  newScan: "סריקה חדשה",
  howToAdd: "כיצד תרצה להוסיף עמודים?",
  camera: "מצלמה",
  fromGallery: "מהגלריה",
  cancel: "ביטול",
  error: "שגיאה",
  failedToScan: "הסריקה נכשלה. נסה שוב.",
  failedToImport: "ייבוא התמונות נכשל. נסה שוב.",
  deleteScan: "מחק סריקה",
  deleteDocMessage: (name) => `למחוק את "${name}"? לא ניתן לבטל.`,
  delete: "מחק",
  pagesCount: (n) => `${n} ${n === 1 ? "עמוד" : "עמודים"}`,
  addPage: "הוסף עמוד",
  exportPDF: "יצא PDF",
  noPages: "אין עמודים",
  noPagesYet: "אין עמודים עדיין",
  addPagesBeforeExporting: "הוסף לפחות עמוד אחד לפני הייצוא.",
  addPageHint: 'הוסף עמודים על ידי לחיצה על "הוסף עמוד" למטה',
  noScanHint: "אין עמודים עדיין — הוסף למטה",
  longPressHint: (n) =>
    `${n} ${n === 1 ? "עמוד" : "עמודים"} · לחיצה ארוכה לתצוגה מקדימה`,
  chooseSource: "בחר מקור",
  cameraPermission: "הרשאת מצלמה",
  cameraPermissionMessage: "נדרשת גישה למצלמה לסריקת מסמכים.",
  galleryPermission: "הרשאת גלריה",
  galleryPermissionMessage: "נדרשת גישה לגלריה לייבוא תמונות.",
  removePageTitle: "הסר עמוד",
  removePageMessage: "להסיר עמוד זה מהסריקה?",
  remove: "הסר",
  exportFailed: "הייצוא נכשל",
  exportFailedMessage: "לא ניתן ליצור PDF. נסה שוב.",
  shareDoc: (name) => `שתף את ${name}`,
  pdfExported: "PDF יוצא",
  documentNotFound: "המסמך לא נמצא",
};

export const translations: Record<Language, Translations> = { en, he };
