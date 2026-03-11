import React, { useState, useEffect } from 'react';
import { generatePrompt, evaluateSubmission } from '../services/geminiService';
import { PromptData, EvaluationResult, SampleAnswer } from '../types';
import { updateUserScore, saveHistoryEntry } from '../services/mockBackend';
import { Loader2, Send, Lightbulb, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PracticeSessionProps {
  onComplete: () => void;
}

// --- Sub-component: Results View ---
const ResultsView: React.FC<{
  result: EvaluationResult;
  onClose: () => void;
}> = ({ result, onClose }) => {

  const metrics = [
    { name: 'Strategy', score: result.scores.strategicThinking, full: 'Strategic Thinking' },
    { name: 'Creativity', score: result.scores.creativity, full: 'Creativity' },
    { name: 'Clarity', score: result.scores.clarity, full: 'Clarity & Specificity' },
    { name: 'Analysis', score: result.scores.analyticalThinking, full: 'Analytical Thinking' },
    { name: 'Empathy', score: result.scores.customerEmpathy, full: 'Customer Empathy' },
  ];

  const [activeSample, setActiveSample] = useState<'AI Junior PM' | 'AI Senior PM' | 'AI World-Class PM'>('AI Senior PM');
  const hasSamples = result.sampleAnswers && result.sampleAnswers.length > 0;
  const currentSample = hasSamples ? (result.sampleAnswers.find(s => s.level === activeSample) || result.sampleAnswers[0]) : null;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(result.shareMessage);
      alert("Copied result to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Overall Score Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-purple-900 dark:from-cyan-950 dark:to-purple-950 text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold">Score: {result.scores.overall}/100</h2>
          <p className="text-cyan-100 mt-2 max-w-xl leading-relaxed">"{result.feedback}"</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleShare} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            Share
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-white text-purple-900 hover:bg-cyan-50 rounded-lg text-sm font-medium transition-colors">
            Next Question
          </button>
        </div>
      </div>

      {/* Detailed Metrics Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Performance Breakdown</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', backgroundColor: '#111827', color: '#f1f5f9' }}
                formatter={(value: number) => [`${value}/100`, 'Score']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                {metrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#22d3ee' : entry.score > 60 ? '#a855f7' : '#374151'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sample Answers Comparison */}
      {hasSamples && currentSample && (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-gray-800 px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">AI Sample Responses</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">See how different levels approach this question.</p>
          </div>
          <div className="flex bg-slate-200 dark:bg-gray-700 rounded-lg p-1">
            {result.sampleAnswers.map((s) => (
              <button
                key={s.level}
                onClick={() => setActiveSample(s.level)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeSample === s.level ? 'bg-white dark:bg-gray-900 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
              >
                {s.level.replace('AI ', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeSample.includes('World-Class') ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' :
                activeSample.includes('Senior') ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
              }`}>
                {activeSample}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Score: {currentSample.scores.overall}/100</span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-gray-800 p-4 rounded-lg border border-slate-100 dark:border-gray-700">
            <p className="whitespace-pre-line">{currentSample.content}</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};


// --- Main Component ---
const PracticeSession: React.FC<PracticeSessionProps> = ({ onComplete }) => {
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [answer, setAnswer] = useState('');
  const [showProTip, setShowProTip] = useState(false);

  const loadNewQuestion = async () => {
    setResult(null);
    setAnswer('');
    setShowProTip(false);
    setLoadingPrompt(true);
    const data = await generatePrompt();
    setPrompt(data);
    setLoadingPrompt(false);
  };

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const handleSubmit = async () => {
    if (!prompt || !answer.trim()) return;
    setSubmitting(true);

    const evalResult = await evaluateSubmission(prompt.question, { answer });
    updateUserScore(evalResult.scores.overall);
    saveHistoryEntry(prompt.question, prompt.context, answer, evalResult.scores, evalResult.feedback, evalResult.sampleAnswers);
    setResult(evalResult);
    setSubmitting(false);
    onComplete();
  };

  if (loadingPrompt) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Generating your interview question...</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Consulting the AI interviewer</p>
      </div>
    );
  }

  if (result) {
    return <ResultsView result={result} onClose={loadNewQuestion} />;
  }

  return (
    <div className="space-y-6">
      {/* Prompt Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
        <span className="inline-block px-2 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wide rounded mb-3">
          Current Question
        </span>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-4 font-medium">{prompt?.context}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          {prompt?.question}
        </h2>
      </div>

      {/* Pro Tip */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowProTip(!showProTip)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Need a hint? Click for a Pro Tip</h4>
          </div>
          <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">{showProTip ? 'Hide' : 'Show'}</span>
        </button>
        {showProTip && prompt?.proTip && (
          <div className="px-4 pb-4 pt-1 border-t border-amber-100/50 dark:border-amber-800/30">
            <p className="text-sm text-amber-800 dark:text-amber-300 ml-8">
              {prompt.proTip}
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-6">
        <label htmlFor="answer" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Your Answer
        </label>
        <textarea
          id="answer"
          className="w-full h-64 p-4 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed transition-colors"
          placeholder="Start by clarifying the goal, then define users..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={loadNewQuestion}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Skip Question
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || answer.trim().length === 0}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Evaluating...
              </>
            ) : (
              <>
                Submit Answer <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
