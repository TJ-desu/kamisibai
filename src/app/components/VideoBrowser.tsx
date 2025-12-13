'use client';

import { useState, useMemo } from 'react';
import { Video } from '@/types';

export default function VideoBrowser({ initialVideos }: { initialVideos: Video[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

    const handlePlayVideo = async (video: Video) => {
        setPlayingVideo(video);
        try {
            await fetch(`/api/videos/${video.id}/view`, { method: 'POST' });
        } catch (e) {
            console.error('Failed to increment view count');
        }
    };

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        initialVideos.forEach(v => v.tags.forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [initialVideos]);

    // Filter videos
    const filteredVideos = useMemo(() => {
        return initialVideos.filter(video => {
            const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                video.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = selectedTag ? video.tags.includes(selectedTag) : true;
            return matchesSearch && matchesTag;
        });
    }, [initialVideos, searchTerm, selectedTag]);

    return (
        <div className="container" style={{ padding: '20px' }}>
            {/* Search & Tags Section */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <input
                    type="text"
                    placeholder="キーワードで探す（例：むかしばなし）"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '15px 20px',
                        borderRadius: '50px',
                        border: '2px solid var(--primary-color)',
                        fontSize: '1.1rem',
                        marginBottom: '20px',
                        outline: 'none',
                        boxShadow: 'var(--shadow-soft)'
                    }}
                />

                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                        onClick={() => setSelectedTag(null)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',

                            border: 'none',
                            backgroundColor: selectedTag === null ? 'var(--primary-color)' : '#fff',
                            color: selectedTag === null ? '#fff' : 'var(--text-light)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            fontWeight: 'bold'
                        }}
                    >
                        すべて
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',

                                border: 'none',
                                backgroundColor: selectedTag === tag ? 'var(--primary-color)' : '#fff',
                                color: selectedTag === tag ? '#fff' : 'var(--text-light)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                fontWeight: 'bold'
                            }}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Video Grid */}
            {filteredVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <p>見つかりませんでした 😢</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {filteredVideos.map(video => (
                        <div
                            key={video.id}
                            onClick={() => handlePlayVideo(video)}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-soft)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ position: 'relative', paddingTop: '66%' /* 4:3 aspect ratio */ }}>
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                            <div style={{ padding: '16px' }}>
                                <h3 style={{ marginBottom: '8px', fontSize: '1.2rem', color: 'var(--text-dark)' }}>
                                    {video.title}
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    {video.tags.map(tag => (
                                        <span key={tag} style={{ fontSize: '0.8rem', color: 'var(--primary-color)', backgroundColor: 'var(--bg-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#666', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {video.summary || video.description}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px', textAlign: 'right' }}>
                                    👁️ {video.viewCount || 0} 回視聴
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Player Modal */}
            {playingVideo && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}
                    onClick={() => setPlayingVideo(null)}
                >
                    <div style={{
                        width: '100%',
                        maxWidth: '900px',
                        backgroundColor: '#000',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPlayingVideo(null)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                border: 'none',
                                color: '#fff',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                fontSize: '24px',
                                zIndex: 10
                            }}
                        >
                            ×
                        </button>
                        <video
                            controls
                            autoPlay
                            muted
                            playsInline
                            src={playingVideo.url}
                            style={{ width: '100%', height: 'auto', maxHeight: '80vh', display: 'block' }}
                        >
                            お使いのブラウザは動画タグに対応していません。
                        </video>
                        <div style={{ padding: '20px', backgroundColor: '#fff' }}>
                            <h2>{playingVideo.title}</h2>
                            <p style={{ marginTop: '10px' }}>{playingVideo.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
