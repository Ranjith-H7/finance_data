export function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-300 border-t-transparent" />
    </div>
  );
}
