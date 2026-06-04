import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface ScanDocument {
  id: string;
  name: string;
  pages: string[];
  createdAt: number;
}

interface DocumentContextValue {
  documents: ScanDocument[];
  loading: boolean;
  createDocument: () => Promise<ScanDocument>;
  addPage: (docId: string, imageUri: string) => Promise<void>;
  removePage: (docId: string, pageIndex: number) => Promise<void>;
  movePage: (docId: string, from: number, to: number) => Promise<void>;
  renameDocument: (docId: string, name: string) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  getDocument: (docId: string) => ScanDocument | undefined;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

const STORAGE_KEY = "@pdf_scanner_documents_v1";
const SCANS_DIR = (FileSystem.documentDirectory ?? "") + "scans/";

async function persistDocuments(docs: ScanDocument[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<ScanDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setDocuments(JSON.parse(json));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const updateDocs = useCallback(
    async (updater: (prev: ScanDocument[]) => ScanDocument[]) => {
      setDocuments((prev) => {
        const next = updater(prev);
        persistDocuments(next).catch(() => {});
        return next;
      });
    },
    []
  );

  const createDocument = useCallback(async (): Promise<ScanDocument> => {
    const id =
      Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const name = `Scan ${now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
    const doc: ScanDocument = { id, name, pages: [], createdAt: Date.now() };
    await updateDocs((prev) => [doc, ...prev]);
    return doc;
  }, [updateDocs]);

  const addPage = useCallback(
    async (docId: string, imageUri: string) => {
      const pageId =
        Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const dirPath = SCANS_DIR + docId + "/";
      try {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      } catch {}
      const destPath = dirPath + pageId + ".jpg";
      await FileSystem.copyAsync({ from: imageUri, to: destPath });
      await updateDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, pages: [...d.pages, destPath] } : d
        )
      );
    },
    [updateDocs]
  );

  const removePage = useCallback(
    async (docId: string, pageIndex: number) => {
      setDocuments((prev) => {
        const doc = prev.find((d) => d.id === docId);
        if (!doc) return prev;
        const pageUri = doc.pages[pageIndex];
        FileSystem.deleteAsync(pageUri, { idempotent: true }).catch(() => {});
        const next = prev.map((d) =>
          d.id === docId
            ? { ...d, pages: d.pages.filter((_, i) => i !== pageIndex) }
            : d
        );
        persistDocuments(next).catch(() => {});
        return next;
      });
    },
    []
  );

  const movePage = useCallback(
    async (docId: string, from: number, to: number) => {
      await updateDocs((prev) =>
        prev.map((d) => {
          if (d.id !== docId) return d;
          const pages = [...d.pages];
          const [moved] = pages.splice(from, 1);
          pages.splice(to, 0, moved);
          return { ...d, pages };
        })
      );
    },
    [updateDocs]
  );

  const renameDocument = useCallback(
    async (docId: string, name: string) => {
      await updateDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, name } : d))
      );
    },
    [updateDocs]
  );

  const deleteDocument = useCallback(
    async (docId: string) => {
      const dirPath = SCANS_DIR + docId + "/";
      FileSystem.deleteAsync(dirPath, { idempotent: true }).catch(() => {});
      await updateDocs((prev) => prev.filter((d) => d.id !== docId));
    },
    [updateDocs]
  );

  const getDocument = useCallback(
    (docId: string) => documents.find((d) => d.id === docId),
    [documents]
  );

  return (
    <DocumentContext.Provider
      value={{
        documents,
        loading,
        createDocument,
        addPage,
        removePage,
        movePage,
        renameDocument,
        deleteDocument,
        getDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}
