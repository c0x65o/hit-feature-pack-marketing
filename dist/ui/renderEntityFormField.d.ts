type OptionSourceConfig = {
    loading?: boolean;
    placeholder?: string;
    options: Array<{
        value: string;
        label: string;
    }>;
};
export declare function renderEntityFormField({ keyName, fieldSpec, value, setValue, error, required, ui, optionSources, }: {
    keyName: string;
    fieldSpec: any;
    value: any;
    setValue: (v: any) => void;
    error?: string;
    required?: boolean;
    ui: {
        Input: any;
        TextArea: any;
        Select: any;
        Checkbox: any;
    };
    optionSources?: Record<string, OptionSourceConfig | undefined>;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=renderEntityFormField.d.ts.map