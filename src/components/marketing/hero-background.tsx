export function MarketingHeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm gold blob — top left */}
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d9c08a]/30 blur-3xl" />
      {/* Green blob — top right */}
      <div className="absolute -right-16 top-4 h-80 w-80 rounded-full bg-[#93aa7f]/25 blur-3xl" />
      {/* Light cream blob — bottom center */}
      <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-[#f7faf5]/65 blur-3xl" />
      {/* Subtle green accent — mid left */}
      <div className="absolute left-1/4 top-1/2 h-48 w-48 rounded-full bg-[#b5c9a3]/20 blur-2xl" />
    </div>
  );
}

