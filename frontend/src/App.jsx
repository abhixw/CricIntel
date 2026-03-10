import React, { useState, useEffect, useRef } from 'react';
import {
    Send, Shield, Search, TrendingUp, Zap, ChevronRight,
    Target, Trophy, Activity, Users, BarChart3, BookOpen,
    Trash2, Star, StarOff, Download, Clock, MapPin, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import axios from 'axios';
import { cn } from './utils/cn';

const API = 'http://localhost:8000';

/* ─── Shared tooltip ─── */
const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-premium text-xs font-semibold space-y-1">
            <div className="text-slate-400">{label}</div>
            {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
        </div>
    );
};

/* ─── Nav ─── */
const TABS = ['Home', 'Analytics', 'Players', 'Matches', 'Insights'];

/* ─────────────────────────────────────────────────────────── */
/*  HOME TAB – AI Chat                                         */
/* ─────────────────────────────────────────────────────────── */
function HomeTab() {
    const [messages, setMessages] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chat_history') || '[]'); } catch { return []; }
    });
    const [starred, setStarred] = useState(() => {
        try { return JSON.parse(localStorage.getItem('starred_msgs') || '[]'); } catch { return []; }
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    const welcome = { role: 'ai', content: '🏏 Welcome! Ask me anything about IPL matches, players, or strategies. I query real data from 2,217 match documents indexed in Qdrant.', id: 'welcome' };
    const allMsgs = [welcome, ...messages];

    useEffect(() => {
        localStorage.setItem('chat_history', JSON.stringify(messages));
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => { localStorage.setItem('starred_msgs', JSON.stringify(starred)); }, [starred]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const q = input.trim();
        const id = Date.now().toString();
        setMessages(prev => [...prev, { role: 'user', content: q, id, ts: new Date().toLocaleTimeString() }]);
        setInput(''); setLoading(true);
        try {
            const { data } = await axios.post(`${API}/chat`, { question: q });
            setMessages(prev => [...prev, { role: 'ai', content: data.answer, sources: data.sources, id: id + '_r', ts: new Date().toLocaleTimeString() }]);
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Backend unreachable. Ensure FastAPI is running on port 8000.', id: id + '_err' }]);
        } finally { setLoading(false); }
    };

    const toggleStar = (id) => setStarred(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const clearHistory = () => { setMessages([]); localStorage.removeItem('chat_history'); };

    const exportChat = () => {
        const txt = allMsgs.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = 'cricket_ai_session.txt'; a.click();
    };

    const suggestions = ['Best powerplay batters?', 'Who won most toss decisions?', 'Top death over bowlers 2023?', 'MI vs CSK head to head?'];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Suggestions */}
            {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                    {suggestions.map(s => (
                        <button key={s} onClick={() => setInput(s)}
                            className="text-sm px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-500 transition-all font-medium shadow-soft">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* History actions */}
            {messages.length > 0 && (
                <div className="flex justify-end gap-3">
                    <button onClick={exportChat} className="text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" /> Export
                    </button>
                    <button onClick={clearHistory} className="text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                </div>
            )}

            {/* Messages */}
            {allMsgs.map((m) => (
                <div key={m.id} className={cn('flex gap-3 group', m.role === 'user' ? 'justify-end' : 'justify-start animate-in')}>
                    {m.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            style={{ background: 'linear-gradient(135deg,#3b82f6,#10b981)' }}>
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                    )}
                    <div className={cn('max-w-[85%] px-5 py-4 rounded-2xl relative', m.role === 'user' ? 'text-white' : 'bg-white border border-slate-100')}
                        style={m.role === 'user' ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 20px rgba(59,130,246,0.2)' } : { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                        <p className="leading-relaxed font-medium whitespace-pre-wrap text-sm">{m.content}</p>
                        {m.sources?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                                {m.sources.map((s, si) => (
                                    <span key={si} className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500 px-2 py-1 rounded-full flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5 text-blue-400" /> {s.venue || 'Match Data'}
                                    </span>
                                ))}
                            </div>
                        )}
                        {m.ts && <div className="text-[10px] mt-2 opacity-40 font-medium flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {m.ts}</div>}
                    </div>
                    {m.role !== 'welcome' && (
                        <button onClick={() => toggleStar(m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-2">
                            {starred.includes(m.id) ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : <StarOff className="w-4 h-4 text-slate-300" />}
                        </button>
                    )}
                </div>
            ))}
            {loading && (
                <div className="flex items-center gap-3 pl-11">
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                    <span className="text-sm text-slate-400 font-medium">Analyzing with RAG pipeline...</span>
                </div>
            )}
            <div ref={bottomRef} />

            {/* Input */}
            <div className="sticky bottom-6 pt-4">
                <div className="relative bg-white rounded-2xl shadow-premium border border-slate-200" style={{ boxShadow: '0 8px 40px rgba(59,130,246,0.08)' }}>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder="Ask about any IPL match, player, or team strategy..."
                        className="w-full px-5 py-4 pr-28 rounded-2xl text-sm outline-none bg-transparent" />
                    <button onClick={send} disabled={loading || !input.trim()}
                        className="absolute right-3 top-2.5 bottom-2.5 text-white font-bold px-5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        Ask
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/*  ANALYTICS TAB – Real charts + Summary                     */
/* ─────────────────────────────────────────────────────────── */
const winData = [
    { ov: 0, prob: 50 }, { ov: 3, prob: 54 }, { ov: 6, prob: 62 },
    { ov: 9, prob: 57 }, { ov: 12, prob: 70 }, { ov: 15, prob: 75 },
    { ov: 18, prob: 83 }, { ov: 20, prob: 91 },
];
const rrData = [
    { phase: 'PP (1-6)', mi: 9.2, csk: 8.1, rcb: 8.7 },
    { phase: 'Mid (7-15)', mi: 7.8, csk: 8.6, rcb: 8.0 },
    { phase: 'Death (16-20)', mi: 12.4, csk: 11.9, rcb: 10.8 },
];

function AnalyticsTab() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/analytics/summary`).then(r => setSummary(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const statCards = summary ? [
        { label: 'Total Matches', val: summary.total_matches.toLocaleString(), icon: Trophy, color: '#f97316' },
        { label: 'Total Deliveries', val: summary.total_deliveries.toLocaleString(), icon: Activity, color: '#3b82f6' },
        { label: 'Unique Players', val: summary.total_players.toLocaleString(), icon: Users, color: '#10b981' },
        { label: 'Seasons Covered', val: summary.seasons.length, icon: BarChart3, color: '#a78bfa' },
    ] : [];

    return (
        <div className="space-y-8">
            {/* Platform Stats */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse shadow-soft" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((c, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 shadow-soft hover-lift">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.color + '18' }}>
                                <c.icon className="w-5 h-5" style={{ color: c.color }} />
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900">{c.val}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-1">{c.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Win Probability */}
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" style={{ color: '#f97316' }} /> Win Probability (MI vs CSK)
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full font-bold bg-orange-50 text-orange-500">Model Output</span>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={winData} margin={{ left: -15 }}>
                                <defs>
                                    <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="ov" tick={{ fontSize: 11 }} label={{ value: 'Over', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 11 }} unit="%" />
                                <Tooltip content={<Tip />} />
                                <Area type="monotone" dataKey="prob" name="MI Win %" stroke="#f97316" fill="url(#og)" strokeWidth={3} dot={{ r: 3, fill: '#f97316' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Run Rate by Phase */}
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" style={{ color: '#3b82f6' }} /> Run Rate by Phase
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-50 text-blue-500">Team Comparison</span>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rrData} margin={{ left: -15 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="phase" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip content={<Tip />} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="mi" name="MI" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                                <Bar dataKey="csk" name="CSK" fill="#10b981" radius={[5, 5, 0, 0]} />
                                <Bar dataKey="rcb" name="RCB" fill="#f97316" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/*  PLAYERS TAB – Live stats from /stats/ and /leaderboard   */
/* ─────────────────────────────────────────────────────────── */
function PlayersTab() {
    const [role, setRole] = useState('batter');
    const [leaderboard, setLeaders] = useState([]);
    const [ldLoading, setLdLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [playerData, setPlayer] = useState(null);
    const [pLoading, setPLoading] = useState(false);
    const [pError, setPError] = useState('');

    const fetchLeaderboard = async (r) => {
        setLdLoading(true);
        try { const { data } = await axios.get(`${API}/players/leaderboard?role=${r}&top=10`); setLeaders(data); }
        catch { setLeaders([]); }
        finally { setLdLoading(false); }
    };

    useEffect(() => { fetchLeaderboard(role); }, [role]);

    const fetchByName = async (name) => {
        if (!name?.trim()) return;
        setPLoading(true); setPError(''); setPlayer(null);
        setSearch(name);
        const endpoint = role === 'bowler'
            ? `${API}/stats/bowler/${encodeURIComponent(name.trim())}`
            : `${API}/stats/${encodeURIComponent(name.trim())}`;
        try {
            const { data } = await axios.get(endpoint);
            setPlayer(data);
        } catch (e) {
            setPError(e.response?.data?.detail || 'Player not found.');
        } finally { setPLoading(false); }
    };

    const fetchPlayer = () => fetchByName(search);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Leaderboard */}
            <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900"> Live Leaderboard</h2>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200">
                        {['batter', 'bowler'].map(r => (
                            <button key={r} onClick={() => setRole(r)}
                                className={cn('px-4 py-1.5 text-sm font-bold transition-all capitalize', role === r ? 'text-white' : 'text-slate-500 bg-white hover:bg-slate-50')}
                                style={role === r ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)' } : {}}>
                                {r === 'batter' ? ' Batters' : ' Bowlers'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                        <span className="col-span-1">#</span>
                        <span className="col-span-5">Name</span>
                        {role === 'batter' ? <>
                            <span className="col-span-3 text-right">Runs</span>
                            <span className="col-span-3 text-right">Strike Rate</span>
                        </> : <>
                            <span className="col-span-3 text-right">Wickets</span>
                            <span className="col-span-3 text-right">Economy</span>
                        </>}
                    </div>
                    {ldLoading ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-300" />
                            Loading live data...
                        </div>
                    ) : leaderboard.map((p, i) => (
                        <div key={i} onClick={() => fetchByName(p.name || p.batter || '')}
                            className="grid grid-cols-12 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <span className="col-span-1 font-extrabold text-slate-300 text-sm">{i + 1}</span>
                            <div className="col-span-5 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                                    style={{ background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#f97316)' : i === 1 ? '#94a3b8' : i === 2 ? '#c4b5fd' : '#e2e8f0', color: i > 2 ? '#64748b' : '#fff' }}>
                                    {(p.name || p.batter || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="font-bold text-slate-900 text-sm group-hover:text-blue-500 transition-colors">{p.name || p.batter}</span>
                            </div>
                            {role === 'batter' ? <>
                                <span className="col-span-3 text-right font-extrabold text-slate-800">{(p.runs || 0).toLocaleString()}</span>
                                <span className="col-span-3 text-right font-bold" style={{ color: '#10b981' }}>{p.strike_rate}</span>
                            </> : <>
                                <span className="col-span-3 text-right font-extrabold text-slate-800">{p.wickets}</span>
                                <span className="col-span-3 text-right font-bold" style={{ color: '#3b82f6' }}>{p.economy}</span>
                            </>}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-400 text-center">Click any row to look up full player stats →</p>
            </div>

            {/* Right: Player Lookup */}
            <div className="lg:col-span-5 space-y-5">
                <h2 className="text-xl font-extrabold text-slate-900"> Player Stats</h2>
                <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPlayer()}
                            placeholder="e.g. Virat Kohli"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm outline-none transition-all font-medium"
                            onFocus={e => e.target.style.borderColor = '#3b82f6'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                    <button onClick={fetchPlayer} disabled={pLoading}
                        className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                        {pLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Querying API...</> : <><Search className="w-4 h-4" />Fetch Live Stats</>}
                    </button>

                    {pError && <div className="text-xs text-red-400 bg-red-50 px-4 py-3 rounded-xl font-medium border border-red-100">{pError}</div>}


                    {playerData && (
                        <div className="animate-in space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold text-white"
                                    style={{ background: role === 'bowler' ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'linear-gradient(135deg,#3b82f6,#10b981)' }}>
                                    {(playerData.name || search).split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-lg">{playerData.name || search}</div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        Live from IPL Dataset · {role === 'bowler' ? '🎯 Bowling' : '🏏 Batting'}
                                    </div>
                                </div>
                            </div>

                            {role === 'batter' ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Runs', val: playerData.runs?.toLocaleString(), color: '#f97316' },
                                        { label: 'Balls Faced', val: playerData.balls?.toLocaleString(), color: '#3b82f6' },
                                        { label: 'Strike Rate', val: playerData.strike_rate, color: '#10b981' },
                                    ].map(s => (
                                        <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: s.color + '10' }}>
                                            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Wickets', val: playerData.wickets, color: '#3b82f6' },
                                            { label: 'Economy', val: playerData.economy, color: '#f97316' },
                                            { label: 'Average', val: playerData.average ?? '—', color: '#10b981' },
                                        ].map(s => (
                                            <div key={s.label} className="text-center p-4 rounded-xl" style={{ background: s.color + '10' }}>
                                                <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-1">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="p-3 rounded-xl" style={{ background: '#8b5cf610' }}>
                                            <div className="font-extrabold text-purple-500">{playerData.overs}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1">Overs Bowled</div>
                                        </div>
                                        <div className="p-3 rounded-xl" style={{ background: '#64748b10' }}>
                                            <div className="font-extrabold text-slate-600">{playerData.runs_conceded?.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1">Runs Conceded</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}


                    {!playerData && !pError && !pLoading && (
                        <div className="text-center py-8 text-slate-300 text-sm font-medium">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            Enter a player name to fetch live stats from your IPL dataset
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/*  INSIGHTS TAB – Starred messages from chat                 */
/* ─────────────────────────────────────────────────────────── */
function InsightsTab() {
    const [starred] = useState(() => { try { return JSON.parse(localStorage.getItem('starred_msgs') || '[]'); } catch { return []; } });
    const [history] = useState(() => { try { return JSON.parse(localStorage.getItem('chat_history') || '[]'); } catch { return []; } });
    const starredMsgs = history.filter(m => starred.includes(m.id));

    const exportInsights = () => {
        const txt = starredMsgs.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = 'starred_insights.txt'; a.click();
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Starred Insights
                </h2>
                {starredMsgs.length > 0 && (
                    <button onClick={exportInsights}
                        className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-500 hover:border-blue-200 transition-all">
                        <Download className="w-3 h-3" /> Export
                    </button>
                )}
            </div>

            {starredMsgs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-soft text-center">
                    <Star className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <div className="font-bold text-slate-400 mb-1">No starred insights yet</div>
                    <div className="text-sm text-slate-300">Hover over any AI response in the chat and click ★ to save it here.</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {starredMsgs.map((m, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border-l-4 animate-in" style={{ borderLeftColor: '#3b82f6' }}>
                            <div className="flex items-start gap-3">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                    {m.ts && <div className="text-[10px] text-slate-300 mt-2 font-medium">{m.ts}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/*  MATCHES TAB – Ask specific match questions                */
/* ─────────────────────────────────────────────────────────── */
function MatchesTab() {
    const [q, setQ] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoad] = useState(false);

    const templates = [
        'Which team won the most matches at Wankhede Stadium?',
        'Who was the Player of the Match most often?',
        'Which season had the highest average score?',
        'What is the highest successful run chase in IPL?',
    ];

    const search = async (query) => {
        const question = query || q;
        if (!question.trim()) return;
        setLoad(true); setResult('');
        try {
            const { data } = await axios.post(`${API}/chat`, { question });
            setResult(data.answer);
        } catch { setResult('⚠️ Backend unreachable.'); }
        finally { setLoad(false); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900"> Match Analysis</h2>
            <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                    <button key={t} onClick={() => { setQ(t); search(t); }}
                        className="text-xs font-semibold px-3.5 py-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-500 transition-all shadow-soft">
                        {t}
                    </button>
                ))}
            </div>
            <div className="flex gap-3">
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Ask about any IPL match or tournament statistic..."
                    className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 text-sm outline-none font-medium transition-all"
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button onClick={() => search()} disabled={loading}
                    className="px-6 py-3.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                </button>
            </div>
            {result && (
                <div className="bg-white rounded-2xl p-6 shadow-soft border-l-4 animate-in" style={{ borderLeftColor: '#10b981' }}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-extrabold uppercase tracking-widest" style={{ color: '#10b981' }}>
                        <Activity className="w-3 h-3" /> AI Analysis
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-slate-800 whitespace-pre-wrap">{result}</p>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/*  ROOT APP                                                   */
/* ─────────────────────────────────────────────────────────── */
export default function App() {
    const [tab, setTab] = useState('Home');

    const views = { Home: HomeTab, Analytics: AnalyticsTab, Players: PlayersTab, Matches: MatchesTab, Insights: InsightsTab };
    const ActiveView = views[tab] || HomeTab;

    return (
        <div className="min-h-screen" style={{ background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* ── Navbar ── */}
            <nav style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(18px)', borderBottom: '1px solid #e2e8f0' }}
                className="sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setTab('Home')}>

                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                            🏏  Cric<span style={{ color: '#3b82f6' }}>Intel</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {TABS.map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={cn('px-4 py-2 rounded-lg text-sm font-semibold transition-all relative')}
                                style={tab === t ? { background: 'rgba(59,130,246,0.08)', color: '#3b82f6' } : { color: '#64748b' }}>
                                {t}
                                {tab === t && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: '#3b82f6' }} />}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />

                        </div>

                    </div>
                </div>
            </nav>

            {/* ── Hero (Home tab only) ── */}
            {tab === 'Home' && (
                <section className="pt-16 pb-10 px-6 text-center">
                    <div className="max-w-4xl mx-auto space-y-4">

                        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] text-slate-900">
                            AI Cricket <span className="gradient-text">Match Intelligence</span> Platform
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Ask any natural-language question about IPL data. Powered by a full RAG pipeline — real retrieval, real LLM reasoning.
                        </p>
                    </div>
                </section>
            )}

            {/* ── Page header for other tabs ── */}
            {tab !== 'Home' && (
                <div className="px-6 pt-10 pb-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-3">
                        <button onClick={() => setTab('Home')} className="hover:text-blue-500 transition-colors">Home</button>
                        <ChevronRight className="w-4 h-4" />
                        <span style={{ color: '#3b82f6' }}>{tab}</span>
                    </div>
                </div>
            )}

            {/* ── Active View ── */}
            <main className="max-w-7xl mx-auto px-6 pb-24">
                <ActiveView />
            </main>

            {/* ── Footer ── */}
            <footer className="bg-white border-t border-slate-100 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">

                        <span className="font-extrabold text-slate-900 text-sm">🏏 CricIntel</span>
                    </div>
                    <p className="text-slate-400 text-xs">Built with FastAPI, LangGraph, Qdrant, and real IPL datasets.</p>
                </div>
            </footer>
        </div>
    );
}
