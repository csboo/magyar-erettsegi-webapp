import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="reader">
      <header className="header">
        <h1>Az oldal nem található</h1>
        <p>A keresett útvonal nem létezik.</p>
      </header>
      <section className="card">
        <p className="status">
          Menj vissza a <Link to="/">főoldalra</Link>.
        </p>
      </section>
    </section>
  );
}
