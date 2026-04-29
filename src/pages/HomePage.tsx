import { Link } from "react-router-dom";

const links = [
  {
    to: "/search",
    title: "Keresés",
    description: "Fuzzy keresés karakterek, művek és szerzők között",
  },
  {
    to: "/archive",
    title: "Adattár",
    description: "Szerzők, művek és karakterek áttekintése",
  },
  {
    to: "/memoriterek",
    title: "Memoriterek",
    description: "Tanulandó versek és idézetek áttekintése",
  },
  {
    to: "/tasks",
    title: "Feladatok",
    description: "Gyakorló feladatok az érettségire",
  },
];

export function HomePage() {
  return (
    <section className="home">
      <h1>Irodalom Érettségi</h1>
      <p>Válassz egy eszközt a felkészüléshez</p>
      <div className="home-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="home-link">
            <h3>{link.title}</h3>
            <p>{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
