import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
  titleColor?: string;
}

export function PageHeader({ title, description, titleColor }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-2 mb-8">
      <h1 className={`text-3xl font-bold tracking-tight font-headline ${titleColor || ''}`}>{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </div>
  );
}
