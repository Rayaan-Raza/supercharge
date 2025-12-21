function AuraBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Primary blue orb */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
                    top: '10%',
                    left: '20%',
                    animation: 'float1 15s ease-in-out infinite',
                }}
            />

            {/* Secondary purple orb */}
            <div
                className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
                style={{
                    background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
                    top: '50%',
                    right: '10%',
                    animation: 'float2 18s ease-in-out infinite',
                }}
            />

            {/* Accent cyan orb */}
            <div
                className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
                style={{
                    background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
                    bottom: '20%',
                    left: '40%',
                    animation: 'float3 20s ease-in-out infinite',
                }}
            />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                }}
            />
        </div>
    )
}

export default AuraBackground
