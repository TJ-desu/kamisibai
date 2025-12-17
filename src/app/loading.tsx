export default function Loading() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Hero Skeleton */}
            <section style={{
                backgroundColor: 'var(--bg-accent)',
                padding: '60px 20px',
                textAlign: 'center',
                marginBottom: '40px',
                borderBottomLeftRadius: '50% 20px',
                borderBottomRightRadius: '50% 20px'
            }}>
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        width: '60%',
                        height: '3rem',
                        backgroundColor: '#e0dcd9',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        animation: 'pulse 1.5s infinite'
                    }} />
                    <div style={{
                        width: '40%',
                        height: '1.5rem',
                        backgroundColor: '#e0dcd9',
                        borderRadius: '8px',
                        animation: 'pulse 1.5s infinite',
                        animationDelay: '0.2s'
                    }} />
                </div>
            </section>

            {/* Video Grid Skeleton */}
            <div className="container" style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} style={{
                        backgroundColor: '#fff',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-soft)',
                        border: '1px solid #eee'
                    }}>
                        <div style={{
                            paddingTop: '66%',
                            backgroundColor: '#eee',
                            animation: 'pulse 1.5s infinite'
                        }} />
                        <div style={{ padding: '16px' }}>
                            <div style={{ width: '80%', height: '1.2rem', backgroundColor: '#eee', marginBottom: '8px', borderRadius: '4px' }} />
                            <div style={{ width: '40%', height: '0.9rem', backgroundColor: '#eee', borderRadius: '4px' }} />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
