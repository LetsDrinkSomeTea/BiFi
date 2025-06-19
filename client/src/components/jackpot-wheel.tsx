import React from "react";
import { Wheel } from "react-custom-roulette"
import {Button} from "@/components/ui/button.tsx";
import {Buyable} from "@shared/schema.ts";

export interface JackpotWheelProps {
    onSpinStart: () => void;
    onSpinComplete: () => void;
    buyable: Buyable;
    multiplier: number | null;
    isSpinning: boolean;
}

const JackpotWheel = ({onSpinStart, onSpinComplete, buyable, multiplier, isSpinning}: JackpotWheelProps) => {
    const [spin, setSpin] = React.useState(false);
    const [startIndex, setStartIndex] = React.useState(0);
    const [prize, setPrize] = React.useState(0);
    const spinDuration = 0.5;
    const buyablePrice = buyable?.price || 1

    const mixedValues = [0, 2, 0.1, 1.9, 0.2, 1.8, 0.3, 1.7, 0.4, 1.6, 0.5, 1.5, 0.6, 1.4, 0.7, 1.3, 0.8, 1.2, 0.9, 1.1]
    const segments = mixedValues.map(
        value => ({
            option: `${(buyablePrice * value).toFixed(2)}€`,
            value
        })
    );

    // Watch for multiplier changes from the server
    React.useEffect(() => {
        if (multiplier !== null && isSpinning) {
            // Find the closest matching value in our segments
            let closestIndex = 0;
            let smallestDiff = Math.abs(mixedValues[0] - multiplier);

            for (let i = 1; i < mixedValues.length; i++) {
                const diff = Math.abs(mixedValues[i] - multiplier);
                if (diff < smallestDiff) {
                    smallestDiff = diff;
                    closestIndex = i;
                }
            }

            setPrize(closestIndex);
            setSpin(true);
        }
    }, [multiplier, isSpinning]);

    // Reset spin state when not spinning
    React.useEffect(() => {
        if (!isSpinning && spin) {
            setSpin(false);
        }
    }, [isSpinning, spin]);

    const handleSpinFinish = () => {
        setSpin(false);
        setStartIndex(prize);
        onSpinComplete();
    };

    const handleSpin = () => {
        if (spin || isSpinning) return;
        onSpinStart();
    }

    return (
        <>
            <Button
                onClick={handleSpin}
                disabled={spin || isSpinning}
                className={spin || isSpinning ? "animate-pulse" : ""}
            >
                {spin ? "SPINNING..." : isSpinning ? "LOADING..." : "SPIN"}
            </Button>
            <Wheel
                data={segments}
                onStopSpinning={handleSpinFinish}
                startingOptionIndex={startIndex}
                prizeNumber={prize}
                mustStartSpinning={spin}
                backgroundColors={['#C2EB7C', '#EB907C']}
                textColors={['#000000']}
                spinDuration={spinDuration}
                disableInitialAnimation={true}
            />
        </>
    )
};

export default JackpotWheel;