import React from "react";
import { Buyable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {LucideProps} from "lucide-react";

interface BuyButtonProps {
    buyable: Buyable;
    onBuy: (args: {buyableId: number}) => void;
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

const BuyButton: React.FC<BuyButtonProps> = (args: BuyButtonProps) => {
    return (
        <Button
            className="w-full mt-4"
            onClick={() => args.onBuy({buyableId: args.buyable.id})}
        >
            <args.icon className="h-4 w-4 mr-2" />
            {args.buyable?.name} ({args.buyable?.price.toFixed(2)}€)
        </Button>
    );
};

export { BuyButton };