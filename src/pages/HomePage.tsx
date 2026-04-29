import { Link } from "react-router-dom";

const links = [
  {
    to: "/search",
    title: "Keresés",
    description: "Fuzzy keresés karakterek, művek és szerzők között",
  },
  {
    to: "/reader",
    title: "Karakterek",
    description: "Irodalmi karakterek összefoglalói, egyesével lapozva",
  },
  {
    to: "/books",
    title: "Művek",
    description: "Művek szerinti csoportosítás, karakterlistával",
  },
  {
    to: "/archive",
    title: "Adattár",
    description: "Szerzők, művek és karakterek áttekintése",
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
