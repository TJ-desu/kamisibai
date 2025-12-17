'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface VideoPlayerProps {
    video: Video;
    suggestedVideos: Video[];
}

export default function VideoPlayer({ video, suggestedVideos }: VideoPlayerProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        // Increment view count
        fetch(`/api/videos/${video.id}/view`, { method: 'POST' }).catch(console.error);
    }, [video.id]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000' }}>
            <video
                controls={!showSuggestions}
                autoPlay
                playsInline
                src={video.url}
                poster={video.thumbnail}
                onEnded={() => setShowSuggestions(true)}
                onPlay={() => setShowSuggestions(false)}
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh', opacity: showSuggestions ? 0.4 : 1, transition: 'opacity 0.5s' }}
            >
                お使いのブラウザは動画タグに対応していません。
            </video>

            {showSuggestions && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    overflow: 'hidden'
                }}>
                    <h3 style={{ color: '#fff', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: '1.0rem' }}>
                        つぎのおはなし
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                        {suggestedVideos.map(v => (
                            <Link key={v.id} href={`/watch/${v.id}`} style={{ textDecoration: 'none', width: '42%', maxWidth: '180px' }}>
                                <div style={{
                                    position: 'relative',
                                    aspectRatio: '16/9',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    marginBottom: '4px'
                                }}>
                                    <img
                                        src={v.thumbnail}
                                        alt={v.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>▶️</span>
                                    </div>
                                </div>
                                <p style={{
                                    color: '#fff',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    margin: 0,
                                    textAlign: 'center'
                                }}>
                                    {v.title}
                                </p>
                            </Link>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setShowSuggestions(false);
                            const videoEl = document.querySelector('video');
                            if (videoEl) {
                                videoEl.currentTime = 0;
                                videoEl.play();
                            }
                        }}
                        style={{
                            marginTop: '12px',
                            padding: '6px 20px',
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.5)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backdropFilter: 'blur(4px)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        もういちどみる ↺
                    </button>
                </div>
            )}
        </div>
    );
}
