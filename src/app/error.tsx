"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-navy">An error occurred</h1>
      <p className="mt-3 text-ink/70">{error.message || "Please try again."}</p>
      <button
        type="button"
        className="mt-8 bg-copper px-6 py-3 font-sans font-bold text-white hover:bg-copper-600"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
