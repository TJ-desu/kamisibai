'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
            router.push('/admin');
            router.refresh();
        } else {
            setError('IDまたはパスワードが間違っています');
        }
    };

    return (
        <div className="container" style={{ paddingTop: '100px', maxWidth: '400px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-dark)' }}>管理者ログイン</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input
                    type="text"
                    placeholder="ログインID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }}
                />
                <input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }}
                />
                {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
                <button type="submit" className="btn-primary">ログイン</button>
            </form>
        </div>
    );
}
