import { useState, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'

const phrases = [
    "Write me a blog post about AI",
    "Help me debug this React code",
    "Create a marketing email",
    "Explain quantum computing simply",
    "Build a landing page for my startup",
    "Summarize this research paper",
]

function PromptInput({ value, onChange, onSubmit, isLoading }) {
    const [placeholderText, setPlaceholderText] = useState('')
    const [phraseIndex, setPhraseIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    // Typewriter effect for placeholder
    useEffect(() => {
        if (value) return // Stop animation when user is typing

        const currentPhrase = phrases[phraseIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (placeholderText.length < currentPhrase.length) {
                    setPlaceholderText(currentPhrase.slice(0, placeholderText.length + 1))
                } else {
                    setTimeout(() => setIsDeleting(true), 2000)
                }
            } else {
                if (placeholderText.length > 0) {
                    setPlaceholderText(placeholderText.slice(0, -1))
                } else {
                    setIsDeleting(false)
                    setPhraseIndex((prev) => (prev + 1) % phrases.length)
                }
            }
        }, isDeleting ? 40 : 100)

        return () => clearTimeout(timeout)
    }, [placeholderText, isDeleting, phraseIndex, value])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && !isLoading) {
            onSubmit()
        }
    }

    return (
        <div className="glass-card glass-card-hover p-6 space-y-4 transition-all duration-300">
            <div className="flex items-center justify-between">
                <label className="text-white/80 font-medium flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-electric-blue" />
                    Your Raw Prompt
                </label>
                <span className="text-xs text-white/30">Ctrl + Enter to submit</span>
            </div>

            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                    className="input-area min-h-[160px]"
                    disabled={isLoading}
                />
                {/* Animated placeholder overlay */}
                {!value && (
                    <div className="absolute top-4 left-4 pointer-events-none text-white/30 flex items-center">
                        <span>{placeholderText}</span>
                        <span className="animate-pulse ml-0.5 text-electric-blue">|</span>
                    </div>
                )}
            </div>

            {!value && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-white/40">Quick pick:</span>
                    {phrases.slice(0, 3).map((example, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(example)}
                            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/50 
                         hover:bg-electric-blue/20 hover:text-electric-blue transition-colors duration-200"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PromptInput
