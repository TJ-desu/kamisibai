'use client';

import { useState, useMemo } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { Video } from '@/types';
import Link from 'next/link';

export default function VideoBrowser({ initialVideos }: { initialVideos: Video[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const { setPreloadedVideo } = useNavigation();

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
                    placeholder="キーワードで探す"
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
                        <Link
                            key={video.id}
                            href={`/watch/${video.id}`}
                            onClick={() => setPreloadedVideo(video)}
                            style={{
                                display: 'block',
                                backgroundColor: '#fff',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-soft)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: '1px solid #eee',
                                textDecoration: 'none',
                                WebkitTapHighlightColor: 'transparent' // Remove tap highlight for faster feel
                            }}
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
                                    {video.description}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px', textAlign: 'right' }}>
                                    {video.viewCount || 0} 回視聴
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
