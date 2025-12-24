type Vendor = {
    id: string;
    name: string;
    kind: string;
};
type ActivityType = {
    id: string;
    name: string;
    color: string | null;
};
type PlanDetail = {
    id: string;
    title: string;
    budgetAmount: number;
    actualSpendAmount: number;
    remainingAmount: number;
    type: {
        id: string;
        name: string;
        color: string | null;
    } | null;
    expenses: Array<{
        id: string;
        occurredAt: string;
        amount: number;
        notes: string | null;
        vendor: Vendor | null;
        type: ActivityType | null;
    }>;
};
export declare function PlanDetail(): import("react/jsx-runtime").JSX.Element;
export default PlanDetail;
//# sourceMappingURL=PlanDetail.d.ts.map