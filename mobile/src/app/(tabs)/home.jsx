import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  PanGestureHandler,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import {
  Gesture,
  GestureDetector,
  Directions,
  State,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import MarkdownText from "@/components/MarkdownText";
import * as Clipboard from "expo-clipboard";

const { width: screenWidth } = Dimensions.get("window");

const STORAGE_KEY = "notion_memo_pads";

export default function NotionMemoMobile() {
  const insets = useSafeAreaInsets();

  const [memoPads, setMemoPads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editorContent, setEditorContent] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const textInputRef = useRef(null);

  const translateX = useSharedValue(0);
  const isSwipeInProgress = useSharedValue(false);

  // Load memos from storage
  const loadMemos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const memos = stored ? JSON.parse(stored) : [];
      setMemoPads(memos);
      setIsLoading(false);

      // Load first memo content if available
      if (memos.length > 0) {
        setEditorContent(memos[0].content);
      }
    } catch (error) {
      console.error("Error loading memos:", error);
      setIsLoading(false);
    }
  };

  // Save memos to storage
  const saveMemos = async (memos) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
    } catch (error) {
      console.error("Error saving memos:", error);
      Alert.alert("エラー", "メモの保存に失敗しました");
    }
  };

  // Load memos on component mount
  useEffect(() => {
    loadMemos();
  }, []);

  const currentMemo = memoPads[currentIndex];

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (currentMemo && editorContent !== currentMemo.content) {
      const updatedMemos = [...memoPads];
      updatedMemos[currentIndex] = {
        ...currentMemo,
        content: editorContent,
        title: getFirstLine(editorContent),
        updated_at: new Date().toISOString(),
      };
      setMemoPads(updatedMemos);
      saveMemos(updatedMemos);
    }
  }, [currentMemo, editorContent, memoPads, currentIndex]);

  // Set up auto-save with debouncing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(autoSave, 500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editorContent]);

  // Load current memo content into editor - but preserve editing state
  useEffect(() => {
    if (currentMemo) {
      setEditorContent(currentMemo.content);
      // Don't automatically set isEditing to false when switching memos
    }
  }, [currentMemo]);

  const navigateToMemo = useCallback(
    (direction) => {
      if (isSwipeInProgress.value) return;

      // Save current memo before navigating
      if (currentMemo && editorContent !== currentMemo.content) {
        const updatedMemos = [...memoPads];
        updatedMemos[currentIndex] = {
          ...currentMemo,
          content: editorContent,
          title: getFirstLine(editorContent),
          updated_at: new Date().toISOString(),
        };
        setMemoPads(updatedMemos);
        saveMemos(updatedMemos);
      }

      let newIndex = currentIndex;
      if (direction === "next" && currentIndex < memoPads.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === "prev" && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        // Keep editing mode if user was editing
        if (isEditing && textInputRef.current) {
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 100);
        }
      }
    },
    [
      currentIndex,
      memoPads.length,
      currentMemo,
      editorContent,
      memoPads,
      isEditing,
    ],
  );

  // Enhanced swipe gesture - only for center area to avoid conflicts
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isSwipeInProgress.value = true;
    })
    .onUpdate((event) => {
      // Only respond to primarily horizontal gestures
      if (Math.abs(event.velocityY) > Math.abs(event.velocityX) * 1.5) {
        return;
      }

      // Smooth constrained translation with resistance at boundaries
      let constrainedTranslation = event.translationX;

      // Add resistance at boundaries
      if (currentIndex === 0 && constrainedTranslation > 0) {
        constrainedTranslation = constrainedTranslation * 0.3;
      } else if (
        currentIndex === memoPads.length - 1 &&
        constrainedTranslation < 0
      ) {
        constrainedTranslation = constrainedTranslation * 0.3;
      }

      // Apply smooth, damped translation
      translateX.value = interpolate(
        constrainedTranslation,
        [-screenWidth, 0, screenWidth],
        [-screenWidth * 0.4, 0, screenWidth * 0.4],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((event) => {
      const threshold = screenWidth * 0.12;
      const velocity = Math.abs(event.velocityX);
      const direction = event.velocityX > 0 ? "right" : "left";

      const shouldNavigate =
        Math.abs(event.translationX) > threshold || velocity > 300;

      if (shouldNavigate) {
        if (direction === "right" && currentIndex > 0) {
          translateX.value = withTiming(
            screenWidth * 0.1,
            { duration: 150 },
            () => {
              translateX.value = withTiming(0, { duration: 200 });
              isSwipeInProgress.value = false;
            },
          );
          runOnJS(navigateToMemo)("prev");
        } else if (direction === "left" && currentIndex < memoPads.length - 1) {
          translateX.value = withTiming(
            -screenWidth * 0.1,
            { duration: 150 },
            () => {
              translateX.value = withTiming(0, { duration: 200 });
              isSwipeInProgress.value = false;
            },
          );
          runOnJS(navigateToMemo)("next");
        } else {
          translateX.value = withSpring(
            0,
            {
              damping: 20,
              stiffness: 300,
            },
            () => {
              isSwipeInProgress.value = false;
            },
          );
        }
      } else {
        translateX.value = withSpring(
          0,
          {
            damping: 20,
            stiffness: 300,
          },
          () => {
            isSwipeInProgress.value = false;
          },
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleCreateMemo = async () => {
    const newMemo = {
      id: Date.now().toString(),
      title: "無題",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedMemos = [newMemo, ...memoPads];
    setMemoPads(updatedMemos);
    setCurrentIndex(0);
    setEditorContent("");
    setIsEditing(true);
    await saveMemos(updatedMemos);

    // Focus TextInput after creating new memo
    setTimeout(() => {
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteMemo = async () => {
    if (!currentMemo) return;

    const updatedMemos = memoPads.filter((memo) => memo.id !== currentMemo.id);
    setMemoPads(updatedMemos);

    // Adjust current index after deletion
    const newLength = updatedMemos.length;
    if (newLength === 0) {
      setCurrentIndex(0);
      setEditorContent("");
      setIsEditing(false);
    } else if (currentIndex >= newLength) {
      const newIndex = newLength - 1;
      setCurrentIndex(newIndex);
      setEditorContent(updatedMemos[newIndex].content);
    } else {
      setEditorContent(updatedMemos[currentIndex]?.content || "");
    }

    await saveMemos(updatedMemos);
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(editorContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      Alert.alert("エラー", "コピーに失敗しました");
    }
  };

  const handleTextInputChange = (text) => {
    setEditorContent(text);
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === "Enter") {
      const textInput = textInputRef.current;
      if (!textInput) return;

      const cursorPosition =
        textInput._lastNativeSelection?.start || editorContent.length;

      // Get the current line
      const textBeforeCursor = editorContent.substring(0, cursorPosition);
      const lines = textBeforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

      // Check if current line starts with bullet point
      const bulletMatch = currentLine.match(/^(\s*- )/);

      if (bulletMatch) {
        // If the line only contains "- " (and optional whitespace), remove the bullet
        if (currentLine.trim() === "-") {
          const lineStart = cursorPosition - currentLine.length;
          const newText =
            editorContent.substring(0, lineStart) +
            editorContent.substring(cursorPosition);
          setEditorContent(newText);
          return;
        }

        // Otherwise, add a new bullet point
        const indent = bulletMatch[1];
        const beforeCursor = editorContent.substring(0, cursorPosition);
        const afterCursor = editorContent.substring(cursorPosition);
        const newText = beforeCursor + "\n" + indent + afterCursor;
        setEditorContent(newText);
      }
    }
  };

  // Handle tap navigation
  const handleLeftTap = () => {
    console.log("Left tap - current index:", currentIndex);
    if (currentIndex > 0) {
      navigateToMemo("prev");
    }
  };

  const handleRightTap = () => {
    console.log(
      "Right tap - current index:",
      currentIndex,
      "total:",
      memoPads.length,
    );
    if (currentIndex < memoPads.length - 1) {
      navigateToMemo("next");
    }
  };

  // Handle content tap - start editing but don't change memo
  const handleContentTap = () => {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle TextInput focus - maintain editing state
  const handleTextInputFocus = () => {
    console.log("TextInput focused");
    setIsEditing(true);
  };

  // Prevent unwanted blur - only blur when user explicitly wants to stop editing
  const handleTextInputBlur = () => {
    // Don't automatically exit editing mode on blur
    // User can tap outside or use a specific action to exit editing
    console.log("TextInput blurred - keeping editing mode");
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

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <FileText size={48} color="#9CA3AF" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 18,
            fontWeight: "600",
            color: "#111318",
          }}
        >
          メモを読み込み中...
        </Text>
      </View>
    );
  }

  if (memoPads.length === 0) {
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
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#111318",
            }}
          >
            Notion メモ
          </Text>
        </View>

        {/* Empty State */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <FileText size={64} color="#9CA3AF" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#111318",
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Notion メモへようこそ
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
              lineHeight: 24,
              marginBottom: 32,
            }}
          >
            最初のメモを作成して、Notionと完全に互換性のあるMarkdownを書き始めましょう。
          </Text>

          <TouchableOpacity
            onPress={handleCreateMemo}
            style={{
              backgroundColor: "#0070FF",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
              最初のメモを作成
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior="padding"
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
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
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#111318",
            }}
          >
            Notion メモ
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleCreateMemo}
              style={{
                backgroundColor: "#0070FF",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 12 }}
              >
                {currentIndex + 1}/{memoPads.length}
              </Text>
            </TouchableOpacity>

            {currentMemo && (
              <TouchableOpacity
                onPress={handleDeleteMemo}
                style={{
                  backgroundColor: "#FEF2F2",
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Memo Title */}
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111318",
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {currentMemo ? getFirstLine(currentMemo.content) : "メモなし"}
          </Text>
        </View>
      </View>

      {/* Main Content Container */}
      <View style={{ flex: 1, position: "relative" }}>
        {/* Left Navigation Area - Outside GestureDetector */}
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={handleLeftTap}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 80,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
              backgroundColor: "transparent",
            }}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: "rgba(0, 112, 255, 0.15)",
                borderRadius: 20,
                padding: 10,
                marginLeft: 10,
              }}
            >
              <ChevronLeft size={24} color="rgba(0, 112, 255, 0.6)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Right Navigation Area - Outside GestureDetector */}
        {currentIndex < memoPads.length - 1 && (
          <TouchableOpacity
            onPress={handleRightTap}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 80,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
              backgroundColor: "transparent",
            }}
            activeOpacity={0.7}
          >
            <View
              style={{
                backgroundColor: "rgba(0, 112, 255, 0.15)",
                borderRadius: 20,
                padding: 10,
                marginRight: 10,
              }}
            >
              <ChevronRight size={24} color="rgba(0, 112, 255, 0.6)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Content Area with Gesture - Limited to center area */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                flex: 1,
                // Remove margins to restore full width - buttons are overlaid separately
              },
              animatedStyle,
            ]}
          >
            <View style={{ flex: 1, position: "relative" }}>
              {/* Editor TextInput */}
              <TextInput
                ref={textInputRef}
                value={editorContent}
                onChangeText={handleTextInputChange}
                onKeyPress={handleKeyPress}
                onFocus={handleTextInputFocus}
                onBlur={handleTextInputBlur}
                blurOnSubmit={false}
                returnKeyType="default"
                multiline
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  fontSize: 16,
                  lineHeight: 24,
                  color: "#111318",
                  fontFamily: "monospace",
                  textAlignVertical: "top",
                  backgroundColor: "transparent",
                  padding: 20,
                  zIndex: isEditing ? 50 : 0,
                  opacity: isEditing ? 0.9 : 0,
                }}
                placeholder="# タイトル

## サブタイトル

- 箇条書き1
- 箇条書き2
  - ネストした箇条書き

**太字** や *斜体*、`コード` などのMarkdownが使えます。

メモをここに書き始めてください..."
                placeholderTextColor="#9CA3AF"
              />

              {/* Rendered Preview */}
              <ScrollView
                style={{
                  flex: 1,
                  opacity: isEditing ? 0.3 : 1,
                }}
                contentContainerStyle={{
                  padding: 20,
                  paddingBottom: insets.bottom + 100,
                }}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleContentTap}
                  style={{ minHeight: 400 }}
                >
                  {currentMemo && editorContent.trim() ? (
                    <MarkdownText content={editorContent} />
                  ) : (
                    <Text
                      style={{
                        color: "#9CA3AF",
                        fontSize: 16,
                        fontStyle: "italic",
                        textAlign: "center",
                        marginTop: 100,
                      }}
                    >
                      タップして書き始めてください...
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>

              {/* Navigation Hints - Only show when not editing and multiple memos exist */}
              {!isEditing && memoPads.length > 1 && (
                <>
                  {currentIndex > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        left: 20,
                        top: "50%",
                        transform: [{ translateY: -12 }],
                        opacity: 0.3,
                        zIndex: 1,
                      }}
                      pointerEvents="none"
                    >
                      <ChevronLeft size={24} color="#0070FF" />
                    </View>
                  )}
                  {currentIndex < memoPads.length - 1 && (
                    <View
                      style={{
                        position: "absolute",
                        right: 20,
                        top: "50%",
                        transform: [{ translateY: -12 }],
                        opacity: 0.3,
                        zIndex: 1,
                      }}
                      pointerEvents="none"
                    >
                      <ChevronRight size={24} color="#0070FF" />
                    </View>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Bottom Actions */}
      {currentMemo && !isEditing && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            backgroundColor: "#FFFFFF",
          }}
        >
          <TouchableOpacity
            onPress={handleCopyToClipboard}
            style={{
              backgroundColor: "#0070FF",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {copySuccess ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <Copy size={20} color="#FFFFFF" />
            )}
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              {copySuccess ? "コピーしました！" : "コピー"}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#9CA3AF",
              marginTop: 8,
            }}
          >
            左右をタップ・中央をスワイプでメモ切り替え • 中央をタップして編集
          </Text>
        </View>
      )}

      {/* Exit editing button when editing */}
      {isEditing && (
        <TouchableOpacity
          onPress={() => {
            setIsEditing(false);
            textInputRef.current?.blur();
          }}
          style={{
            position: "absolute",
            top: insets.top + 80,
            right: 20,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            zIndex: 200,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
            完了
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingAnimatedView>
  );
}
