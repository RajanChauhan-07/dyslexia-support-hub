
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface ReadingStatCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  isLoading?: boolean;
}

const ReadingStatCard = ({
  title,
  value,
  description,
  icon,
  isLoading = false,
}: ReadingStatCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <span className="text-2xl font-bold">{value}</span>
            )}
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <div className="rounded-full p-2 bg-primary/10">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingStatCard;
