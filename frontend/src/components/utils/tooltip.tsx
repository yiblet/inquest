import React, { useState, useEffect } from "react";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Tooltip: React.FC<{
    width?: string;
    floatHorizontal?: "left" | "right";
    floatVertical?: "above" | "below";
    unwrapChildren?: boolean;
}> = ({ children, floatVertical, floatHorizontal, width, unwrapChildren }) => {
    const [isShown, setIsShown] = useState<boolean | "out">(false);
    useEffect(() => {
        if (isShown === "out") {
            const handler = setTimeout(() => setIsShown(false), 250);
            return () => clearTimeout(handler);
        }
    }, [isShown === "out", setIsShown]);

    if (floatVertical !== undefined) {
        floatVertical = "above";
    }
    if (floatHorizontal !== undefined) {
        floatHorizontal = "right";
    }

    const style: React.CSSProperties = {};
    if (floatVertical === "above") {
        style.top = "1.5rem";
    } else {
        style.bottom = "1.5rem";
    }

    if (floatHorizontal === "right") {
        style.right = "1rem";
    } else {
        style.left = "1rem";
    }

    let newChildren: React.ReactNode = (
        <div className="p-2 border shadow-md rounded bg-white text-black">
            {children}
        </div>
    );
    if (unwrapChildren) {
        newChildren = children;
    }

    return (
        <div
            className="relative z-10 inline-block cursor-pointer"
            onMouseEnter={() => setIsShown(true)}
            onMouseLeave={() => setIsShown("out")}
        >
            <FontAwesomeIcon icon={faQuestionCircle} />
            {isShown ? (
                <div className="absolute">
                    <div className="fixed" style={{ width }}>
                        <div className="absolute" style={style}>
                            {newChildren}
                        </div>
                    </div>
                </div>
            ) : (
                <> </>
            )}
        </div>
    );
};
