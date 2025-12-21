import { useState } from 'react'
import { Zap, Sparkles, AlertCircle, RotateCcw } from 'lucide-react'
import PromptInput from './components/PromptInput'
import PromptOutput from './components/PromptOutput'
import PulseLoader from './components/PulseLoader'
import AuraBackground from './components/AuraBackground'
import ProcessHUD from './components/ProcessHUD'

function App() {
    const [inputPrompt, setInputPrompt] = useState('')
    const [outputPrompt, setOutputPrompt] = useState('')
    const [evaluation, setEvaluation] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [phase, setPhase] = useState(null)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const handleSupercharge = async () => {
        if (!inputPrompt.trim()) return

        setIsLoading(true)
        setError(null)
        setPhase('evaluating')
        setOutputPrompt('')
        setEvaluation('')

        try {
            const response = await fetch('/api/supercharge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: inputPrompt }),
            })

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later (5 requests per 12 hours).')
                }
                throw new Error('Failed to process prompt. Please try again.')
            }

            const data = await response.json()

            setEvaluation(data.evaluation || '')
            setPhase('refining')

            await new Promise(resolve => setTimeout(resolve, 800))

            setOutputPrompt(data.refined_prompt || data.result || '')
            setPhase('complete')
        } catch (err) {
            setError(err.message)
            setPhase(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!outputPrompt) return
        await navigator.clipboard.writeText(outputPrompt)
        setCopied(true)
        setShowToast(true)
        setTimeout(() => {
            setCopied(false)
            setShowToast(false)
        }, 2000)
    }

    const handleReset = () => {
        setInputPrompt('')
        setOutputPrompt('')
        setEvaluation('')
        setPhase(null)
        setError(null)
    }

    return (
        <div className="min-h-screen relative">
            {/* Animated Aura Background */}
            <AuraBackground />

            {/* Header */}
            <header className="relative z-10 border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-electric-blue/10 border border-electric-blue/20 glow-blue">
                            <Zap className="w-7 h-7 text-electric-blue" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">PromptElevate</h1>
                            <p className="text-sm text-white/40 tracking-wide">Transform prompts from mediocre to professional</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                <div className="space-y-8">
                    {/* Hero Section */}
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Bridge the <span className="gradient-text">AI Quality Gap</span>
                        </h2>
                        <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
                            Enter your "Human-Lazy" prompt below. Our Meta-Prompting engine will
                            evaluate it across <span className="text-electric-blue font-semibold">35 criteria</span> and
                            refine it into an elite, AI-optimized instruction.
                        </p>
                    </div>

                    {/* Input Section */}
                    <PromptInput
                        value={inputPrompt}
                        onChange={setInputPrompt}
                        onSubmit={handleSupercharge}
                        isLoading={isLoading}
                    />

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleSupercharge}
                            disabled={isLoading || !inputPrompt.trim()}
                            className="btn-primary flex items-center gap-3 text-lg px-10 py-4"
                        >
                            {isLoading ? (
                                <>
                                    <PulseLoader />
                                    <span className="font-mono tracking-wide">
                                        {phase === 'evaluating' ? 'ANALYZING...' : 'REFINING...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Supercharge</span>
                                </>
                            )}
                            {isLoading && <div className="pulse-ring" />}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="glass-card p-4 border-red-500/30 bg-red-500/10 flex items-center gap-3 animate-fade-in">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Process HUD (shows during loading) */}
                    <ProcessHUD isActive={isLoading} phase={phase} />

                    {/* Phase Indicator */}
                    {phase && !isLoading && (
                        <div className="flex justify-center animate-fade-in">
                            <div className={`phase-indicator ${phase === 'evaluating' ? 'phase-evaluating' :
                                    phase === 'refining' ? 'phase-refining' :
                                        'phase-complete'
                                }`}>
                                {phase === 'evaluating' && '🔍 Evaluating across 35 criteria...'}
                                {phase === 'refining' && '✨ Applying refinements...'}
                                {phase === 'complete' && '🎯 Transformation complete!'}
                            </div>
                        </div>
                    )}

                    {/* Output Section */}
                    {(outputPrompt || evaluation) && !isLoading && (
                        <div className="space-y-6 animate-slide-up">
                            {/* Evaluation Summary (collapsible) */}
                            {evaluation && (
                                <details className="glass-card p-6">
                                    <summary className="cursor-pointer text-white/80 font-medium flex items-center gap-2">
                                        <span className="text-xs font-mono tracking-widest uppercase text-white/50">📊 Evaluation Report</span>
                                        <span className="text-xs text-white/30">(click to expand)</span>
                                    </summary>
                                    <div className="mt-4 pt-4 border-t border-white/10 output-area text-white/70 text-sm max-h-96 overflow-y-auto">
                                        {evaluation}
                                    </div>
                                </details>
                            )}

                            {/* Refined Prompt */}
                            {outputPrompt && (
                                <PromptOutput
                                    content={outputPrompt}
                                    onCopy={handleCopy}
                                    copied={copied}
                                />
                            )}

                            {/* Reset Button */}
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors group"
                                >
                                    <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-sm">Start Over</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 mt-20">
                <div className="max-w-5xl mx-auto px-6 py-8 text-center text-white/25 text-sm">
                    <p className="font-mono tracking-wide">No sign-up required • 5 requests per 12 hours per IP</p>
                </div>
            </footer>

            {/* Toast Notification */}
            {showToast && (
                <div className="toast">
                    ✓ Copied to clipboard!
                </div>
            )}
        </div>
    )
}

export default App
