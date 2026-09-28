export default function AdminFooter() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2 px-1 py-5 text-[0.75rem]"
      style={{ color: "var(--a-text-3)" }}
    >
      <p>© {new Date().getFullYear()} ByteSpace — admin panel</p>
      <p>Changes publish to the live site immediately.</p>
    </footer>
  );
}
