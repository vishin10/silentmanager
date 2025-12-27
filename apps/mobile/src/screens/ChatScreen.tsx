import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";

const prompts = [
  "highest day this week",
  "worst shift yesterday",
  "compare this week vs last week",
  "any refunds today?",
  "fuel vs inside sales this week"
];

type ChatItem = { id?: string; question: string; answer: string };

const ChatScreen = () => {
  const { state, disconnect } = useStoreAccess();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [question, setQuestion] = useState("");

  const loadHistory = async () => {
    if (!state) return;
    try {
      const api = createApi({ baseUrl: state.baseUrl, token: state.token });
      const data = await api.chatHistory(state.storeId);
      const formatted = data
        .map((item: any) => ({ id: item.id, question: item.question, answer: item.answer }))
        .reverse()
        .slice(-20);
      setMessages(formatted);
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        await disconnect();
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, [state]);

  const sendQuestion = async (text: string) => {
    if (!state || !text.trim()) return;
    const next = text.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { question: next, answer: "..." }]);
    try {
      const api = createApi({ baseUrl: state.baseUrl, token: state.token });
      const response = await api.chat(state.storeId, next);
      setMessages((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1 ? { ...item, answer: response.answer } : item
        )
      );
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        await disconnect();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.promptRow}>
        {prompts.map((prompt) => (
          <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => sendQuestion(prompt)}>
            <Text style={styles.promptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={styles.messageGroup}>
            <View style={[styles.bubble, styles.bubbleUser]}>
              <Text style={styles.bubbleTextUser}>{item.question}</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={styles.bubbleTextBot}>{item.answer}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Ask a question to get started.</Text>}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about sales, refunds, or shifts..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => sendQuestion(question)}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  promptChip: { backgroundColor: "#E2E8F0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  promptText: { fontSize: 10, color: "#475569" },
  messageGroup: { marginBottom: 12 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 16, marginBottom: 6 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#2563EB" },
  bubbleBot: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0" },
  bubbleTextUser: { color: "#FFFFFF", fontSize: 12 },
  bubbleTextBot: { color: "#0F172A", fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  sendButton: { backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sendButtonText: { color: "#FFFFFF", fontSize: 12 },
  emptyText: { textAlign: "center", color: "#94A3B8", marginTop: 20 }
});

export default ChatScreen;
