// src/app/page.tsx
export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>notomed.dev</h1>
      <p>Deployed from Next.js on Vercel ✅</p>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/tools/hypona-calc">Hypona Tool</a></li>
        <li><a href="/tools/opioid-calc">Opioid Calc</a></li>
      </ul>
    </main>
  );
}
