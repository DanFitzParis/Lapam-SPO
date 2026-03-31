export function Sidebar() {
  return (
    <aside
      className="w-64 bg-shell flex flex-col"
      style={{ backgroundColor: "var(--color-shell-bg)" }}
    >
      <div className="p-6">
        <h1 className="text-white text-xl font-bold">Mission Control</h1>
        <p className="text-neutral-200 text-sm mt-1">SPO Dashboard</p>
      </div>

      <nav className="flex-1 px-4 py-2">
        <p className="text-neutral-200 text-sm">Navigation placeholder</p>
      </nav>

      <div className="p-4 border-t border-neutral-500">
        <p className="text-neutral-200 text-xs">Operator: Daniel</p>
        <p className="text-neutral-300 text-xs mt-1">OpenClaw v0.1</p>
      </div>
    </aside>
  );
}
