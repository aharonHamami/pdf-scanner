import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanDocument, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const THUMB_HEIGHT = CARD_WIDTH * 1.35;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { documents, loading, createDocument, addPage, deleteDocument } =
    useDocuments();
  const [creating, setCreating] = useState(false);

  const pickImages = useCallback(
    async (source: "camera" | "gallery") => {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Camera Permission",
            "Camera access is required to scan documents.",
            [{ text: "OK" }]
          );
          return null;
        }
        return ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.92,
          allowsEditing: false,
        });
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Gallery Permission",
            "Gallery access is required to import photos.",
            [{ text: "OK" }]
          );
          return null;
        }
        return ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.92,
          allowsMultipleSelection: true,
          selectionLimit: 30,
        });
      }
    },
    []
  );

  const handleNewScan = useCallback(() => {
    Alert.alert("New Scan", "How would you like to add pages?", [
      {
        text: "Camera",
        onPress: async () => {
          setCreating(true);
          try {
            const result = await pickImages("camera");
            if (!result || result.canceled || result.assets.length === 0) return;
            const doc = await createDocument();
            await addPage(doc.id, result.assets[0].uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push(`/scan/${doc.id}`);
          } catch (e) {
            Alert.alert("Error", "Failed to start scan. Please try again.");
          } finally {
            setCreating(false);
          }
        },
      },
      {
        text: "From Gallery",
        onPress: async () => {
          setCreating(true);
          try {
            const result = await pickImages("gallery");
            if (!result || result.canceled || result.assets.length === 0) return;
            const doc = await createDocument();
            for (const asset of result.assets) {
              await addPage(doc.id, asset.uri);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push(`/scan/${doc.id}`);
          } catch (e) {
            Alert.alert("Error", "Failed to import photos. Please try again.");
          } finally {
            setCreating(false);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [createDocument, addPage, pickImages]);

  const handleOpenDoc = useCallback((doc: ScanDocument) => {
    Haptics.selectionAsync();
    router.push(`/scan/${doc.id}`);
  }, []);

  const handleDeleteDoc = useCallback(
    (doc: ScanDocument) => {
      Alert.alert("Delete Scan", `Delete "${doc.name}"? This cannot be undone.`, [
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDocument(doc.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [deleteDocument]
  );

  const renderDocument = ({ item }: { item: ScanDocument }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          width: CARD_WIDTH,
        },
      ]}
      onPress={() => handleOpenDoc(item)}
      onLongPress={() => handleDeleteDoc(item)}
      activeOpacity={0.75}
      delayLongPress={500}
    >
      {item.pages.length > 0 ? (
        <Image
          source={{ uri: item.pages[0] }}
          style={[styles.thumbnail, { height: THUMB_HEIGHT }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.emptyThumb,
            { height: THUMB_HEIGHT, backgroundColor: colors.muted },
          ]}
        >
          <Feather name="file-text" size={36} color={colors.mutedForeground} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text
          style={[
            styles.cardName,
            { color: colors.foreground },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {item.pages.length} {item.pages.length === 1 ? "page" : "pages"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const topPad =
    Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <View style={styles.headerIcon}>
          <Feather name="file-text" size={22} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>PDF Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* List */}
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <View
            style={[styles.emptyIconWrap, { backgroundColor: colors.accent }]}
          >
            <Feather name="camera" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No documents yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Tap the + button to scan your first document
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          numColumns={2}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                (Platform.OS === "web" ? 34 : insets.bottom) + 110,
            },
          ]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom:
              (Platform.OS === "web" ? 34 : insets.bottom) + 24,
          },
        ]}
        onPress={handleNewScan}
        disabled={creating}
        activeOpacity={0.85}
      >
        {creating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="plus" size={30} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  list: { padding: 16 },
  row: { gap: 16, marginBottom: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  thumbnail: { width: "100%" },
  emptyThumb: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { padding: 10 },
  cardName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptySub: {
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});
