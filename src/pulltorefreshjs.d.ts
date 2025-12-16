declare module 'pulltorefreshjs' {
    interface InitOptions {
        mainElement?: string | HTMLElement;
        triggerElement?: string | HTMLElement;
        onRefresh?: () => void;
        distThreshold?: number;
        distMax?: number;
        distReload?: number;
        instructionsPullToRefresh?: string;
        instructionsReleaseToRefresh?: string;
        instructionsRefreshing?: string;
        iconArrow?: string;
        iconRefreshing?: string;
    }

    const PullToRefresh: {
        init(options: InitOptions): void;
        destroyAll(): void;
    };

    export default PullToRefresh;
}
