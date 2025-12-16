"use client";

import React from "react";

type StreamingTextProps = {
  text: string;
  isStreaming: boolean;
  isCurrentField: boolean;
  placeholder?: string;
  className?: string;
};

export const StreamingText = React.memo(function StreamingText({
  text,
  isStreaming,
  isCurrentField,
  placeholder = "AIが考えています...",
  className = "",
}: StreamingTextProps) {
  const showCursor = isStreaming && isCurrentField;
  const displayText = text || placeholder;

  return (
    <div className={`relative ${className}`}>
      <span className="whitespace-pre-wrap">{displayText}</span>
      {showCursor && (
        <span className="inline-block animate-pulse ml-1 text-sky-600 font-bold">
          ▍
        </span>
      )}
    </div>
  );
});
