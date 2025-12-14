"use client";

import { useState, useEffect } from 'react';

// 音声認識の型定義
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// メッセージの型定義（画像URLを追加）
type Message = {
  role: 'user' | 'ai';
  content: string;
  imageUrl?: string; // ★ここが画像表示のカギです
};

export default function ChatAdvisor() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // 音声入力機能
  const startListening = () => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const Recognition = SpeechRecognition || webkitSpeechRecognition;

    if (!Recognition) {
      alert("お使いのブラウザは音声入力に対応していません");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // メッセージ送信機能
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/advice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ message: currentInput }),
      });

      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      // ▼▼▼ ここでバックエンドから来た画像URLを受け取ります ▼▼▼
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        content: data.reply,
        imageUrl: data.image_url // バックエンドのキー(image_url)と合わせる
      }]);

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
            <p className="text-sm mt-2">（例：「内装のイメージを見せて」と言うと画像を表示します）</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border text-gray-800 rounded-bl-none'
            }`}>
              {msg.content}
            </div>

            {/* ▼▼▼ 追加：画像があれば表示するエリア ▼▼▼ */}
            {msg.imageUrl && (
              <div className="mt-2 max-w-[80%]">
                <img 
                  src={msg.imageUrl} 
                  alt="Reference Image" 
                  className="rounded-lg shadow-md border border-gray-200 w-full h-auto"
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">イメージ画像</p>
              </div>
            )}
            {/* ▲▲▲ 追加ここまで ▲▲▲ */}

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
        <div className="flex gap-2 items-center">
          
          {/* 音声入力ボタン */}
          <button
            onClick={startListening}
            disabled={isRecording || isLoading}
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title="音声入力"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>

          <input 
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isRecording ? "聞いています..." : "質問を入力..."}
            disabled={isLoading}
          />
          <button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()} 
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-full font-bold transition-colors flex-shrink-0"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}