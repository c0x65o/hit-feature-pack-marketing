export declare function EntityDetailPage({ entityKey, id, onNavigate, useDetailData, }: {
    entityKey: string;
    id: string;
    onNavigate?: (path: string) => void;
    useDetailData?: (args: {
        id: string;
    }) => {
        record: any;
        loading: boolean;
        deleteItem?: (id: string) => Promise<any>;
    };
}): import("react/jsx-runtime").JSX.Element;
export default EntityDetailPage;
//# sourceMappingURL=EntityDetailPage.d.ts.map