import Link from 'next/link';
import React from 'react';

export default function Loading() {
    return (
        <main style={{ minHeight: '100vh', paddingBottom: '40px', backgroundColor: '#fdfbf7' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                <Link href="/" style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    ← 紙芝居一覧に戻る
                </Link>

                {/* Video Player Skeleton */}
                <div style={{
                    backgroundColor: '#000',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    marginBottom: '20px',
                    aspectRatio: '16 / 9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    {/* Spinner */}
                    <div className="spinner"></div>
                </div>

                {/* Metadata Skeleton */}
                <div style={{ padding: '0 10px' }}>
                    {/* Title Skeleton */}
                    <div style={{ height: '32px', width: '60%', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '10px' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* Tags Skeleton */}
                            <div style={{ height: '24px', width: '60px', backgroundColor: '#eee', borderRadius: '20px' }}></div>
                            <div style={{ height: '24px', width: '80px', backgroundColor: '#eee', borderRadius: '20px' }}></div>
                        </div>
                        {/* View Count Skeleton */}
                        <div style={{ height: '20px', width: '80px', backgroundColor: '#eee', borderRadius: '4px' }}></div>
                    </div>

                    {/* Description Skeleton */}
                    <div style={{ height: '16px', width: '100%', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ height: '16px', width: '90%', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ height: '16px', width: '70%', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '8px' }}></div>
                </div>
            </div>

            <style>{`
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 5px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
