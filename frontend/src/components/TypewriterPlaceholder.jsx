import { useState, useEffect } from 'react'

const phrases = [
    "Write me a blog post about AI",
    "Help me debug this React code",
    "Create a marketing email",
    "Explain quantum computing",
    "Build a landing page",
    "Summarize this research paper",
]

function TypewriterPlaceholder() {
    const [text, setText] = useState('')
    const [phraseIndex, setPhraseIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (text.length < currentPhrase.length) {
                    setText(currentPhrase.slice(0, text.length + 1))
                } else {
                    // Pause before deleting
                    setTimeout(() => setIsDeleting(true), 1500)
                }
            } else {
                // Deleting
                if (text.length > 0) {
                    setText(text.slice(0, -1))
                } else {
                    setIsDeleting(false)
                    setPhraseIndex((prev) => (prev + 1) % phrases.length)
                }
            }
        }, isDeleting ? 30 : 80)

        return () => clearTimeout(timeout)
    }, [text, isDeleting, phraseIndex])

    return text
}

export default TypewriterPlaceholder
