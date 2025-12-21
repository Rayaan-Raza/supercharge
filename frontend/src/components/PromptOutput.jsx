import { useState, useEffect } from 'react'
import { Copy, Check, Sparkles } from 'lucide-react'

function PromptOutput({ content, onCopy, copied }) {
    const [displayedContent, setDisplayedContent] = useState('')
    const [isTyping, setIsTyping] = useState(true)

    // Typewriter effect for output
    useEffect(() => {
        if (!content) {
            setDisplayedContent('')
            setIsTyping(false)
            return
        }

        setIsTyping(true)
        setDisplayedContent('')

        let index = 0
        const speed = Math.max(5, Math.min(20, 2000 / content.length)) // Adaptive speed

        const typeInterval = setInterval(() => {
            if (index < content.length) {
                // Type multiple characters at once for long content
                const charsToAdd = content.length > 500 ? 3 : 1
                setDisplayedContent(content.slice(0, index + charsToAdd))
                index += charsToAdd
            } else {
                setIsTyping(false)
                clearInterval(typeInterval)
            }
        }, speed)

        return () => clearInterval(typeInterval)
    }, [content])

    return (
        <div className="glass-card glow-blue-intense p-6 space-y-4 animate-fade-in relative overflow-hidden">
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-electric-blue" />
                    <span className="text-xs font-mono tracking-widest text-white/60 uppercase">
                        Refined Architecture
                    </span>
                </div>
                <button
                    onClick={onCopy}
                    disabled={isTyping}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${copied
                            ? 'bg-green-500/20 text-green-400 scale-105'
                            : 'bg-white/5 hover:bg-electric-blue/20 hover:text-electric-blue text-white/60'
                        } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy</span>
                        </>
                    )}
                </button>
            </div>

            <div className="output-area p-5 rounded-xl bg-black/40 border border-electric-blue/30 
                      min-h-[200px] max-h-[500px] overflow-y-auto text-white/90 relative">
                {displayedContent}
                {isTyping && (
                    <span className="inline-block w-2 h-5 bg-electric-blue ml-1 animate-pulse" />
                )}
            </div>

            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/40">
                    <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                    <span>{isTyping ? 'Generating...' : 'Ready to use'}</span>
                </div>
                <span className="text-white/30 font-mono">
                    {content.length} characters
                </span>
            </div>
        </div>
    )
}

export default PromptOutput
