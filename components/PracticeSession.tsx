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
  const currentSample = result.sampleAnswers.find(s => s.level === activeSample) || result.sampleAnswers[0];

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
      <div className="bg-indigo-900 text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="text-center md:text-left">
             <h2 className="text-3xl font-bold">Score: {result.scores.overall}/100</h2>
             <p className="text-indigo-200 mt-2 max-w-xl leading-relaxed">"{result.feedback}"</p>
         </div>
         <div className="flex gap-3">
             <button onClick={handleShare} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors">
                 Share
             </button>
             <button onClick={onClose} className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors">
                 Next Question
             </button>
         </div>
      </div>

      {/* Detailed Metrics Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
         <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Breakdown</h3>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value}/100`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                        {metrics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#4f46e5' : entry.score > 60 ? '#8b5cf6' : '#cbd5e1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Sample Answers Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h3 className="font-bold text-slate-900">AI Sample Responses</h3>
                <p className="text-xs text-slate-500">See how different levels approach this question.</p>
             </div>
             <div className="flex bg-slate-200 rounded-lg p-1">
                 {result.sampleAnswers.map((s) => (
                     <button
                        key={s.level}
                        onClick={() => setActiveSample(s.level)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeSample === s.level ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
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
                        activeSample.includes('World-Class') ? 'bg-purple-100 text-purple-800' : 
                        activeSample.includes('Senior') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {activeSample}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">Score: {currentSample.scores.overall}/100</span>
                </div>
             </div>
             <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                 <p className="whitespace-pre-line">{currentSample.content}</p>
             </div>
         </div>
      </div>
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

  // Auto-start on mount
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
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-slate-200">
         <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
         <h3 className="text-lg font-medium text-slate-900">Generating your interview question...</h3>
         <p className="text-slate-500 mt-1">Consulting the AI interviewer</p>
      </div>
    );
  }

  if (result) {
    return <ResultsView result={result} onClose={loadNewQuestion} />;
  }

  return (
    <div className="space-y-6">
        {/* Prompt Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide rounded mb-3">
                Current Question
            </span>
            <p className="text-slate-600 text-lg mb-4 font-medium">{prompt?.context}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {prompt?.question}
            </h2>
        </div>

        {/* Pro Tip */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg overflow-hidden">
            <button 
                onClick={() => setShowProTip(!showProTip)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-100/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-amber-900">Need a hint? Click for a Pro Tip</h4>
                </div>
                <span className="text-amber-600 text-sm font-medium">{showProTip ? 'Hide' : 'Show'}</span>
            </button>
            {showProTip && prompt?.proTip && (
                <div className="px-4 pb-4 pt-1 border-t border-amber-100/50">
                    <p className="text-sm text-amber-800 ml-8">
                        {prompt.proTip}
                    </p>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-2">
                Your Answer
            </label>
            <textarea
                id="answer"
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-slate-50 text-slate-900 placeholder:text-slate-400 leading-relaxed"
                placeholder="Start by clarifying the goal, then define users..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
            />
            
            <div className="mt-6 flex justify-between items-center">
                <button 
                    onClick={loadNewQuestion}
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center gap-1"
                >
                    <RefreshCw className="w-4 h-4" /> Skip Question
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || answer.trim().length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none"
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
