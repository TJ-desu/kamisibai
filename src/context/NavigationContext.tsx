'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Video } from '@/types';

interface NavigationContextType {
    preloadedVideo: Video | null;
    setPreloadedVideo: (video: Video | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [preloadedVideo, setPreloadedVideo] = useState<Video | null>(null);

    return (
        <NavigationContext.Provider value={{ preloadedVideo, setPreloadedVideo }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
