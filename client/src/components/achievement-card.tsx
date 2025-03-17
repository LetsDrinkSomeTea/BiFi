import {Trophy} from "lucide-react";
import {User} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {AchievementBadge} from "@/components/ui/achievement-badge.tsx";
import React from "react";

export interface AchievementsCardProps {
    user: User;
}

export function AchievementsCard({user}: AchievementsCardProps) {
    const [activeTooltipId, setActiveTooltipId] = React.useState<string | null>(null);
    const achievements = user ? JSON.parse(user.achievements) : [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Errungenschaften</CardTitle>
                <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {achievements.map((achievement: any) => (
                        <AchievementBadge
                            achievement={achievement}
                            activeTooltipId={activeTooltipId}
                            setActiveTooltipId={setActiveTooltipId}
                            key={achievement.id}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}