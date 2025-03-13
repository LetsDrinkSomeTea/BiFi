import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface AchievementBadgeProps {
    achievement: any;
    activeTooltipId: string | null;
    setActiveTooltipId: (id: string | null) => void;
}

// A separate component for an achievement badge with clickable tooltip.
function AchievementBadge({ achievement, activeTooltipId, setActiveTooltipId }: AchievementBadgeProps) {
    const [open, setOpen] = React.useState(false);

    if (activeTooltipId === achievement.id && !open) setOpen(true);
    else if (activeTooltipId !== achievement.id && open) setOpen(false);

    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={(isOpen) => {
                // If opening, set the active tooltip to this badge's id; if closing, clear it.
                if (isOpen) {
                    setActiveTooltipId(achievement.id);
                } else {
                    setActiveTooltipId(null);
                }
            }}>
                <Badge onClick={() => {
                   setActiveTooltipId(open ? null : achievement.id);
                }} style={{ cursor: "pointer" }}>
                    {achievement.name}
                </Badge>
                <TooltipTrigger>
                </TooltipTrigger>
                <TooltipContent
                >
                    {achievement.description} - Freigeschaltet: {new Date(achievement.unlockedAt).toLocaleString("de-DE")}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export {AchievementBadge}