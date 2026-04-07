export function MarketingHeroBackground() {
  return (
    <>
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-16 h-64 w-64 rounded-full bg-[#d9c08a]/35 blur-3xl" />
        <div className="absolute right-[-5rem] top-8 h-72 w-72 rounded-full bg-[#93aa7f]/30 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[#f7faf5]/70 blur-3xl" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-no-repeat opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage: "url('/logo.svg')",
          backgroundPosition: "right -3rem center",
          backgroundSize: "min(68vw, 760px)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-[-10rem] w-[50vw] bg-no-repeat opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage: "url('/logo.svg')",
          backgroundPosition: "left center",
          backgroundSize: "min(46vw, 520px)",
        }}
      />
    </>
  );
}
