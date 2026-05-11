import { useState, useMemo } from 'react';
import { FX_DATABASE } from './constants/fx-database';
import { FxCategory } from './types';
import { Copy, RotateCcw, Monitor, Mic, Wind, Guitar, Settings2, Database, ListMusic, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const TARGET_STYLE_MIN = 950;
const TARGET_STYLE_MAX = 1000;
const TARGET_SCRIPT_MIN = 4900;
const TARGET_SCRIPT_MAX = 5000;

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const STYLE_TECHNICAL_TERMS = [
    'High-fidelity master', '48kHz sample rate', '24-bit resolution', 'Analog warmth saturation',
    'Professional channel strip', 'Parallel compression', 'Mid-side EQ processing', 'Transparent limiting',
    'Zero digital clipping', 'Low noise floor', 'Studio grade monitoring', 'Brickwall peak protection',
    'Multiband spectral control', 'Phase-coherent imaging', 'Harmonic excitation', 'Air-band boost',
    'Nuanced timbral detail', 'Vintage hardware emulation', 'Pristine audio capture', 'Precision clocking',
    'Stereo field width optimization', 'Dynamic headroom management', 'Frequency balance calibration',
    'Room acoustics simulation', 'Natural reverb tails', 'Time-aligned transients', 'Organic performance artifacts',
    'Detailed articulation cues', 'Dynamic accentuation', 'Rhythmic syncopation', 'Vocal booth isolation',
    'Close-mic intimacy', 'Broad soundstage width', 'Frequency-selective delay', 'Soft-knee dynamics',
    'Transient shaper punch', 'Subtle pitch drift', 'Tape-stop transitions', 'Cross-faded layers'
];

const SCRIPT_TECHNICAL_TERMS = [
    'Structural phrasing coherence', 'Rhythmic pocket alignment', 'Metric precision timing',
    'Verse transition logic', 'Chorus modulation depth', 'Bridge structural integrity', 
    'Dynamic song progression', 'Melodic variation patterns', 'Harmonic layered textures', 
    'Arrangement density control', 'Compositional flow optimization', 'Tempo-syncopated layering',
    'Sectional narrative arc', 'Intricate cadence variations', 'Polyphonic arrangement depth',
    'Structural tension and release', 'Syncopated phrasing patterns', 'Thematic motif consistency'
];

export default function App() {
    const [styleInput, setStyleInput] = useState('');
    const [vocalInput, setVocalInput] = useState('');
    const [atmosphereInput, setAtmosphereInput] = useState('');
    const [instrumentalInput, setInstrumentalInput] = useState('');
    const [lyricsInput, setLyricsInput] = useState('');
    const [soundsMode, setSoundsMode] = useState(false);
    const [activeField, setActiveField] = useState<string>('style'); 
    const [isAILoading, setIsAILoading] = useState(false);
    const [selectedFx, setSelectedFx] = useState<Record<FxCategory, Set<string>>>({
        vocal: new Set(),
        instrumental: new Set(),
        ambience: new Set(),
        production: new Set(),
    });
    const [showToast, setShowToast] = useState(false);

    const handleSmartOptimize = async (target: 'style' | 'script') => {
        if (isAILoading) return;
        setIsAILoading(true);
        try {
            const prompt = target === 'style' 
                ? `Act as a Suno AI Prompt Expert. Optimize the following Style description for Suno v5.5. 
                   Focus on high-fidelity, studio-grade technical terms. 
                   Current Style: "${styleInput}"
                   Requirement: Provide a dense, professional string of descriptors (100-200 words).`
                : `Act as a Suno AI Prompt Expert. Create detailed [TAGS] and arrangement notes for these lyrics or script.
                   Lyrics/Script: "${lyricsInput}"
                   Vocal Info: "${vocalInput}"
                   Requirement: Provide professional Suno v5.5 tags like [VERSE 1 - MALE, RAW] and transitions.`;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    systemInstruction: "You are a professional music producer and Suno v5.5 prompt engineering specialist. You only return the optimized string without conversational text."
                }
            });

            if (response.text) {
                if (target === 'style') setStyleInput(response.text.trim());
                else setLyricsInput(response.text.trim());
            }
        } catch (error) {
            console.error("AI Optimization failed:", error);
        } finally {
            setIsAILoading(false);
        }
    };

    const injectTerm = (term: string) => {
        const updateMap: Record<string, [string, (v: string) => void]> = {
            style: [styleInput, setStyleInput],
            vocal: [vocalInput, setVocalInput],
            atmosphere: [atmosphereInput, setAtmosphereInput],
            instrumental: [instrumentalInput, setInstrumentalInput],
            lyrics: [lyricsInput, setLyricsInput]
        };
        const [curr, setter] = updateMap[activeField] || [styleInput, setStyleInput];
        setter(curr ? `${curr}. ${term}` : term);
    };

    const handleFxToggle = (category: FxCategory, id: string) => {
        setSelectedFx((prev) => {
            const next = { ...prev, [category]: new Set(prev[category]) };
            if (next[category].has(id)) next[category].delete(id);
            else next[category].add(id);
            return next;
        });
    };

    const getSelectedFxDescriptions = (category: FxCategory) => {
        const descriptions: string[] = [];
        selectedFx[category].forEach((id) => {
            const fx = FX_DATABASE[category].find((f) => f.id === id);
            if (fx) descriptions.push(`[${fx.label}]: ${fx.description}`);
        });
        return descriptions;
    };

    const inflate = (text: string, min: number, max: number, terms: string[]) => {
        let result = text.trim();
        if (result.length >= max) return result.slice(0, max);
        
        let i = 0;
        while (result.length < min && i < terms.length) {
            const pad = (result.length > 0 ? '. ' : '') + terms[i];
            if (result.length + pad.length <= max) result += pad;
            i++;
        }
        return result;
    };

    const generatedStyle = useMemo(() => {
        let text = styleInput.trim();
        const prod = getSelectedFxDescriptions('production');
        
        // Check for content/intent before adding Sounds Mode prefix or inflating
        if (!text && !soundsMode && prod.length === 0) {
            return "";
        }

        if (soundsMode) {
            const soundsPrefix = "[Solo Sound Effect]. [No Music, Sound FX only]";
            text = (text ? soundsPrefix + ". " + text : soundsPrefix);
        }
        
        if (prod.length > 0) text += (text ? '. ' : '') + prod.join('. ');
        return inflate(text, TARGET_STYLE_MIN, TARGET_STYLE_MAX, STYLE_TECHNICAL_TERMS);
    }, [styleInput, selectedFx.production, soundsMode]);

    const generatedScript = useMemo(() => {
        const vFx = getSelectedFxDescriptions('vocal');
        const iFx = getSelectedFxDescriptions('instrumental');
        const aFx = getSelectedFxDescriptions('ambience');

        let globalDefinition = '';
        
        // 1. Voice Definition / Mood
        if (vocalInput.trim() || vFx.length > 0) {
            const vocalContent = vocalInput.trim();
            // If user didn't specify vocals, it's an "established voice" mood
            const label = vocalContent ? "VOICE DEFINITIONS / ROLES" : "VOCAL DELIVERY & MOOD";
            globalDefinition += `[${label}:] ${vocalContent}`;
            if (vFx.length > 0) globalDefinition += (vocalContent ? '. ' : '') + vFx.slice(0, 5).join('. ');
            globalDefinition += '\n';
        }

        // 2. Global Instrumental Arrangement
        if (instrumentalInput.trim() || iFx.length > 0) {
            globalDefinition += `[GLOBAL ARRANGEMENT:] ${instrumentalInput.trim()}`;
            if (iFx.length > 0) globalDefinition += (instrumentalInput.trim() ? '. ' : '') + iFx.slice(0, 5).join('. ');
            globalDefinition += '\n';
        }

        // 3. Atmosphere / Intro Context
        if (atmosphereInput.trim() || aFx.length > 0) {
            globalDefinition += `[ATMOSPHERE & INTRO:] ${atmosphereInput.trim()}`;
            if (aFx.length > 0) globalDefinition += (atmosphereInput.trim() ? '. ' : '') + aFx.slice(0, 5).join('. ');
            globalDefinition += '\n';
        }

        if (globalDefinition) globalDefinition += '\n';

        const allRemaining = [...vFx.slice(5), ...iFx.slice(5), ...aFx.slice(5)];
        let notes = allRemaining.length > 0 ? `\n\n[SUPPLEMENTARY PERFORMANCE NOTES: ${allRemaining.join('. ')}]` : '';

        const full = (globalDefinition + lyricsInput.trim() + notes).trim();
        
        // CRITICAL FIX: If the user hasn't provided lyrics or core arrangement notes, 
        // the Script Buffer should be empty (0000). We only inflate if there is substance.
        if (!lyricsInput.trim() && !globalDefinition.trim() && !notes.trim()) {
            return "";
        }

        return inflate(full, TARGET_SCRIPT_MIN, TARGET_SCRIPT_MAX, SCRIPT_TECHNICAL_TERMS);
    }, [lyricsInput, vocalInput, atmosphereInput, instrumentalInput, selectedFx]);

    const copyAll = async () => {
        const out = `=== STYLE BOX (1000 Chars) ===\n${generatedStyle}\n\n=== SCRIPT BOX (5000 Chars) ===\n${generatedScript}`;
        await navigator.clipboard.writeText(out);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const reset = () => {
        setStyleInput(''); setVocalInput(''); setAtmosphereInput(''); setInstrumentalInput(''); setLyricsInput('');
        setSoundsMode(false);
        setSelectedFx({ vocal: new Set(), instrumental: new Set(), ambience: new Set(), production: new Set() });
    };

    return (
        <div className="flex flex-col min-h-screen bg-bg-primary font-mono text-sm selection:bg-accent-primary/30">
            {/* Engineering Header */}
            <header className="border-b border-border-color bg-bg-secondary p-4 sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent-gradient rounded flex items-center justify-center text-xl shadow-lg ring-1 ring-white/10">🎵</div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tighter text-white uppercase">SUNO PROMPT OPTIMYZER BY DJ H SALCIDO</h1>
                            <div className="flex gap-3 mt-0.5">
                                <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 rounded border border-border-color">SYSTEM READY</span>
                                <span className="text-[10px] text-accent-secondary animate-pulse">V5.5 ENGINE ACTIVE</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 bg-bg-tertiary/50 py-2 rounded-lg border border-border-color">
                        <Stat val={generatedStyle.length} label="STYLE 1K" target={TARGET_STYLE_MAX} />
                        <Stat val={generatedScript.length} label="SCRIPT 5K" target={TARGET_SCRIPT_MAX} />
                        <Stat val={(Object.values(selectedFx) as Set<string>[]).reduce((s, set) => s + set.size, 0)} label="FX NODES" />
                        <Stat val={lyricsInput.length} label="LETRA RAW" />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
                <div className="space-y-8">
                    {/* SECTION 1: STYLE DEFINITION */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h2 className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-[0.2em] uppercase">
                                <Settings2 className="w-4 h-4 text-accent-primary" /> 01. Style Console (1000 Chars)
                            </h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleSmartOptimize('style')}
                                    disabled={isAILoading}
                                    className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border border-accent-primary/30 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary/10 transition-all disabled:opacity-50"
                                >
                                    {isAILoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                    SMART OPTIMIZE STYLE
                                </button>
                                <button 
                                    onClick={() => setSoundsMode(!soundsMode)}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${soundsMode ? 'bg-accent-primary/20 border-accent-primary text-accent-primary' : 'bg-bg-tertiary border-border-color text-text-muted hover:border-text-muted'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${soundsMode ? 'bg-accent-primary animate-pulse' : 'bg-text-muted'}`} />
                                    SOUNDS FX MODE {soundsMode ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                        <div className="card border-l-4 border-l-accent-primary">
                            <div className="card-header bg-bg-tertiary/20">
                                <span className="text-[11px] font-bold text-text-secondary">GLOBAL GENRE & MASTERING</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${generatedStyle.length > 900 ? 'bg-success/20 text-success' : 'bg-bg-tertiary text-text-muted'}`}>
                                    {generatedStyle.length}/1000
                                </span>
                            </div>
                            <div className="p-4">
                                <textarea 
                                    value={styleInput} 
                                    onChange={e => setStyleInput(e.target.value)}
                                    onFocus={() => setActiveField('style')}
                                    placeholder="Enter primary style, genre, and overall production vibe here..."
                                    className={`min-h-[100px] border-none focus:ring-0 p-0 bg-transparent resize-none leading-relaxed transition-opacity ${activeField === 'style' ? 'opacity-100' : 'opacity-60'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <h2 className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-[0.2em] uppercase">
                                <ListMusic className="w-4 h-4 text-purple-400" /> 02. Script Builder (5000 Chars)
                            </h2>
                            <button 
                                onClick={() => handleSmartOptimize('script')}
                                disabled={isAILoading}
                                className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border border-purple-400/30 bg-purple-400/5 text-purple-400 hover:bg-purple-400/10 transition-all disabled:opacity-50"
                            >
                                {isAILoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                SMART OPTIMIZE SCRIPT
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputCard icon={<Mic className="w-3 h-3"/>} title="Vocal Definition/Roles" val={vocalInput} set={setVocalInput} color="purple" onFocus={() => setActiveField('vocal')} active={activeField === 'vocal'} placeholder="e.g., [VOICE A - RAW, YELLING], [VOICE B - EUPHORIC TRANCE]..." />
                            <InputCard icon={<Wind className="w-3 h-3"/>} title="Atmospheric Setup" val={atmosphereInput} set={setAtmosphereInput} color="blue" onFocus={() => setActiveField('atmosphere')} active={activeField === 'atmosphere'} placeholder="e.g., [RHYTHMIC VINYL SCRATCH LOOP], [DISTANT SUB-BASS PULSE]..." />
                            <InputCard icon={<Guitar className="w-3 h-3"/>} title="Global Arrangement" val={instrumentalInput} set={setInstrumentalInput} color="green" onFocus={() => setActiveField('instrumental')} active={activeField === 'instrumental'} placeholder="e.g., [CLASSIC GRUNGE RIFF, HEAVY FUZZ], [130 BPM]..." />
                        </div>
                        <div className="card mt-4">
                            <div className="card-header bg-bg-tertiary/20">
                                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Literal Script & Inline Tags</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${generatedScript.length > 4800 ? 'bg-success/20 text-success' : 'bg-bg-tertiary text-text-muted'}`}>
                                    TOTAL SCRIPT: {generatedScript.length}/5000
                                </span>
                            </div>
                            <div className="p-4">
                                <textarea 
                                    value={lyricsInput} 
                                    onChange={e => setLyricsInput(e.target.value)}
                                    onFocus={() => setActiveField('lyrics')}
                                    placeholder="e.g.,&#10;[VERSE 1 -] [VOICE A - RAW, FILTERED HOUSE KICK]&#10;Lord up on guns, bring your friends...&#10;&#10;[CHORUS / DROP 1 -] [ALL VOICES]&#10;With the lights out..."
                                    className={`min-h-[250px] border-none focus:ring-0 p-0 bg-transparent resize-y leading-loose transition-opacity ${activeField === 'lyrics' ? 'opacity-100' : 'opacity-60'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: FX DATABASE */}
                    <div className="space-y-4">
                        <h2 className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-[0.2em] uppercase">
                            <Database className="w-4 h-4 text-accent-secondary" /> 03. Engineering FX Matrix
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {(Object.keys(FX_DATABASE) as FxCategory[]).map(cat => (
                                <div key={cat} className="fx-category bg-bg-secondary/40 border-border-color">
                                    <div className="fx-category-header flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">{cat === 'vocal' ? '🎤' : cat === 'instrumental' ? '🎸' : cat === 'ambience' ? '🌪️' : '🎛️'}</span>
                                            <h4 className="text-[10px] font-black uppercase text-text-secondary">{cat} Nodes</h4>
                                        </div>
                                        <span className="text-[9px] text-text-muted bg-bg-primary px-1.5 rounded">{selectedFx[cat].size} / {FX_DATABASE[cat].length}</span>
                                    </div>
                                    <div className="fx-options grid grid-cols-1 gap-1 max-h-[160px]">
                                        {FX_DATABASE[cat].map(fx => (
                                            <label 
                                                key={fx.id} 
                                                className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all border ${selectedFx[cat].has(fx.id) ? 'bg-accent-primary/10 border-accent-primary/30' : 'bg-bg-tertiary/30 border-transparent hover:bg-bg-tertiary'}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <input type="checkbox" className="hidden" checked={selectedFx[cat].has(fx.id)} onChange={() => handleFxToggle(cat, fx.id)} />
                                                    <div className={`w-3 h-3 rounded-sm border ${selectedFx[cat].has(fx.id) ? 'bg-accent-primary border-accent-primary' : 'border-border-color'}`} />
                                                    <span className={`text-[10px] truncate ${selectedFx[cat].has(fx.id) ? 'text-text-primary' : 'text-text-muted'}`} title={fx.description}>{fx.label}</span>
                                                </div>
                                                <span className="text-[8px] opacity-0 group-hover:opacity-40 transition-opacity text-right">INJECT</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: SUNO v5.5 TECHNICAL REFERENCE */}
                    <div className="p-4 bg-bg-secondary/20 rounded border border-border-color space-y-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-accent-secondary" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">v5.5 Engine Reference: "Private FX" & Sounds</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] leading-relaxed text-text-muted">
                            <div className="space-y-2">
                                <p className="text-text-secondary font-bold">🛠️ Digital Isolation Protocol</p>
                                <p>Suno v5.5 allows precise audio isolation. Use the <strong className="text-accent-primary">SOUNDS FX MODE</strong> to generate one-shots (drums, hits) and loops without background music.</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong className="text-text-secondary">Sounds Option:</strong> Dedicated section for professional quality samples.</li>
                                    <li><strong className="text-text-secondary">Custom Models:</strong> Train using up to 24 tracks of private assets.</li>
                                    <li><strong className="text-text-secondary">Sample Mode:</strong> Upload up to 60s for organic expansion.</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <p className="text-text-secondary font-bold">💎 Command Precision</p>
                                <p>Language comprehension is now ~90%. Instead of generic "rain", specify context for better results:</p>
                                <ul className="list-none space-y-2">
                                    <li className="bg-bg-tertiary/40 p-2 rounded border border-border-color/30 italic">"[Soft rain on a tin roof, distant thunder during night]"</li>
                                    <li className="bg-bg-tertiary/40 p-2 rounded border border-border-color/30 italic">"[Solo Sound Effect] or [No Music, Sound FX only]"</li>
                                </ul>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border-color/30 space-y-4">
                             <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Active Knowledge Matrix (Click to Inject)</p>
                             
                             <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <span className="text-[8px] font-bold text-accent-primary uppercase tracking-tighter">Style & Mastering Layers</span>
                                    <div className="flex flex-wrap gap-1.5 opacity-80">
                                        {STYLE_TECHNICAL_TERMS.map(term => (
                                            <button 
                                                key={term} 
                                                onClick={() => injectTerm(term)}
                                                className="text-[8px] bg-bg-tertiary px-2 py-0.5 rounded border border-border-color/20 text-text-muted hover:border-accent-primary hover:text-accent-primary transition-all cursor-pointer active:scale-95"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-tighter">Arrangement & Script Cues</span>
                                    <div className="flex flex-wrap gap-1.5 opacity-80">
                                        {SCRIPT_TECHNICAL_TERMS.map(term => (
                                            <button 
                                                key={term} 
                                                onClick={() => injectTerm(term)}
                                                className="text-[8px] bg-bg-tertiary px-2 py-0.5 rounded border border-border-color/20 text-text-muted hover:border-purple-400 hover:text-purple-400 transition-all cursor-pointer active:scale-95"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR PREVIEW */}
                <aside className="space-y-6 xl:sticky xl:top-[100px] h-fit">
                    <div className="card shadow-2xl overflow-hidden bg-bg-secondary relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-gradient opacity-50" />
                        <div className="p-4 border-b border-border-color bg-bg-tertiary/50">
                            <h3 className="text-xs font-black tracking-widest text-text-primary flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-accent-secondary" /> OUTPUT TERMINAL
                            </h3>
                        </div>
                        <div className="p-4 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-[9px] font-bold uppercase tracking-tighter">
                                    <span className="text-accent-primary">Style Buffer (1000)</span>
                                    <span className="text-text-muted">CRC: {generatedStyle.length}</span>
                                </div>
                                <div className="p-3 bg-bg-primary rounded border border-border-color/50 text-[11px] leading-relaxed text-text-secondary h-[120px] overflow-y-auto whitespace-pre-wrap selection:bg-accent-primary/50">
                                    {generatedStyle || "Waiting for data..."}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-[9px] font-bold uppercase tracking-tighter">
                                    <span className="text-purple-400">Script Buffer (5000)</span>
                                    <span className="text-text-muted">LEN: {generatedScript.length}</span>
                                </div>
                                <div className="p-3 bg-bg-primary rounded border border-border-color/50 text-[11px] leading-relaxed text-text-secondary h-[240px] overflow-y-auto whitespace-pre-wrap selection:bg-accent-primary/50">
                                    {generatedScript || "Waiting for input..."}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={reset} className="flex-1 py-3 bg-bg-tertiary border border-border-color rounded font-bold text-xs hover:bg-bg-hover transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                            <RotateCcw className="w-3.5 h-3.5" /> Clear
                        </button>
                        <button onClick={copyAll} className="flex-[2] py-3 bg-accent-gradient text-white rounded font-bold text-xs shadow-lg hover:shadow-accent-primary/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95">
                            <Copy className="w-3.5 h-3.5" /> Synchronize & Copy
                        </button>
                    </div>

                    <div className="p-4 bg-bg-tertiary/30 rounded-lg border border-dashed border-border-color text-[10px] leading-relaxed text-text-muted">
                        <p className="font-bold text-text-secondary mb-2 uppercase tracking-wide">Protocol Guidelines:</p>
                        <ul className="space-y-1.5 list-none pl-1">
                            <li className="flex gap-2"><span>[1]</span> Paste Style Buffer into Suno "Style" terminal.</li>
                            <li className="flex gap-2"><span>[2]</span> Paste Script Buffer into Suno "Lyrics" terminal.</li>
                            <li className="flex gap-2"><span>[3]</span> v5.5 Engine responds best to higher character density.</li>
                        </ul>
                    </div>
                </aside>
            </main>

            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="toast show flex items-center gap-3 !bg-success !text-bg-primary font-black uppercase text-[10px] tracking-widest py-3 px-6 rounded-full shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                        <div className="w-4 h-4 bg-bg-primary/20 rounded-full flex items-center justify-center">✓</div>
                        Buffers Uploaded to Clipboard
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Stat({ val, label, target }: { val: number; label: string; target?: number }) {
    const isGood = target ? val >= target * 0.9 : true;
    return (
        <div className="flex flex-col items-center min-w-0">
            <span className={`text-base font-black tracking-tighter ${isGood ? 'text-accent-primary' : 'text-text-muted'}`}>{val}</span>
            <span className="text-[8px] font-bold text-text-muted tracking-wide whitespace-nowrap">{label}</span>
        </div>
    );
}

function InputCard({ icon, title, val, set, color, placeholder, onFocus, active }: any) {
    const c = color === 'purple' ? 'border-t-purple-500' : color === 'blue' ? 'border-t-blue-500' : 'border-t-green-500';
    const ic = color === 'purple' ? 'text-purple-400' : color === 'blue' ? 'text-blue-400' : 'text-green-400';
    return (
        <div className={`card ${c} border-t-2 transition-all ${active ? 'ring-1 ring-white/10' : 'opacity-70'}`}>
            <div className="px-3 py-1.5 bg-bg-tertiary/40 border-b border-border-color flex items-center gap-2">
                <span className={ic}>{icon}</span>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted">{title}</h4>
            </div>
            <textarea 
                value={val} 
                onChange={e => set(e.target.value)} 
                onFocus={onFocus}
                className="w-full bg-transparent border-none focus:ring-0 p-3 text-[10px] leading-normal min-h-[60px] resize-none" 
                placeholder={placeholder || "..."} 
            />
        </div>
    );
}
