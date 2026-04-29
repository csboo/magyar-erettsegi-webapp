import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ArchivePage } from "./pages/ArchivePage";
import { BooksPage } from "./pages/BooksPage";
import { FiveChoicePage } from "./pages/FiveChoicePage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ReaderPage } from "./pages/ReaderPage";
import { SearchPage } from "./pages/SearchPage";
import { TasksPage } from "./pages/TasksPage";

const redirects = [
  ["/index.html", "/"],
  ["/reader.html", "/reader"],
  ["/books.html", "/books"],
  ["/search.html", "/search"],
  ["/adattar.html", "/archive"],
  ["/feladat.html", "/tasks"],
  ["/feladat-5.html", "/tasks/five-from-one"],
] as const;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/five-from-one" element={<FiveChoicePage />} />
          {redirects.map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate replace to={to} />} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
