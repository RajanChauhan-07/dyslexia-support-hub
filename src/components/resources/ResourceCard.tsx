
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  title: string;
  description: string;
  link: string;
  category: string;
  className?: string;
}

const ResourceCard = ({ title, description, link, category, className }: ResourceCardProps) => {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block p-6 glass-panel rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group",
        className
      )}
    >
      <div className="inline-block mb-3 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
        {category}
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
        {title}
        <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </a>
  );
};

export default ResourceCard;
