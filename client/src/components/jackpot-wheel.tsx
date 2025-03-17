import React from "react";
import { Wheel } from "react-custom-roulette"
import {Button} from "@/components/ui/button.tsx";
import {Buyable} from "@shared/schema.ts";

export interface JackpotWheelProps {
    onSpinStart: () => void;
    onSpinComplete: (multiplier: number) => void;
    buyable: Buyable;
}

const JackpotWheel = ({onSpinStart, onSpinComplete, buyable}: JackpotWheelProps) => {
    // Erzeuge 21 Segmente von "0%" bis "200%"

    const [spin, setSpin] = React.useState(false);
    const [startIndex, setStartIndex] = React.useState(0);
    const [prize, setPrize] = React.useState(0);
    const spinDuration = 0.5;
    const buyablePrice = buyable?.price || 1

    const mixedValues = [0, 2, 0.1, 1.9, 0.2, 1.8, 0.3, 1.7, 0.4, 1.6, 0.5, 1.5, 0.6, 1.4, 0.7, 1.3, 0.8, 1.2, 0.9, 1.1]
    const segments = mixedValues.map(
        value => ({
            option: `${(buyablePrice * value).toFixed(2)}€`, value
        })
    );

    // Wird aufgerufen, wenn der Spin abgeschlossen ist.
    // Wir wandeln den ausgewählten Prozentsatz in einen Multiplikator um.
    const handleSpinFinish = () => {
        setSpin(false);
        setStartIndex(prize);
        onSpinComplete(segments[prize].value);
    };

    const handleSpin = () => {
        if (spin) return;
        onSpinStart();
        setPrize(Math.floor(Math.random() * segments.length));
        setSpin(true);
    }

    return (
        <>
            <Button onClick={handleSpin} disabled={spin} className={ spin ? "animate-pulse" : ""}>{spin?"SPINNING ..." : "SPIN"}</Button>
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
