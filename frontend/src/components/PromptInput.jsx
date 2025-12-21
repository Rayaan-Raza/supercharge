import { Lightbulb } from 'lucide-react'

const examplePrompts = [
    "Write me a blog post about AI",
    "Help me with my resume",
    "Create a marketing strategy",
]

function PromptInput({ value, onChange, onSubmit, isLoading }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey && !isLoading) {
            onSubmit()
        }
    }

    return (
        <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-white/80 font-medium flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-electric-blue" />
                    Your Raw Prompt
                </label>
                <span className="text-xs text-white/30">Ctrl + Enter to submit</span>
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prompt here... e.g., 'Write me a blog post about AI'"
                className="input-area min-h-[160px]"
                disabled={isLoading}
            />

            {!value && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-white/40">Try:</span>
                    {examplePrompts.map((example, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(example)}
                            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/50 
                         hover:bg-white/10 hover:text-white/70 transition-colors"
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
