import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Archive, Trash2, HelpCircle } from "lucide-react-native";
import { router } from "expo-router";

export default function Settings() {
  const insets = useSafeAreaInsets();

  const handleOpenArchive = () => {
    router.push("/archive");
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
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#111318",
          }}
        >
          設定
        </Text>
      </View>

      {/* Settings Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Usage Guide Section */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111318",
              marginBottom: 16,
            }}
          >
            使い方
          </Text>

          <View
            style={{
              backgroundColor: "#EFF6FF",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#DBEAFE",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <HelpCircle size={20} color="#2563EB" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1E40AF",
                }}
              >
                基本操作
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: "#1E40AF",
                lineHeight: 20,
                marginBottom: 8,
              }}
            >
              • 中央をタップして編集を開始{"\n"}•
              左右の青いボタンをタップしてメモ切り替え{"\n"}•
              中央を左右にスワイプしてメモ切り替え{"\n"}•
              編集中は「完了」ボタンで編集を終了
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#F0FDF4",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#BBF7D0",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#15803D",
                marginBottom: 8,
              }}
            >
              Markdown記法
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#15803D",
                lineHeight: 20,
              }}
            >
              # 大見出し{"\n"}## 中見出し{"\n"}**太字** や *斜体*{"\n"}`コード`
              や ~~取り消し線~~{"\n"}&gt; 引用テキスト{"\n"}--- (区切り線)
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#FEFCE8",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#FEF08A",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#CA8A04",
                marginBottom: 8,
              }}
            >
              その他の機能
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#CA8A04",
                lineHeight: 20,
              }}
            >
              • メモは自動保存されます{"\n"}• 「-
              」で始まる行でEnterを押すと箇条書きが継続{"\n"}•
              コピーボタンでメモをクリップボードにコピー{"\n"}•
              ゴミ箱ボタンでメモを削除（アーカイブに移動）
            </Text>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111318",
              marginBottom: 16,
            }}
          >
            データ管理
          </Text>

          <TouchableOpacity
            onPress={handleOpenArchive}
            style={{
              backgroundColor: "#F9FAFB",
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Archive size={24} color="#6B7280" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111318",
                  marginBottom: 4,
                }}
              >
                アーカイブ
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                }}
              >
                削除したメモを確認・復元できます
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Section */}
          <View
            style={{
              backgroundColor: "#FEF3C7",
              padding: 16,
              borderRadius: 12,
              marginTop: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Trash2 size={20} color="#D97706" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#92400E",
                }}
              >
                自動削除について
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: "#92400E",
                lineHeight: 20,
              }}
            >
              アーカイブ内のメモは10日後に自動的に永久削除されます。重要なメモは早めに復元してください。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
