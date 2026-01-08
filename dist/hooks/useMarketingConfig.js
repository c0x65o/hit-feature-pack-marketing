'use client';
import { useCallback, useEffect, useState } from 'react';
const defaults = {
    options: {
        enable_project_linking: false,
        require_project_linking: false,
    },
    projectsInstalled: false,
};
export function useMarketingConfig() {
    const [config, setConfig] = useState(defaults);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/marketing/config');
            if (!res.ok)
                throw new Error('Failed to fetch marketing config');
            const json = (await res.json());
            setConfig({
                options: {
                    enable_project_linking: Boolean(json?.options?.enable_project_linking),
                    require_project_linking: Boolean(json?.options?.require_project_linking),
                },
                projectsInstalled: Boolean(json?.projectsInstalled),
            });
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);
    return { config, loading, error, refetch: fetchConfig };
}
