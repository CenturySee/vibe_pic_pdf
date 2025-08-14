import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-2 mb-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </div>
  );
}
