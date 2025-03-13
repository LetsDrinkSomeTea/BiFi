import React from "react";
import { Buyable } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface BuyButtonProps {
    buyable: Buyable;
    onBuy: (args: {buyableId: number}) => void;
    icon: React.ReactNode;
}

const BuyButton: React.FC<BuyButtonProps> = ({
                                                 buyable,
                                                 onBuy,
                                                 icon,
                                             }: BuyButtonProps) => {
    return (
        <Button
            className="w-full mt-4"
            onClick={() => onBuy({buyableId: buyable.id})}
        >
            {icon}
            {buyable?.name} ({buyable?.price.toFixed(2)}€)
        </Button>
    );
};

export { BuyButton };