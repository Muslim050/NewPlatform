export function PageHeader({ title, subtitle, children }) {
  return (
    <>
    {title &&  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-display-md text-ink sm:text-display-lg">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-ink-muted">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>}
    
    </>
   
  )
}
