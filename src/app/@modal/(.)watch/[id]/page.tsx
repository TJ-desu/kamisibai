'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/context/NavigationContext';
import { Video } from '@/types';
import VideoPlayer from '@/app/components/VideoPlayer';

export default function InterceptedWatchPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { preloadedVideo } = useNavigation();
    const [video, setVideo] = useState<Video | null>(preloadedVideo);
    // Unwrap params in useEffect or use React.use() if available, but staying safe with Effect for now
    const [videoId, setVideoId] = useState<string>('');

    useEffect(() => {
        params.then(p => setVideoId(p.id));
    }, [params]);

    // If we have preloaded video, we show it instantly.
    // BUT, the preloaded video URL might NOT be signed (if it came from home, home signs it... wait, home DOES sign it).
    // Home page code: const videos = await signVideoUrls(rawVideos);
    // So preloadedVideo.url IS SIGNED/VALID. 
    // This implies we don't even need to fetch API if the signed URL is valid!
    // However, signed URLs expire. 
    // If the user sat on Home for > 1 hour, it might expire.
    // For "Explosive Speed", we trust the preloaded one first.
    // We can re-validate in background if needed, but usually redundant for "Click -> Watch" flow.

    // Update: If we navigated directly here (reload on modal), this intercept won't trigger (page.tsx triggers).
    // The intercept only triggers on soft nav. So preloadedVideo SHOULD exist.
    // If it doesn't exist (edge case), we fetch.

    useEffect(() => {
        if (!videoId) return;

        // If no preloaded data, or if we want to ensure freshness/suggestions
        if (!preloadedVideo || preloadedVideo.id !== videoId) {
            fetch(`/api/videos/${videoId}`)
                .then(res => res.json())
                .then(data => {
                    setVideo(data);
                })
                .catch(err => console.error(err));
        } else {
            // Ensure sync
            setVideo(preloadedVideo);
        }
    }, [videoId, preloadedVideo]);

    if (!video) return null; // Or skeleton

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#fdfbf7', // Same bg as page
            zIndex: 100,
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        display: 'inline-block',
                        marginBottom: '20px',
                        color: 'var(--primary-color)',
                        background: 'none',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    ← 戻る
                </button>

                <div style={{
                    backgroundColor: '#000',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    marginBottom: '20px',
                    aspectRatio: '16 / 9',
                    width: '100%'
                }}>
                    {/* The video player will likely work if URL is signed. */}
                    <VideoPlayer video={video} suggestedVideos={[]} />
                </div>

                <div style={{ padding: '0 10px' }}>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '10px' }}>{video.title}</h1>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {video.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.9rem', color: 'var(--primary-color)', backgroundColor: 'var(--bg-soft)', padding: '4px 12px', borderRadius: '20px' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <span style={{ fontSize: '0.9rem' }}>{video.viewCount || 0} 回視聴</span>
                    </div>

                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text-dark)' }}>
                        {video.description}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
