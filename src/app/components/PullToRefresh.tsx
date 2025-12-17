'use client';

import { useEffect } from 'react';
import PullToRefresh from 'pulltorefreshjs';

export default function PullToRefreshHandler() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // wrapper to ensure body is ready
        const initPTR = () => {
            PullToRefresh.init({
                mainElement: 'body',
                triggerElement: 'body',
                onRefresh: () => {
                    window.location.reload();
                },
                distThreshold: 70,
                distMax: 140,
                distReload: 60,
                instructionsPullToRefresh: '引き下げて更新',
                instructionsReleaseToRefresh: '離して更新',
                instructionsRefreshing: '更新中...',
                // Fix for Android/iOS glitches
                // passive: false, // Type error
            });
        };

        // Initialize immediately
        initPTR();

        // Cleanup
        return () => {
            PullToRefresh.destroyAll();
        };
    }, []);

    return null;
}
