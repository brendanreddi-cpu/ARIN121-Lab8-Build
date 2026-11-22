/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Lightbulb,
  Award,
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

const SAMPLE_NOTES: { label: string; topic: string; content: string }[] = [
  {
    label: 'Cellular Respiration',
    topic: 'Biology',
    content: `Cellular respiration is a set of metabolic reactions that convert biochemical energy from nutrients into ATP.
It has three main stages:
1. Glycolysis: Takes place in the cytoplasm, anaerobic (does not require O2). Converts 1 molecule of glucose into 2 pyruvate molecules, yielding a net 2 ATP and 2 NADH.
2. Krebs Cycle (Citric Acid Cycle): Occurs in the mitochondrial matrix. Breaks down acetyl-CoA into CO2, producing ATP (or GTP), NADH, and FADH2.
3. Oxidative Phosphorylation & Electron Transport Chain: Located on the inner mitochondrial membrane (cristae). Uses electrons from NADH and FADH2 to pump protons (H+) into the intermembrane space, creating a proton gradient. ATP synthase then synthesizes the majority of ATP (~26-28 ATP). Oxygen acts as the final electron acceptor, forming water (H2O).`,
  },
  {
    label: 'Supply & Demand',
    topic: 'Economics',
    content: `The Law of Demand states that, ceteris paribus, as the price of a good increases, the quantity demanded decreases.
The Law of Supply states that as the price of a good increases, the quantity supplied increases.
Market Equilibrium occurs where the quantity demanded equals the quantity supplied at the equilibrium price.
Price Elasticity of Demand (PED) measures responsiveness:
- Inelastic (|PED| < 1): consumers are relatively insensitive to price changes (e.g., life-saving insulin).
- Elastic (|PED| > 1): small price changes lead to large shifts in demand (e.g., luxury goods with many substitutes).
A price ceiling set below equilibrium causes a shortage, whereas a price floor above equilibrium causes a surplus.`,
  },
  {
    label: 'Algorithms & Big-O',
    topic: 'Computer Science',
    content: `Big-O notation describes the upper bound of an algorithm's asymptotic time or space complexity as input size n grows.
Common complexities from fastest to slowest:
- O(1): Constant time (e.g., hash table average lookup, array index access).
- O(log n): Logarithmic time (e.g., binary search in a sorted array).
- O(n): Linear time (e.g., linear scan, iterating through an array).
- O(n log n): Linearithmic time (e.g., Merge Sort, standard Quick Sort average case).
- O(n^2): Quadratic time (e.g., Bubble Sort, selection sort with nested loops).
Merge Sort guarantees O(n log n) even in the worst case, but requires O(n) auxiliary space. Quick Sort has O(n log n) average time, but O(n^2) worst-case if pivot selection is poor.`,
  },
];

export default function App() {
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string>('');

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  const wordCount = studyNotes.trim() ? studyNotes.trim().split(/\s+/).length : 0;
  const charCount = studyNotes.length;

  const handleSelectSample = (content: string) => {
    setStudyNotes(content);
    setValidationError('');
  };

  const handleGenerateQuiz = async () => {
    // Check if notes are empty
    if (!studyNotes.trim()) {
      setValidationError('Please enter or paste your study notes to generate a practice quiz.');
      if (notesTextareaRef.current) {
        notesTextareaRef.current.focus();
      }
      return;
    }

    setValidationError('');
    setApiError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: studyNotes,
          numQuestions: Math.min(Math.max(Number(numQuestions) || 3, 1), 5),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz. Please check your notes and try again.');
      }

      setQuiz(data);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setShowAnswerKey(true);

      // Smooth scroll to the quiz section after a brief render delay
      setTimeout(() => {
        quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setApiError(err.message || 'An unexpected error occurred while communicating with the Gemini model.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return; // Prevent changing after submission until reset
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleResetSelections = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Score calculations
  const totalQuestions = quiz ? quiz.questions.length : 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = quiz
    ? quiz.questions.reduce((acc, q) => {
        return selectedAnswers[q.id] === q.correctOptionIndex ? acc + 1 : acc;
      }, 0)
    : 0;

  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Academic Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                ScholarQuiz
              </h1>
              <p className="text-xs text-slate-500 font-medium">University Study Practice Quiz</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Intro Banner */}
        <section className="mb-8 print:hidden">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
                  <BookOpen className="w-3.5 h-3.5" /> Exam Prep & Active Recall
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                  Turn Your Study Notes Into Practice Quizzes
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                  Paste your university lecture summaries, textbook excerpts, or syllabus notes.
                  Generate 1 to 5 rigorous multiple-choice questions with 4 answer options, verified answer keys, and clear explanations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Input Panel / Quiz Setup Card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 print:hidden">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="study-notes" className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Study Notes</span>
            </label>
            <div className="text-xs text-slate-500 font-medium">
              {wordCount} words &bull; {charCount} chars
            </div>
          </div>

          {/* Sample Notes Presets */}
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Quick Examples:
              </span>
              {SAMPLE_NOTES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleSelectSample(sample.content)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors font-medium text-xs cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
              {studyNotes && (
                <button
                  type="button"
                  onClick={() => {
                    setStudyNotes('');
                    setValidationError('');
                  }}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs ml-auto cursor-pointer"
                >
                  Clear notes
                </button>
              )}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="relative">
            <textarea
              id="study-notes"
              ref={notesTextareaRef}
              rows={7}
              value={studyNotes}
              onChange={(e) => {
                setStudyNotes(e.target.value);
                if (validationError && e.target.value.trim()) {
                  setValidationError('');
                }
              }}
              placeholder="Paste lecture notes, study guides, textbook readings, or key concepts here..."
              className={`w-full p-4 text-sm sm:text-base rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden transition-all font-mono leading-relaxed resize-y ${
                validationError
                  ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100'
              }`}
            />
          </div>

          {/* Validation Alert when notes box is empty */}
          {validationError && (
            <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{validationError}</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Type or paste your notes above, or click one of the quick examples to test immediately.
                </p>
              </div>
            </div>
          )}

          {/* Controls: Number of Questions + Generate Button */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label htmlFor="num-questions" className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                Questions (1 to 5):
              </label>

              {/* Number Input (1 to 5) */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      numQuestions === num
                        ? 'bg-indigo-600 text-white shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    aria-label={`Select ${num} questions`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Standard Accessible Number Input Fallback */}
              <input
                id="num-questions"
                type="number"
                min={1}
                max={5}
                value={numQuestions}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val)) setNumQuestions(1);
                  else setNumQuestions(Math.min(Math.max(val, 1), 5));
                }}
                className="w-14 px-2 py-1.5 text-center text-sm font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Generate Quiz Button */}
            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                isLoading
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-98 shadow-indigo-200'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Generate Quiz</p>
                <p className="text-xs text-amber-800 mt-0.5">{apiError}</p>
              </div>
            </div>
          )}
        </section>

        {/* Quiz Display Section */}
        {quiz && (
          <div ref={quizSectionRef} className="space-y-8">
            {/* Quiz Header & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Practice Quiz
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {quiz.questions.length} Question{quiz.questions.length > 1 ? 's' : ''} &bull; 4 Options Each
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{quiz.title}</h3>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleResetSelections}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Reset your answers to try again"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Choices</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Print practice sheet"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                </div>
              </div>

              {/* Interactive Quiz Instructions & Score Summary */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-600">
                <p className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Select an option for each question to test your knowledge, or review the answer key below.</span>
                </p>

                {isSubmitted && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-800">
                      Score: {score}/{totalQuestions} ({scorePercentage}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {quiz.questions.map((q, qIndex) => {
                const userChoice = selectedAnswers[q.id];
                const hasSelected = userChoice !== undefined;
                const isCorrect = userChoice === q.correctOptionIndex;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs transition-all"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                          {q.question}
                        </h4>
                      </div>

                      {/* Status indicator if answered and submitted */}
                      {isSubmitted && hasSelected && (
                        <div className="shrink-0">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Incorrect
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Four Options */}
                    <div className="grid grid-cols-1 gap-2.5 ml-0 sm:ml-10">
                      {q.options.map((optionText, optIndex) => {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        const isChosen = userChoice === optIndex;
                        const isThisCorrect = optIndex === q.correctOptionIndex;

                        let optionStyle = 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800';

                        if (isSubmitted) {
                          if (isThisCorrect) {
                            optionStyle = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-300';
                          } else if (isChosen && !isThisCorrect) {
                            optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                          } else {
                            optionStyle = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-75';
                          }
                        } else if (isChosen) {
                          optionStyle = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-medium ring-2 ring-indigo-200';
                        }

                        return (
                          <button
                            key={optIndex}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIndex)}
                            className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 border ${
                                isSubmitted && isThisCorrect
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : isChosen
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-300'
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="text-sm sm:text-base leading-relaxed flex-1">{optionText}</span>

                            {isSubmitted && isThisCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            {isSubmitted && isChosen && !isThisCorrect && (
                              <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Check Answers Bar (Interactive Testing) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs print:hidden">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{answeredCount}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalQuestions}</span> questions selected.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(true);
                      setShowAnswerKey(true);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
                  >
                    Check My Answers
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetSelections}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Retake Practice Quiz
                  </button>
                )}
              </div>
            </div>

            {/* Answer Key with Explanations (Explicitly required below the questions) */}
            <section className="bg-white rounded-2xl border border-indigo-200 shadow-xs overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-indigo-50/70 to-slate-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Answer Key &amp; Explanations</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Complete solutions and academic rationale for all questions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAnswerKey((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer print:hidden"
                >
                  {showAnswerKey ? (
                    <>
                      <span>Hide Details</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show Details</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {showAnswerKey && (
                <div className="divide-y divide-slate-100 p-6 space-y-6">
                  {quiz.questions.map((q, qIndex) => {
                    const correctLetter = String.fromCharCode(65 + q.correctOptionIndex);
                    const correctText = q.options[q.correctOptionIndex];
                    const userChoice = selectedAnswers[q.id];
                    const hasSelected = userChoice !== undefined;
                    const isCorrect = userChoice === q.correctOptionIndex;

                    return (
                      <div key={q.id} className={qIndex > 0 ? 'pt-6' : ''}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                            Question {qIndex + 1}: {q.question}
                          </h4>

                          {isSubmitted && hasSelected && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          )}
                        </div>

                        {/* Correct Answer Highlight */}
                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Correct Answer:</strong> Option {correctLetter} &mdash; {correctText}
                          </span>
                        </div>

                        {/* Student choice context if they made one */}
                        {isSubmitted && hasSelected && !isCorrect && (
                          <div className="mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                            Your selection was Option {String.fromCharCode(65 + userChoice)}: {q.options[userChoice]}
                          </div>
                        )}

                        {/* Detailed Academic Explanation */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wide">
                            <Lightbulb className="w-3.5 h-3.5 text-indigo-600" /> Explanation
                          </span>
                          <p>{q.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500 print:hidden">
        <p className="max-w-md mx-auto">
          ScholarQuiz &bull; Designed for university students to reinforce knowledge, self-assess comprehension, and master lecture material.
        </p>
      </footer>
    </div>
  );
}
