export interface MarketingConfig {
    options: {
        enable_project_linking: boolean;
        require_project_linking: boolean;
    };
    projectsInstalled: boolean;
}
export declare function useMarketingConfig(): {
    config: MarketingConfig;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};
//# sourceMappingURL=useMarketingConfig.d.ts.map