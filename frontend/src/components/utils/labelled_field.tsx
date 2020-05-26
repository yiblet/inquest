import React from "react";

export const LabelledField: React.FC<{
    label: React.ReactChild;
    className?: string;
}> = ({ label, className, children }) => (
    <div className={className}>
        <label> {label}</label>
        {children}
    </div>
);
