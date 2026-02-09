import { AlertCircle } from 'lucide-react';

interface ErrorCardProps {
  title: string;
  subtitle?: string;
}

export const ErrorCard = ({
  title,
  subtitle = 'Please check your connection and try again',
}: ErrorCardProps) => (
  <div className="bg-card border-destructive/30 shadow-card rounded-lg border p-5">
    <div className="flex items-center gap-3">
      <AlertCircle className="text-destructive" size={24} />
      <div>
        <p className="text-destructive font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      </div>
    </div>
  </div>
);
