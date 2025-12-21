import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'

const processingSteps = [
    { id: 1, label: 'SCANNING FOR AMBIGUITY', duration: 800 },
    { id: 2, label: 'ANALYZING CONTEXT DEPTH', duration: 600 },
    { id: 3, label: 'INJECTING PROFESSIONAL PERSONA', duration: 700 },
    { id: 4, label: 'CALIBRATING OUTPUT CONSTRAINTS', duration: 500 },
    { id: 5, label: 'APPLYING ANTI-HALLUCINATION GUARDS', duration: 600 },
    { id: 6, label: 'OPTIMIZING INSTRUCTION CLARITY', duration: 500 },
]

function ProcessHUD({ isActive, phase }) {
    const [completedSteps, setCompletedSteps] = useState([])
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (!isActive) {
            setCompletedSteps([])
            setCurrentStep(0)
            return
        }

        // Progress through steps
        let stepIndex = 0
        const runNextStep = () => {
            if (stepIndex < processingSteps.length) {
                setCurrentStep(stepIndex + 1)

                setTimeout(() => {
                    setCompletedSteps(prev => [...prev, stepIndex + 1])
                    stepIndex++
                    runNextStep()
                }, processingSteps[stepIndex].duration)
            }
        }

        runNextStep()
    }, [isActive])

    if (!isActive) return null

    return (
        <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
                <span className="text-xs font-mono tracking-widest text-white/60 uppercase">
                    {phase === 'evaluating' ? 'System Diagnostics' : 'Refinement Protocol'}
                </span>
            </div>

            <div className="space-y-2">
                {processingSteps.map((step) => {
                    const isComplete = completedSteps.includes(step.id)
                    const isCurrent = currentStep === step.id && !isComplete

                    return (
                        <div
                            key={step.id}
                            className={`flex items-center gap-3 text-sm font-mono transition-all duration-300 ${isComplete ? 'text-green-400' :
                                    isCurrent ? 'text-electric-blue' :
                                        'text-white/30'
                                }`}
                        >
                            {isComplete ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : isCurrent ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Circle className="w-4 h-4" />
                            )}
                            <span className="tracking-wider text-xs">{step.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ProcessHUD
