import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

type ChoiceCardProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  isUnknown?: boolean;
  className?: string;
  imageUrl?: string;
};

export function ChoiceCard({
  label,
  selected,
  onClick,
  isUnknown = false,
  icon: Icon,
  className = "",
  imageUrl,
}: ChoiceCardProps) {
  // 画像がある場合は横並びレイアウト、ない場合は従来の縦並びレイアウト
  const hasImage = Boolean(imageUrl);

  const baseClasses = hasImage
    ? "group w-full rounded-2xl border bg-white transition hover:-translate-y-[2px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden relative"
    : "group w-full rounded-xl border bg-white p-4 text-center transition hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

  const stateClasses = selected
    ? hasImage
      ? "border-blue-600 shadow-lg ring-2 ring-blue-600"
      : "border-sky-500 bg-sky-50 shadow-sm"
    : hasImage
      ? "border-gray-200 hover:border-blue-400 hover:shadow-md"
      : "border-slate-200 hover:border-slate-400 hover:shadow-sm";

  const sizeClasses = hasImage
    ? "min-h-[100px] sm:min-h-[120px]"
    : (isUnknown ? "py-3 sm:py-4 min-h-[80px] sm:min-h-[128px]" : "py-4 sm:py-6 min-h-[100px] sm:min-h-[168px]");

  const composedClassName = [baseClasses, stateClasses, sizeClasses, className]
    .filter(Boolean)
    .join(" ");

  const iconColor = selected
    ? "text-sky-600"
    : "text-slate-500 group-hover:text-slate-700";

  if (hasImage && imageUrl) {
    return (
      <button
        type="button"
        className={composedClassName}
        onClick={onClick}
        aria-pressed={selected}
      >
        <div className="flex items-center h-full">
          {/* 左側の画像 */}
          <div className="w-32 h-32 flex-shrink-0 relative">
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>

          {/* 右側のテキスト */}
          <div className="flex-1 flex items-center justify-center px-6 py-4">
            <span className="text-lg font-bold text-blue-900">
              {label}
            </span>
          </div>

          {/* 選択チェックマーク */}
          {selected && (
            <div className="absolute top-3 right-3">
              <CheckCircle2 className="w-7 h-7 text-blue-600 fill-white drop-shadow" />
            </div>
          )}
        </div>
      </button>
    );
  }

  // 従来のアイコン+テキストレイアウト
  return (
    <button
      type="button"
      className={composedClassName}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="flex flex-col items-center gap-3">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={`h-7 w-7 transition-colors ${iconColor}`}
          />
        ) : null}
        <span className="text-base font-semibold leading-6 text-slate-900">
          {label}
        </span>
      </div>
    </button>
  );
}
