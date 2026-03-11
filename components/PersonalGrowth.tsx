import React, { useState, useEffect } from 'react';
import { getUserHistory } from '../services/mockBackend';
import { HistoryEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Video, ChevronDown, ChevronUp } from 'lucide-react';

const PersonalGrowth: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getUserHistory());
  }, []);

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No practice history yet</h3>
        <p className="text-slate-500 mt-2">Complete a practice session to see your growth analytics here.</p>
      </div>
    );
  }

  // Calculate averages for the insight
  const recentHistory = history.slice(0, 10); // Look at last 10 entries for insights
  const averages = {
    strategicThinking: recentHistory.reduce((acc, curr) => acc + curr.scores.strategicThinking, 0) / recentHistory.length,
    creativity: recentHistory.reduce((acc, curr) => acc + curr.scores.creativity, 0) / recentHistory.length,
    clarity: recentHistory.reduce((acc, curr) => acc + curr.scores.clarity, 0) / recentHistory.length,
    analyticalThinking: recentHistory.reduce((acc, curr) => acc + curr.scores.analyticalThinking, 0) / recentHistory.length,
    customerEmpathy: recentHistory.reduce((acc, curr) => acc + curr.scores.customerEmpathy, 0) / recentHistory.length,
  };

  // Find the weakest skill
  let weakestSkill = 'strategicThinking';
  let minScore = averages.strategicThinking;

  Object.entries(averages).forEach(([skill, score]) => {
    if (score < minScore) {
      minScore = score;
      weakestSkill = skill;
    }
  });

  const skillNames: Record<string, string> = {
    strategicThinking: 'Strategic Thinking',
    creativity: 'Creativity',
    clarity: 'Clarity & Specificity',
    analyticalThinking: 'Analytical Thinking',
    customerEmpathy: 'Customer Empathy',
  };

  const skillResources: Record<string, { url: string, title: string }[]> = {
    strategicThinking: [
      { url: 'https://www.youtube.com/watch?v=7gaPPrAd7nc', title: 'What it takes to become a top 1% PM' },
      { url: 'https://www.youtube.com/watch?v=iuYlGRnC7J8', title: 'A Plan Is Not a Strategy' }
    ],
    creativity: [
      { url: 'https://www.youtube.com/watch?v=-OMJINQIZzA', title: 'How to Generate Ideas with the SCAMPER Technique' },
      { url: 'https://www.youtube.com/watch?v=q8d9uuO1Cf4', title: 'Value Props: Create a Product People Will Actually Buy' }
    ],
    clarity: [
      { url: 'https://www.youtube.com/watch?v=A39P5zA_qbE', title: 'Eight Communication skills you must master as a product manager' },
      { url: 'https://www.youtube.com/watch?v=MIuTwMu9Pec', title: 'The Power of Clarity: Building Effective Product Teams' }
    ],
    analyticalThinking: [
      { url: 'https://www.youtube.com/watch?v=zhem0-_Awxo', title: 'Product Metrics 101' },
      { url: 'https://www.youtube.com/watch?v=N-Igkw7__z0', title: 'Analytics for Product Managers Masterclass' }
    ],
    customerEmpathy: [
      { url: 'https://www.youtube.com/watch?v=ojhHrs-kmI0', title: 'Webinar: Customer Empathy 101' },
      { url: 'https://www.youtube.com/watch?v=ymgGr1_M-xY', title: 'Customer Discovery for Product Managers' }
    ],
  };

  const chartData = history.slice().reverse().map((entry, index) => ({
    name: `Session ${index + 1}`,
    score: entry.scores.overall,
    date: new Date(entry.date).toLocaleDateString(),
  }));

  const radarData = [
    { subject: 'Strategy', A: averages.strategicThinking },
    { subject: 'Creativity', A: averages.creativity },
    { subject: 'Clarity', A: averages.clarity },
    { subject: 'Analysis', A: averages.analyticalThinking },
    { subject: 'Empathy', A: averages.customerEmpathy },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Insight Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Growth Insight</h3>
            <p className="text-slate-700 mt-1">
              Based on your recent sessions, your weakest area is <span className="font-bold text-indigo-700">{skillNames[weakestSkill]}</span> (Avg: {Math.round(minScore)}/100). 
              Improving this will significantly boost your overall product sense.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {skillResources[weakestSkill].map((resource, idx) => (
                <a 
                  key={idx}
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
                >
                  <Video className="w-4 h-4 text-red-500" />
                  Watch: {resource.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-6">Overall Score Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills Radar/Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-6">Average Skill Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="subject" type="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${Math.round(value)}/100`, 'Average']}
                />
                <Bar dataKey="A" radius={[0, 4, 4, 0]} barSize={24}>
                  {radarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.A > 80 ? '#4f46e5' : entry.A > 60 ? '#8b5cf6' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Practice History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {history.map((entry) => (
            <div key={entry.id} className="group">
              <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      Score: {entry.scores.overall}/100
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{entry.question}</h4>
                </div>
                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                  {expandedRow === entry.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedRow === entry.id && (
                <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Answer</h5>
                      <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto mb-6">
                        {entry.answer}
                      </div>

                      {entry.sampleAnswers && entry.sampleAnswers.length > 0 && (
                        <>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Senior PM Response</h5>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto mb-6">
                            {entry.sampleAnswers.find(s => s.level === 'AI Senior PM')?.content || 'Not available'}
                          </div>

                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI World-Class PM Response</h5>
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {entry.sampleAnswers.find(s => s.level === 'AI World-Class PM')?.content || 'Not available'}
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Feedback</h5>
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900 mb-4">
                        {entry.feedback}
                      </div>
                      
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scores</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(entry.scores).filter(([k]) => k !== 'overall').map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                            <span className="text-slate-600">{skillNames[key] || key}</span>
                            <span className="font-bold text-slate-900">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PersonalGrowth;
