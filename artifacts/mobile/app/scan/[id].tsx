import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");
const THUMB_W = 72;
const THUMB_H = 96;

export default function ScanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getDocument, addPage, removePage, movePage, deleteDocument, renameDocument } =
    useDocuments();

  const [exporting, setExporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const nameRef = useRef<TextInput>(null);

  const doc = getDocument(id ?? "");

  const handleAddPage = useCallback(() => {
    Alert.alert("Add Pages", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Camera access is required.");
            return;
          }
          setAdding(true);
          try {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.92,
            });
            if (!result.canceled) {
              await addPage(id!, result.assets[0].uri);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          } finally {
            setAdding(false);
          }
        },
      },
      {
        text: "From Gallery",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Gallery access is required.");
            return;
          }
          setAdding(true);
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.92,
              allowsMultipleSelection: true,
              selectionLimit: 30,
            });
            if (!result.canceled) {
              for (const asset of result.assets) {
                await addPage(id!, asset.uri);
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          } finally {
            setAdding(false);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [id, addPage]);

  const handleDeletePage = useCallback(
    (index: number) => {
      Alert.alert("Remove Page", "Remove this page from the scan?", [
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removePage(id!, index);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [id, removePage]
  );

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index === 0) return;
      await movePage(id!, index, index - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [id, movePage]
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (!doc || index >= doc.pages.length - 1) return;
      await movePage(id!, index, index + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [id, movePage, doc]
  );

  const handleExportPDF = useCallback(async () => {
    if (!doc || doc.pages.length === 0) {
      Alert.alert("No pages", "Add at least one page before exporting.");
      return;
    }

    setExporting(true);
    try {
      const base64Images = await Promise.all(
        doc.pages.map(async (uri) => {
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return `data:image/jpeg;base64,${b64}`;
        })
      );

      const pageHtml = base64Images
        .map(
          (b64, i) => `
        <div style="
          width:210mm;height:297mm;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;background:#fff;
          page-break-after:${i < base64Images.length - 1 ? "always" : "avoid"};
        ">
          <img src="${b64}" style="max-width:100%;max-height:100%;object-fit:contain;" />
        </div>`
        )
        .join("");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}</style>
        </head><body>${pageHtml}</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const safeName = (doc.name || "scan").replace(/[^a-z0-9]/gi, "_");
      const finalUri = (FileSystem.cacheDirectory ?? "") + safeName + ".pdf";
      await FileSystem.copyAsync({ from: uri, to: finalUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(finalUri, {
          mimeType: "application/pdf",
          dialogTitle: `Share ${doc.name}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF Exported", "PDF saved to: " + finalUri);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Export Failed", "Could not generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [doc]);

  const handleDeleteDoc = useCallback(() => {
    Alert.alert(
      "Delete Scan",
      `Delete "${doc?.name}"? This cannot be undone.`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDocument(id!);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [id, deleteDocument, doc]);

  const startRename = useCallback(() => {
    setNameInput(doc?.name ?? "");
    setEditingName(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  }, [doc]);

  const finishRename = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== doc?.name) {
      await renameDocument(id!, trimmed);
    }
    setEditingName(false);
  }, [nameInput, id, renameDocument, doc]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!doc) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Document not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.titleWrap} onPress={startRename}>
          {editingName ? (
            <TextInput
              ref={nameRef}
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={finishRename}
              onBlur={finishRename}
              returnKeyType="done"
              selectTextOnFocus
            />
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {doc.name}
              </Text>
              <Feather name="edit-2" size={13} color="rgba(255,255,255,0.7)" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerBtn} onPress={handleDeleteDoc}>
          <Feather name="trash-2" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Subheader */}
      <View
        style={[
          styles.subheader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.subheaderText, { color: colors.mutedForeground }]}>
          {doc.pages.length === 0
            ? "No pages yet — add some below"
            : `${doc.pages.length} ${doc.pages.length === 1 ? "page" : "pages"} · Long-press image to preview`}
        </Text>
      </View>

      {/* Pages list */}
      {doc.pages.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[styles.emptyIconWrap, { backgroundColor: colors.accent }]}
          >
            <Feather name="file-plus" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No pages yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Add pages by tapping "Add Page" below
          </Text>
        </View>
      ) : (
        <FlatList
          data={doc.pages}
          keyExtractor={(item, index) => `${item}_${index}`}
          contentContainerStyle={[
            styles.pageList,
            {
              paddingBottom:
                (Platform.OS === "web" ? 34 : insets.bottom) + 130,
            },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onLongPress={() => setPreviewUri(item)}
              delayLongPress={300}
            >
              <View
                style={[
                  styles.pageRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Page number */}
                <View
                  style={[
                    styles.pageNumBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.pageNumText}>{index + 1}</Text>
                </View>

                {/* Thumbnail */}
                <Image
                  source={{ uri: item }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={150}
                />

                {/* Actions */}
                <View style={styles.pageActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.secondary,
                        opacity: index === 0 ? 0.35 : 1,
                      },
                    ]}
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <Feather
                      name="chevron-up"
                      size={18}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.secondary,
                        opacity:
                          index === doc.pages.length - 1 ? 0.35 : 1,
                      },
                    ]}
                    onPress={() => handleMoveDown(index)}
                    disabled={index === doc.pages.length - 1}
                  >
                    <Feather
                      name="chevron-down"
                      size={18}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: "#fef2f2" },
                    ]}
                    onPress={() => handleDeletePage(index)}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom:
              (Platform.OS === "web" ? 34 : insets.bottom) + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addBtn,
            { borderColor: colors.primary, backgroundColor: colors.accent },
          ]}
          onPress={handleAddPage}
          disabled={adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Feather name="plus" size={18} color={colors.primary} />
              <Text style={[styles.addBtnTxt, { color: colors.primary }]}>
                Add Page
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.exportBtn,
            {
              backgroundColor:
                doc.pages.length === 0 ? colors.muted : colors.primary,
            },
          ]}
          onPress={handleExportPDF}
          disabled={exporting || doc.pages.length === 0}
          activeOpacity={0.85}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="upload" size={18} color="#fff" />
              <Text style={styles.exportBtnTxt}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Full-screen preview modal */}
      <Modal
        visible={!!previewUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewUri(null)}
        >
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              contentFit="contain"
            />
          )}
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewUri(null)}
          >
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  nameInput: {
    fontSize: 16,
    color: "#fff",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(255,255,255,0.6)",
    paddingVertical: 4,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    minWidth: 140,
  },

  subheader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subheaderText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },

  pageList: { padding: 16 },
  pageRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  pageNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  pageNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
  },
  pageActions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  addBtnTxt: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  exportBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 50,
    borderRadius: 14,
  },
  exportBtnTxt: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },

  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: width,
    height: height * 0.85,
  },
  previewClose: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
