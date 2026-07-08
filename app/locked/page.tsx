export default function LockedPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center rise-in">
        <h1 className="font-display text-5xl font-semibold tracking-tight mb-3">Glance</h1>
        <p className="text-ink-soft">
          This calendar is private. Open your secret bookmark link on this device to
          unlock it.
        </p>
      </div>
    </main>
  );
}
