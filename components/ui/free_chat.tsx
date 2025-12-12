"use client";

import { useState } from 'react';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function ChatAdvisor() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:8000"}/api/chat/advice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ message: currentInput }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'ai', content: 'エラーが発生しました。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm flex flex-col h-[600px] w-full max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="font-bold text-lg">AI開業コーチ - 何でも相談室</h2>
        <p className="text-xs opacity-90">現在の事業計画データを元に回答します</p>
      </div>
      
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-20 text-gray-400">
            <p className="mb-2 text-xl">👋</p>
            <p>事業計画について、気になることを何でも聞いてください。</p>
            <p className="text-sm mt-2">（例：このコンセプトで集客できそう？、原価率のアドバイスをして）</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border text-gray-800 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-500 px-3 py-2 rounded-full text-xs animate-pulse">
              AIが考え中...
            </div>
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-3">
          <input 
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="ここに質問を入力..."
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()} 
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-full font-bold transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}