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
        // No setTimeout auto-dismiss. Requires user interaction.
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const getBgColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'rgba(46, 125, 50, 0.95)'; // Green
            case 'error': return 'rgba(211, 47, 47, 0.95)';   // Red
            default: return 'rgba(50, 50, 50, 0.95)';         // Dark Grey
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
                pointerEvents: 'auto' // Important for clicking buttons
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} className="toast-animation" style={{
                        padding: '12px 24px',
                        borderRadius: '12px', /* Less rounded than pill */
                        background: getBgColor(toast.type),
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        backdropFilter: 'blur(4px)',
                        minWidth: '300px',
                        justifyContent: 'space-between'
                    }}>
                        <span>{toast.message}</span>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}
                        >
                            OK
                        </button>
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
