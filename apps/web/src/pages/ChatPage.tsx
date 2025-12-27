import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api";
import { INTENT_LABELS } from "@silentmanager/shared";

type ChatItem = {
  id?: string;
  question: string;
  answer: string;
  createdAt?: string;
};

type OutletContext = { storeId: string | null };

const prompts = [
  INTENT_LABELS.HIGHEST_DAY_WEEK,
  INTENT_LABELS.WORST_SHIFT_YESTERDAY,
  INTENT_LABELS.COMPARE_WEEK_VS_LAST_WEEK,
  INTENT_LABELS.REFUNDS_TODAY,
  INTENT_LABELS.FUEL_VS_INSIDE_WEEK
];

const ChatPage = () => {
  const { storeId } = useOutletContext<OutletContext>();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    api.chatHistory(storeId).then((data) => {
      setMessages(
        data
          .map((item: any) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
            createdAt: item.createdAt
          }))
          .reverse()
      );
    });
  }, [storeId]);

  const sendQuestion = async (text: string) => {
    if (!storeId || !text.trim()) return;
    setLoading(true);
    const questionText = text.trim();
    setMessages((prev) => [...prev, { question: questionText, answer: "..." }]);
    setQuestion("");
    try {
      const response = await api.chat(storeId, questionText);
      setMessages((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1
            ? { ...item, answer: response.answer }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            className="px-3 py-1 text-xs bg-slate-200 rounded-full"
            onClick={() => sendQuestion(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div key={message.id || index} className="space-y-2">
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl max-w-xs text-sm">
                {message.question}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white border px-3 py-2 rounded-2xl max-w-xs text-sm">
                {message.answer}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-slate-500">Ask a question to get started.</p>}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendQuestion(question);
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Ask about sales, refunds, or shifts..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-60"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
