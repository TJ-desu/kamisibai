'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const getBgColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'rgba(46, 125, 50, 0.9)'; // Green
            case 'error': return 'rgba(211, 47, 47, 0.9)';   // Red
            default: return 'rgba(50, 50, 50, 0.9)';         // Dark Grey
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Click through for underlying elements
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className="toast-animation" style={{
                        padding: '10px 24px',
                        borderRadius: '50px',
                        background: getBgColor(toast.type),
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(4px)',
                        whiteSpace: 'nowrap'
                    }}>
                        {toast.type === 'success' && <span>✅</span>}
                        {toast.type === 'error' && <span>⚠️</span>}
                        {toast.type === 'info' && <span>ℹ️</span>}
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
