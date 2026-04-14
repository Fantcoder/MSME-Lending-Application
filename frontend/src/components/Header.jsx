/**
 * Header — Minimal fintech branding bar.
 * Clean, no-nonsense, modeled after Setu/Perfios internal tool headers.
 */
export default function Header() {
  return (
    <header className="w-full border-b border-border bg-white">
      <div className="max-w-[680px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Logo mark — simple blue square with letter */}
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-heading leading-tight">MSME Lending</p>
            <p className="text-[11px] text-label leading-tight">Decision System</p>
          </div>
        </div>
        <span className="text-[11px] text-label border border-border rounded-full px-2.5 py-0.5">
          v1.0
        </span>
      </div>
    </header>
  );
}
