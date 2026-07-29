interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/** Consistent page top: title hierarchy on the left, actions on the right. */
export function PageHeader({
  title,
  description,
  children,
}: Readonly<PageHeaderProps>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight  text-white">
          {title}
        </h1>
        {description && (
          <p className="text-white/80 mt-1 text-sm">{description}</p>
        )}
      </div>
      {children && (
        <div className="text-white flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
