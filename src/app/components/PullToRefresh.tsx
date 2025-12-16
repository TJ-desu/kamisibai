'use client';

import { useEffect } from 'react';
import PullToRefresh from 'pulltorefreshjs';

export default function PullToRefreshHandler() {
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Initialize PullToRefresh
        PullToRefresh.init({
            mainElement: 'body', // Refresh happens when pulling on body
            triggerElement: 'body', // Trigger selector
            onRefresh: () => {
                window.location.reload(); // Simple reload
            },
            distThreshold: 70, // Distance required to trigger
            distMax: 140, // Max distance
            distReload: 60, // Distance to hold while reloading
            instructionsPullToRefresh: '引き下げて更新',
            instructionsReleaseToRefresh: '離して更新',
            instructionsRefreshing: '更新中...',
        });

        // Cleanup
        return () => {
            PullToRefresh.destroyAll();
        };
    }, []);

    return null; // This component handles side effects only
}
