'use client';

import { useEffect, useState } from 'react';

export default function PullToRefreshGuide() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already seen
        const hasSeen = localStorage.getItem('kamisibai_seen_ptr_guide');
        if (hasSeen) return;

        // Check if PWA (standalone)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        // For testing/demo purposes, we might want to show it on mobile web too if requested,
        // but user specifically said "PWA opened".
        // Let's stick to PWA check + generic mobile check as fallback if they are testing in browser? 
        // No, strict to "PWA opened" as requested.

        if (isPWA) {
            // Show with a slight delay
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('kamisibai_seen_ptr_guide', 'true');
    };

    if (!isVisible) return null;

    return (
        <div
            onClick={dismiss}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(2px)',
                animation: 'fadeIn 0.5s ease-out'
            }}
        >
            <div style={{
                textAlign: 'center',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{
                    animation: 'bounceDown 2s infinite'
                }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        新しい動画をチェック
                    </h2>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        画面を引き下げて更新できます
                    </p>
                </div>
                <button style={{
                    marginTop: '20px',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    border: '1px solid #fff',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.9rem'
                }}>
                    OK!
                </button>
            </div>

            <style jsx>{`
                @keyframes bounceDown {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
