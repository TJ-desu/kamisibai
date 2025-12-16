import { getVideos } from '@/lib/data';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/app/components/VideoPlayer'; // We will assume or create this component or inline it. 
// Actually, let's create a client component for the player part to handle 'view count' increment on client side?
// Or we can just do a server action?
// The previous logic was: client calls /api/videos/[id]/view.
// Let's keep it simple: The page renders a client component wrapper for the video that handles the view count effect.

export const runtime = 'edge';

export default async function WatchPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const videos = await getVideos();
    const video = videos.find(v => v.id === id);

    if (!video) return notFound();

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '40px', backgroundColor: '#fdfbf7' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                <a href="/" style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                    ← 紙芝居一覧に戻る
                </a>

                <div style={{
                    backgroundColor: '#000',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    marginBottom: '20px'
                }}>
                    <VideoPlayer video={video} />
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
        </main>
    );
}
