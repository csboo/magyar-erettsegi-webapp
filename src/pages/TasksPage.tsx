import { Link } from "react-router-dom";

export function TasksPage() {
  return (
    <section className="home">
      <h1>Feladatok</h1>
      <p>Válassz gyakorló feladattípust</p>
      <div className="home-links">
        <Link className="home-link" to="/tasks/five-from-one">
          <h3>Öt közül egy</h3>
          <p>Melyik műben szerepel a megadott karakter?</p>
        </Link>
        <Link className="home-link" to="/tasks/gonosztablazat">
          <h3>Gonosztáblázat</h3>
          <p>Töltsd ki a táblázatot az elérhető opciókból, majd értékeld a kört.</p>
        </Link>
      </div>
    </section>
  );
}
