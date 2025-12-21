import { Copy, Check, Sparkles } from 'lucide-react'

function PromptOutput({ content, onCopy, copied }) {
    return (
        <div className="glass-card glow-blue-intense p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-electric-blue" />
                    <span className="text-white/80 font-medium">Supercharged Prompt</span>
                </div>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                     bg-white/5 hover:bg-white/10 transition-colors text-sm"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 text-white/60" />
                            <span className="text-white/60">Copy</span>
                        </>
                    )}
                </button>
            </div>

            <div className="output-area p-4 rounded-xl bg-black/30 border border-electric-blue/20 
                      min-h-[200px] max-h-[500px] overflow-y-auto text-white/90">
                {content}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/40">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Ready to use with ChatGPT, Claude, Gemini, or any AI</span>
            </div>
        </div>
    )
}

export default PromptOutput
