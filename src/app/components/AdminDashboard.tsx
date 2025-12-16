'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Video, User } from '@/types';

interface AdminDashboardProps {
    user: { id: string; username: string; role: 'admin' | 'editor' };
    initialVideos: Video[];
    initialUsers: User[];
}

export default function AdminDashboard({ user, initialVideos, initialUsers }: AdminDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upload' | 'users' | 'videos'>('upload');
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const inputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        tags: '',
        summary: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);

    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

    // Filter videos for Editor (only their own)
    // Note: For prototype, existing videos might have 'admin' or null.
    // If editor, we only show where uploaderId matches, OR allow seeing all but editing none?
    // Requirement says: "Editor... upload own video and see view count". Implies seeing own list.
    // Requirement says: "Editor... upload own video and see view count". Implies seeing own list.
    const myVideos = user.role === 'admin' ? initialVideos : initialVideos.filter(v => v.uploaderId === user.id);

    const handleTabChange = (tab: 'upload' | 'users' | 'videos') => {
        setActiveTab(tab);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'video/mp4') {
                setFile(droppedFile);
            } else {
                alert('MP4ファイルのみアップロード可能です');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            // Reset thumbnail when new file matches
            setThumbnailBlob(null);
            if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
            setThumbnailPreviewUrl(null);
        }
    };

    const handleCaptureThumbnail = (e: React.MouseEvent) => {
        e.preventDefault();
        const video = videoPreviewRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        setThumbnailBlob(blob);
                        if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
                        setThumbnailPreviewUrl(URL.createObjectURL(blob));
                    }
                }, 'image/jpeg', 0.85);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            alert('動画ファイルを選択してください');
            return;
        }
        if (formData.summary.length > 140) {
            alert('概要は140文字以内で入力してください');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('tags', formData.tags);
            data.append('summary', formData.summary);
            data.append('file', file);
            if (thumbnailBlob) {
                data.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
            }

            // Uploader ID is handled by server from cookie, or we pass it? 
            // Better to let server read cookie. But for simplicity here? 
            // Let's rely on server reading cookie.

            const res = await fetch('/api/videos', { method: 'POST', body: data });
            if (res.ok) {
                alert('動画を追加しました！');
                setFormData({ title: '', description: '', tags: '', summary: '' });
                setFile(null);
                setThumbnailBlob(null);
                if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
                setThumbnailPreviewUrl(null);
                router.refresh();
            } else {
                const errorData = await res.json();
                console.error('Upload Error Data:', errorData);
                const errorMessage = errorData.s3Error || errorData.details || errorData.message || '不明なエラーが発生しました';
                alert(`アップロードに失敗しました (Server):\n${errorMessage}`);
            }
        } catch (error: any) {
            console.error(error);
            alert(`通信エラーが発生しました (Network):\n${error.message || error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) return;

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                alert('編集者を作成しました');
                setNewUser({ username: '', password: '' });
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.message || 'エラーが発生しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        }
    };



    const handleDeleteVideo = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('削除しました');
                router.refresh();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            alert('エラーが発生しました');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    // --- Editing Logic ---
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', tags: '', summary: '' });

    const openEditModal = (video: Video) => {
        setEditingVideo(video);
        setEditForm({
            title: video.title,
            description: video.description,
            tags: video.tags,
            summary: video.summary
        });
    };

    const closeEditModal = () => {
        setEditingVideo(null);
        setEditForm({ title: '', description: '', tags: '', summary: '' });
    };

    const handleUpdateVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVideo) return;

        try {
            const res = await fetch(`/api/videos/${editingVideo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                alert('動画情報を更新しました');
                closeEditModal();
                router.refresh();
            } else {
                const data = await res.json();
                alert(`更新に失敗しました: ${data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('エラーが発生しました');
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>
                    管理画面 ({user.role === 'admin' ? '管理者' : '編集者'}: {user.username}) <span style={{ fontSize: '0.8rem', color: '#888' }}>v2.1.1</span>
                </h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
                    ログアウト
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button
                    onClick={() => handleTabChange('upload')}
                    className={activeTab === 'upload' ? 'btn-primary' : ''}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: activeTab === 'upload' ? 'none' : '1px solid #ddd', background: activeTab === 'upload' ? 'var(--primary-color)' : '#fff', color: activeTab === 'upload' ? '#fff' : '#666' }}
                >
                    動画アップロード
                </button>
                <button
                    onClick={() => handleTabChange('videos')}
                    className={activeTab === 'videos' ? 'btn-primary' : ''}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: activeTab === 'videos' ? 'none' : '1px solid #ddd', background: activeTab === 'videos' ? 'var(--primary-color)' : '#fff', color: activeTab === 'videos' ? '#fff' : '#666' }}
                >
                    動画一覧 ({myVideos.length})
                </button>
                {user.role === 'admin' && (
                    <button
                        onClick={() => handleTabChange('users')}
                        className={activeTab === 'users' ? 'btn-primary' : ''}
                        style={{ padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: activeTab === 'users' ? 'none' : '1px solid #ddd', background: activeTab === 'users' ? 'var(--primary-color)' : '#fff', color: activeTab === 'users' ? '#fff' : '#666' }}
                    >
                        ユーザー管理
                    </button>
                )}
            </div>

            {/* Content */}
            {
                activeTab === 'upload' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--white)', padding: '30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-soft)' }}>
                        <h2 style={{ marginBottom: '20px' }}>動画を追加</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>タイトル</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>概要 (一覧用・140文字以内)</label>
                                <textarea required value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} maxLength={140} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', minHeight: '60px' }} />
                                <p style={{ textAlign: 'right', fontSize: '0.8rem', color: formData.summary.length > 140 ? 'red' : '#666' }}>{formData.summary.length}/140</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>詳細説明</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd', minHeight: '100px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>タグ (カンマ区切り)</label>
                                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>動画ファイル (MP4)</label>
                                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => inputRef.current?.click()} style={{ width: '100%', padding: '40px 20px', borderRadius: 'var(--radius-md)', border: `2px dashed ${dragActive ? 'var(--primary-color)' : '#ccc'}`, backgroundColor: dragActive ? 'var(--bg-soft)' : '#fafafa', textAlign: 'center', cursor: 'pointer' }}>
                                    <input ref={inputRef} type="file" accept="video/mp4" onChange={handleChange} style={{ display: 'none' }} />
                                    {file ? (
                                        <div><p style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>📄 {file.name}</p></div>
                                    ) : (
                                        <div><p style={{ fontSize: '2rem', marginBottom: '10px' }}>📂</p><p>ドラッグ＆ドロップ</p></div>
                                    )}
                                </div>
                            </div>

                            {file && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>サムネイル設定</label>
                                    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                                        <p style={{ marginBottom: '10px', fontSize: '0.9rem' }}>動画を再生して「サムネイルにする」を押すと、その場面がサムネイルになります。</p>

                                        <video
                                            ref={videoPreviewRef}
                                            controls
                                            src={URL.createObjectURL(file)}
                                            style={{ width: '100%', maxHeight: '300px', backgroundColor: '#000', marginBottom: '10px' }}
                                        />

                                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                            <button onClick={handleCaptureThumbnail} type="button" style={{ padding: '8px 16px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                📸 現在の画面をサムネイルにする
                                            </button>
                                        </div>

                                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                                        {thumbnailPreviewUrl && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>▼ 設定されたサムネイル</p>
                                                <img src={thumbnailPreviewUrl} alt="Thumbnail Preview" style={{ maxWidth: '200px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'アップロード中...' : '動画を追加する'}</button>
                        </form>
                    </div >
                )
            }

            {
                activeTab === 'videos' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {myVideos.map(video => (
                            <div key={video.id} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
                                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                                    <video src={video.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{video.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>👁️ 再生数: {video.viewCount || 0}</p>
                                <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{video.summary}</p>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button onClick={() => openEditModal(video)} style={{ flex: 1, padding: '5px 10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px' }}>
                                        編集
                                    </button>
                                    {user.role === 'admin' && (
                                        <button onClick={() => handleDeleteVideo(video.id)} style={{ padding: '5px 10px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px' }}>削除</button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {myVideos.length === 0 && <p>動画がありません</p>}
                    </div>
                )
            }

            {
                activeTab === 'users' && user.role === 'admin' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ background: 'var(--white)', padding: '30px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', boxShadow: 'var(--shadow-soft)' }}>
                            <h2 style={{ marginBottom: '20px' }}>編集者を作成</h2>
                            <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>ユーザーID</label>
                                    <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>パスワード</label>
                                    <input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }} />
                                </div>
                                <button type="submit" className="btn-primary" style={{ height: '42px' }}>作成</button>
                            </form>
                        </div>

                        <h3>ユーザー一覧</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {initialUsers.map(u => (
                                <li key={u.id} style={{ background: '#fff', padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{u.username} ({u.role})</span>
                                    <span>ID: {u.id}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Edit Modal */}
            {editingVideo && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '20px' }}>動画情報を編集</h2>
                        <form onSubmit={handleUpdateVideo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>タイトル</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>概要 (140文字以内)</label>
                                <textarea
                                    required
                                    value={editForm.summary}
                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                    maxLength={140}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '60px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>詳細説明</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>タグ (カンマ区切り)</label>
                                <input
                                    type="text"
                                    value={editForm.tags}
                                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={closeEditModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#eee' }}>
                                    キャンセル
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                                    更新する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div >
    );
}
