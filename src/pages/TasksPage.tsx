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
      </div>
    </section>
  );
}
