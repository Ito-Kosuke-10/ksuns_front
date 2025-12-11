'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChoiceCard } from "../../components/ChoiceCard";
import { ProgressBar } from "../../components/ProgressBar";
import {
  QUESTIONS,
  QUESTION_TOTAL,
  PRICE_RANGE_BOUNDS,
  OPTION_ICONS,
  SUB_GENRE_OPTIONS_BY_MAIN,
  getQuestionByNumber,
  type MainGenreValue,
  type QuestionOption,
} from "../../data/questions";
import {
  PRICE_SLIDER_CONFIG,
  calculateSliderInitialValue,
  clampSliderValue,
  formatCurrency,
} from "../../data/price-ranges";
import { useAnswerContext } from "../../state/answer-context";

export default function QuestionPage() {
  const router = useRouter();
  const { questionNumber } = useParams<{ questionNumber: string }>();
  const parsedQuestionNumber = Number(questionNumber);
  const question = useMemo(
    () => getQuestionByNumber(parsedQuestionNumber),
    [parsedQuestionNumber],
  );
  const { answers, setAnswer } = useAnswerContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!question) {
      router.replace("/simple_simulation/questions/1");
    }
  }, [question, router]);

  if (!question) {
    return null;
  }

  const selectedValues = answers[question.id] ?? [];
  const isSliderQuestion = Boolean(question.slider);

  const mainGenreValue = answers.main_genre?.[0] as MainGenreValue | undefined;
  const questionOptions: QuestionOption[] =
    question.id === "sub_genre" && mainGenreValue
      ? SUB_GENRE_OPTIONS_BY_MAIN[mainGenreValue] ?? []
      : question.options;

  const unknownValue = questionOptions.find((option: QuestionOption) => option.isUnknown)?.value;

  const completedCount = QUESTIONS.filter(
    (item) => item.number < question.number && (answers[item.id]?.length ?? 0) > 0,
  ).length;

  const toggleSelection = (option: QuestionOption) => {
    const isLastQuestion = question.number === QUESTION_TOTAL;
    const isAutoAdvanceAllowed =
      question.type === "single" && !isSliderQuestion && !isLastQuestion;

    if (question.type === "single") {
      const currentValue = selectedValues[0];
      if (currentValue === option.value) {
        return;
      }

      if (question.id === "main_genre") {
        // メインジャンル変更時はサブジャンルをクリアして進捗を正しく反映させる
        setAnswer("sub_genre", []);
      }

      setErrorMessage(null);
      setAnswer(question.id, [option.value]);

      if (isAutoAdvanceAllowed) {
        const nextQuestionNumber = question.number + 1;
        router.push(`/simple_simulation/questions/${nextQuestionNumber}`);
      }
      return;
    }

    if (option.isUnknown) {
      const nextValues = selectedValues.includes(option.value) ? [] : [option.value];
      setErrorMessage(null);
      setAnswer(question.id, nextValues);
      return;
    }

    const withoutUnknown = unknownValue
      ? selectedValues.filter((value) => value !== unknownValue)
      : selectedValues;
    const isSelected = withoutUnknown.includes(option.value);
    const nextValues = isSelected
      ? withoutUnknown.filter((value) => value !== option.value)
      : [...withoutUnknown, option.value];

    setErrorMessage(null);
    setAnswer(question.id, nextValues);
  };

  const isNextDisabled = isSliderQuestion ? false : selectedValues.length === 0;
  const isFirstQuestion = question.number === 1;
  const isLastQuestion = question.number === QUESTION_TOTAL;

  const handleBack = () => {
    if (isFirstQuestion) return;
    router.push(`/simple_simulation/questions/${question.number - 1}`);
  };

  const handleNext = () => {
    if (isNextDisabled) {
      setErrorMessage("選択してください");
      return;
    }

    if (isSliderQuestion && question.slider) {
      if (question.id === "price_point") {
        // 価格スライダーの場合、選択されたレンジから初期値を計算
        const rangeValue = answers.price_range?.[0] ?? "price_0_2000";
        const bounds = PRICE_RANGE_BOUNDS[rangeValue];
        
        if (bounds) {
          // 初期値 = (min + max) / 2 を500円刻みに
          const initialValue = calculateSliderInitialValue(bounds);
          const currentRaw = selectedValues[0] ? Number(selectedValues[0]) : initialValue;
          const clampedValue = clampSliderValue(currentRaw);
          setAnswer(question.id, [String(clampedValue)]);
        } else {
          // フォールバック: デフォルト値を使用
          const defaultValue = question.slider.defaultValue;
          const clampedValue = clampSliderValue(defaultValue);
          setAnswer(question.id, [String(clampedValue)]);
        }
      } else {
        // その他のスライダー（座席数など）
        const defaultValue = question.slider.defaultValue;
        const currentRaw = selectedValues[0] ? Number(selectedValues[0]) : defaultValue;
        const nextValue = Math.min(
          Math.max(currentRaw, question.slider.min),
          question.slider.max,
        );
        setAnswer(question.id, [String(nextValue)]);
      }
    }

    setErrorMessage(null);

    if (isLastQuestion) {
      router.push("/simple_simulation/result");
      return;
    }

    router.push(`/simple_simulation/questions/${question.number + 1}`);
  };

  return (
    <div id="simple-question-root" className="flex flex-1 flex-col gap-6">
      <ProgressBar
        completed={completedCount}
        total={QUESTION_TOTAL}
      />

      <header id="simple-question-header" className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-500">{question.title}</p>
        <h1 className="text-2xl font-semibold leading-8 text-slate-900">
          {`Q${question.number}. ${question.prompt}`}
        </h1>
      </header>

      {isSliderQuestion && question.slider ? (() => {
        if (question.id === "price_point") {
          // 価格スライダーの場合
          const rangeValue = answers.price_range?.[0] ?? "price_0_2000";
          const bounds = PRICE_RANGE_BOUNDS[rangeValue];
          
          // スライダーの範囲は常に500〜30,000に固定
          const sliderMin = PRICE_SLIDER_CONFIG.min;
          const sliderMax = PRICE_SLIDER_CONFIG.max;
          const sliderStep = PRICE_SLIDER_CONFIG.step;

          // 初期値計算: 選択されたレンジのmin/maxから計算
          const initialValue = bounds
            ? calculateSliderInitialValue(bounds)
            : question.slider.defaultValue;

          const rawValue = selectedValues[0] ? Number(selectedValues[0]) : initialValue;
          const clampedValue = clampSliderValue(rawValue);

          return (
            <div id="simple-question-slider-card" className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-semibold text-slate-900">
                    {formatCurrency(clampedValue)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {`${formatCurrency(sliderMin)} 〜 ${formatCurrency(sliderMax)}`}
                </span>
              </div>
              <input
                id={`simple-question-slider-${question.id}`}
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={clampedValue}
                onChange={(event) => {
                  const newValue = clampSliderValue(Number(event.target.value));
                  setAnswer(question.id, [String(newValue)]);
                }}
                className="mt-6 w-full slider-soft"
              />
            </div>
          );
        } else {
          // その他のスライダー（座席数など）
          const sliderMin = question.slider.min;
          const sliderMax = question.slider.max;
          const defaultValue = question.slider.defaultValue;
          const rawValue = selectedValues[0] ? Number(selectedValues[0]) : defaultValue;
          const clampedValue = Math.min(Math.max(rawValue, sliderMin), sliderMax);

          return (
            <div id="simple-question-slider-card" className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-semibold text-slate-900">
                    {clampedValue.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-600">
                    {question.slider.unit}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {`${sliderMin.toLocaleString()} ${question.slider.unit} 〜 ${sliderMax.toLocaleString()} ${question.slider.unit}`}
                </span>
              </div>
              <input
                id={`simple-question-slider-${question.id}`}
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={question.slider.step}
                value={clampedValue}
                onChange={(event) =>
                  setAnswer(question.id, [String(Number(event.target.value))])
                }
                className="mt-6 w-full slider-soft"
              />
            </div>
          );
        }
      })() : (
        <div id="simple-question-choice-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {questionOptions.map((option: QuestionOption) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              selected={selectedValues.includes(option.value)}
              isUnknown={option.isUnknown}
              icon={OPTION_ICONS[option.value]}
              imageUrl={option.imageUrl}
              onClick={() => toggleSelection(option)}
              className={option.isUnknown ? "col-span-full sm:col-span-2" : ""}
            />
          ))}
        </div>
      )}

      {errorMessage ? (
        <p id="simple-question-error" className="text-sm font-medium text-rose-600">
          {errorMessage}
        </p>
      ) : null}

      <div
        id="simple-question-footer"
        className="mt-auto flex items-center justify-between gap-3 pt-4"
      >
        {isFirstQuestion ? (
          <div />
        ) : (
          <button
            id="simple-question-back-button"
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            戻る
          </button>
        )}

        <button
          id={isLastQuestion ? "simple-question-submit-button" : "simple-question-next-button"}
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLastQuestion ? "診断する" : "進む"}
        </button>
      </div>
    </div>
  );
}
