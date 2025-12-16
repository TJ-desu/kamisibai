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

    // Upload State
    const [formData, setFormData] = useState({ title: '', description: '', tags: '' });
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Thumbnail State
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

    // Edit State
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' });
    const [editThumbnailBlob, setEditThumbnailBlob] = useState<Blob | null>(null);
    const [editThumbnailPreviewUrl, setEditThumbnailPreviewUrl] = useState<string | null>(null);
    const editVideoPreviewRef = useRef<HTMLVideoElement>(null);

    // User Management State
    const [newUser, setNewUser] = useState({ username: '', password: '' });

    // Filter videos for Editor
    const myVideos = user.role === 'admin' ? initialVideos : initialVideos.filter(v => v.uploaderId === user.id);

    // --- Helpers ---
    const handleTabChange = (tab: 'upload' | 'users' | 'videos') => setActiveTab(tab);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    // --- Upload Logic ---
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

        setLoading(true);
        setUploadProgress(0);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('tags', formData.tags);
            data.append('file', file);
            if (thumbnailBlob) {
                data.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
            }

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/videos');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    alert('動画を追加しました！');
                    setFormData({ title: '', description: '', tags: '' });
                    setFile(null);
                    setThumbnailBlob(null);
                    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
                    setThumbnailPreviewUrl(null);
                    setUploadProgress(0);
                    setLoading(false);
                    router.refresh();
                } else {
                    let errorMessage = '不明なエラーが発生しました';
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        errorMessage = errorData.s3Error || errorData.details || errorData.message || errorMessage;
                    } catch (e) {
                        errorMessage = xhr.statusText;
                    }
                    console.error('Upload Error:', errorMessage);
                    alert(`アップロードに失敗しました (Server):\n${errorMessage}\n${xhr.status}`);
                    setLoading(false);
                }
            };

            xhr.onerror = () => {
                console.error('Network Error');
                alert('通信エラーが発生しました (Network)');
                setLoading(false);
            };

            xhr.send(data);

        } catch (error: any) {
            console.error(error);
            alert(`エラーが発生しました:\n${error.message || error}`);
            setLoading(false);
        }
    };

    // --- Edit/Delete Logic ---
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

    const openEditModal = (video: Video) => {
        setEditingVideo(video);
        setEditForm({
            title: video.title,
            description: video.description,
            tags: video.tags.join(',')
        });
        setEditThumbnailBlob(null);
        setEditThumbnailPreviewUrl(video.thumbnail || null);
    };

    const closeEditModal = () => {
        setEditingVideo(null);
        setEditForm({ title: '', description: '', tags: '' });
        setEditThumbnailBlob(null);
        if (editThumbnailPreviewUrl && editThumbnailPreviewUrl !== editingVideo?.thumbnail) {
            URL.revokeObjectURL(editThumbnailPreviewUrl);
        }
        setEditThumbnailPreviewUrl(null);
    };

    const handleCaptureEditThumbnail = (e: React.MouseEvent) => {
        e.preventDefault();
        const video = editVideoPreviewRef.current;
        const canvas = canvasRef.current; // Reuse the same canvas ref

        if (!video || !canvas) return;

        try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // This line will throw if the canvas is tainted (CORS error)
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        setEditThumbnailBlob(blob);
                        // If previous preview was a blob URL, revoke it
                        if (editThumbnailPreviewUrl && editThumbnailPreviewUrl !== editingVideo?.thumbnail) {
                            URL.revokeObjectURL(editThumbnailPreviewUrl);
                        }
                        setEditThumbnailPreviewUrl(URL.createObjectURL(blob));
                    }
                }, 'image/jpeg', 0.85);
            }
        } catch (error: any) {
            console.error('Thumbnail capture error:', error);
            // Inform user about potential CORS issues
            alert(`サムネイルの作成に失敗しました。\nエラー: ${error.message || '不明なエラー'}\n\n※ セキュリティ設定(CORS)の影響の可能性があります。時間を置いてから再読み込みしてください。`);
        }
    };

    const handleUpdateVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVideo) return;

        try {
            const data = new FormData();
            data.append('title', editForm.title);
            data.append('description', editForm.description);
            data.append('tags', editForm.tags);
            if (editThumbnailBlob) {
                data.append('thumbnail', editThumbnailBlob, 'thumbnail.jpg');
            }

            const res = await fetch(`/api/videos/${editingVideo.id}`, {
                method: 'PUT',
                body: data // Fetch handles Content-Type for FormData automatically
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

    // --- User Management Logic ---
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

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: 'var(--primary-color)' }}>
                    管理画面 ({user.role === 'admin' ? '管理者' : '編集者'}: {user.username}) <span style={{ fontSize: '0.8rem', color: '#888' }}>v2.3.0</span>
                </h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>🔄</span> 更新
                    </button>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
                        ログアウト
                    </button>
                </div>
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

            {/* Content: Upload */}
            {activeTab === 'upload' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--white)', padding: '30px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-soft)' }}>
                    <h2 style={{ marginBottom: '20px' }}>動画を追加</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>タイトル</label>
                            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid #ddd' }} />
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

                                    {/* Shared Canvas */}
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

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: loading ? '#ccc' : 'var(--primary-color)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1.1rem',
                                marginTop: '10px'
                            }}
                        >
                            {loading ? 'アップロード中...' : '動画を公開する'}
                        </button>
                    </form>

                    {/* Progress Bar */}
                    {loading && uploadProgress > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>アップロード中...</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{uploadProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${uploadProgress}%`,
                                    height: '100%',
                                    backgroundColor: 'var(--primary-color)',
                                    transition: 'width 0.2s ease'
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content: Videos */}
            {activeTab === 'videos' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {myVideos.map(video => (
                        <div key={video.id} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-soft)' }}>
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                                <video src={video.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{video.title}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>再生数: {video.viewCount || 0}</p>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button onClick={() => openEditModal(video)} style={{ flex: 1, padding: '5px 10px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px' }}>
                                    編集
                                </button>
                                {user.role === 'admin' && (
                                    <button onClick={() => {
                                        if (confirm('本当に削除しますか？')) handleDeleteVideo(video.id);
                                    }} style={{ padding: '5px 10px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px' }}>削除</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {myVideos.length === 0 && <p>動画がありません</p>}
                </div>
            )}

            {/* Content: Users */}
            {activeTab === 'users' && user.role === 'admin' && (
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
            )}

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
                        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '0.9rem' }}>
                            <p><strong>アップロード者:</strong> {initialUsers.find(u => u.id === editingVideo.uploaderId)?.username || '不明'}</p>
                            <p style={{ color: '#666', fontSize: '0.8rem' }}>ID: {editingVideo.uploaderId}</p>
                        </div>
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

                            {/* Thumbnail Editing Section */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>サムネイル</label>
                                <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ marginBottom: '10px', fontSize: '0.9rem' }}>動画から新しいサムネイルを作成できます</p>

                                    <video
                                        key={editingVideo.id} // Force remount when video changes
                                        ref={editVideoPreviewRef}
                                        controls
                                        playsInline
                                        crossOrigin="anonymous" // Important for canvas capture
                                        src={editingVideo.url}
                                        style={{ width: '100%', height: 'auto', aspectRatio: '16/9', backgroundColor: '#000', marginBottom: '10px', display: 'block' }}
                                    />
                                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                        <button onClick={handleCaptureEditThumbnail} type="button" style={{ padding: '8px 16px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                            📸 画面をキャプチャして変更
                                        </button>
                                    </div>

                                    {(editThumbnailPreviewUrl) && (
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>▼ {editThumbnailBlob ? '変更後のサムネイル' : '現在のサムネイル'}</p>
                                            <img src={editThumbnailPreviewUrl} alt="Thumbnail Preview" style={{ maxWidth: '200px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                            {editThumbnailBlob && (
                                                <p style={{ fontSize: '0.8rem', color: 'green', marginTop: '5px' }}>※ 更新ボタンを押すと反映されます</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                {user.role === 'admin' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm('本当に削除しますか？この操作は取り消せません。')) {
                                                handleDeleteVideo(editingVideo.id);
                                                closeEditModal();
                                            }
                                        }}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ff4d4d', color: '#fff' }}
                                    >
                                        削除
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                                    <button type="button" onClick={closeEditModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#eee' }}>
                                        キャンセル
                                    </button>
                                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                                        更新する
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

