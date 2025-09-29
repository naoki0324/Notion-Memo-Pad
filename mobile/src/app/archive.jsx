import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  RotateCcw,
  Trash2,
  Archive as ArchiveIcon,
} from "lucide-react-native";
import { router } from "expo-router";

export default function Archive() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Fetch archived memo pads
  const {
    data: archivedMemoPads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["archived-memo-pads"],
    queryFn: async () => {
      const response = await fetch("/api/memo-pads/archive");
      if (!response.ok) {
        throw new Error("Failed to fetch archived memo pads");
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Restore memo mutation
  const restoreMemoMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/memo-pads/archive/${id}/restore`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to restore memo pad");
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-memo-pads"] });
      queryClient.invalidateQueries({ queryKey: ["memo-pads"] });
      Alert.alert("成功", "メモが復元されました");
    },
    onError: () => {
      Alert.alert("エラー", "メモの復元に失敗しました");
    },
  });

  // Clean up old archived items
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/memo-pads/archive", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cleanup old archived items");
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["archived-memo-pads"] });
      Alert.alert("成功", result.message);
    },
    onError: () => {
      Alert.alert("エラー", "古いアーカイブの削除に失敗しました");
    },
  });

  const handleRestore = (id) => {
    Alert.alert("メモを復元", "このメモを復元しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "復元",
        onPress: () => restoreMemoMutation.mutate(id),
      },
    ]);
  };

  const handleCleanupOld = () => {
    Alert.alert(
      "全アーカイブを削除",
      "全てのアーカイブアイテムを永久削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => cleanupMutation.mutate(),
        },
      ],
    );
  };

  const getFirstLine = (content) => {
    const firstLine = content.split("\n")[0]?.trim();
    if (!firstLine) return "無題";

    // Strip markdown formatting for clean title display
    let cleanLine = firstLine;

    // Remove heading markers
    cleanLine = cleanLine.replace(/^#{1,3}\s+/, "");

    // Convert bullet points from - to •
    cleanLine = cleanLine.replace(/^-\s+/, "• ");

    return cleanLine || "無題";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysLeft = (deletedAt) => {
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffInDays = Math.ceil((now - deletedDate) / (1000 * 60 * 60 * 24));
    const daysLeft = 10 - diffInDays;
    return Math.max(0, daysLeft);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingTop: insets.top,
      }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                padding: 8,
                borderRadius: 8,
              }}
            >
              <ArrowLeft size={24} color="#111318" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#111318",
              }}
            >
              アーカイブ
            </Text>
          </View>

          {archivedMemoPads.length > 0 && (
            <TouchableOpacity
              onPress={handleCleanupOld}
              style={{
                backgroundColor: "#FEF2F2",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}
              >
                全削除
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 100,
            }}
          >
            <ArchiveIcon size={48} color="#9CA3AF" />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "600",
                color: "#111318",
              }}
            >
              アーカイブを読み込み中...
            </Text>
          </View>
        ) : error || archivedMemoPads.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 40,
              paddingTop: 100,
            }}
          >
            <ArchiveIcon size={64} color="#9CA3AF" />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#111318",
                marginTop: 20,
                marginBottom: 12,
              }}
            >
              アーカイブは空です
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 24,
              }}
            >
              削除されたメモがここに表示されます。削除されたメモは10日後に自動的に永久削除されます。
            </Text>
          </View>
        ) : (
          <View style={{ padding: 20 }}>
            {archivedMemoPads.map((memo) => {
              const daysLeft = getDaysLeft(memo.deleted_at);
              return (
                <View
                  key={memo.id}
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <FileText size={20} color="#6B7280" />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#111318",
                        marginLeft: 8,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {getFirstLine(memo.content)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      marginBottom: 8,
                    }}
                  >
                    削除日: {formatDate(memo.deleted_at)}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: daysLeft <= 2 ? "#FEE2E2" : "#FEF3C7",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: daysLeft <= 2 ? "#DC2626" : "#D97706",
                        }}
                      >
                        あと{daysLeft}日で削除
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRestore(memo.id)}
                      disabled={restoreMemoMutation.isLoading}
                      style={{
                        backgroundColor: "#0070FF",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        opacity: restoreMemoMutation.isLoading ? 0.6 : 1,
                      }}
                    >
                      <RotateCcw size={16} color="#FFFFFF" />
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        復元
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
