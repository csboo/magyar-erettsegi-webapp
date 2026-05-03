import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { FontSizeControls } from "../components/FontSizeControls";
import { useCharacters } from "../hooks/useCharacters";
import { usePersistentState } from "../hooks/usePersistentState";
import { shuffle } from "../lib/random";
import type { CharacterRecord } from "../types";

type Question = {
  characterName: string;
  correctTitle: string;
  writer: string;
  description: string;
  options: string[];
};

function buildQuestions(records: CharacterRecord[], seed: number): Question[] {
  const allTitles = Array.from(new Set(records.map((record) => record.title).filter(Boolean)));
  if (allTitles.length < 2) {
    return [];
  }

  const offset = records.length === 0 ? 0 : seed % records.length;
  const rotatedRecords = [...records.slice(offset), ...records.slice(0, offset)];
  const shuffledRecords = shuffle(rotatedRecords);
  return shuffledRecords.map((record) => {
    const wrongTitles = shuffle(allTitles.filter((title) => title !== record.title)).slice(0, 4);
    return {
      characterName: record.name,
      correctTitle: record.title,
      writer: record.writer,
      description: record.description,
      options: shuffle([record.title, ...wrongTitles]),
    };
  });
}

export function FiveChoicePage() {
  const { records, loading, error } = useCharacters();
  const [restartSeed, setRestartSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [earlyFinishCount, setEarlyFinishCount] = useState<number | null>(null);
  const [fontScale, setFontScale] = usePersistentState<number>("fivechoice-fontScale", 1);

  const questions = useMemo(() => buildQuestions(records, restartSeed), [records, restartSeed]);

  const currentQuestion = questions[currentIndex];
  const isDone = !loading && !error && questions.length > 0 && currentIndex >= questions.length;
  const isCorrect = selectedTitle === currentQuestion?.correctTitle;

  function restart() {
    setRestartSeed((value) => value + 1);
    setCurrentIndex(0);
    setScore(0);
    setSelectedTitle(null);
    setShowHint(false);
    setEarlyFinishCount(null);
  }

  return (
    <section className="reader">
      <header className="header">
        <h1>Öt közül egy</h1>
        <p>Melyik műben szerepel a karakter?</p>
      </header>

        <section
          className="card font-scale-target"
          style={{ "--content-font-scale": fontScale } as CSSProperties}
        >
          <div className="toolbar">
            <div className="archive-controls">
              <FontSizeControls value={fontScale} onChange={setFontScale} />
            </div>
          </div>
          {loading ? <p className="status">Betöltés...</p> : null}
        {error ? <p className="status">{error}</p> : null}
        {!loading && !error && questions.length === 0 ? (
          <p className="status">Nincs elég mű a játékhoz.</p>
        ) : null}
        {isDone ? (
          <div className="done-card">
            <h2>Vége!</h2>
            <p className="score">
              {score} / {earlyFinishCount ?? questions.length}
            </p>
            <p className="score-detail">
              Helyes válaszok aránya: {Math.round((score / (earlyFinishCount ?? questions.length)) * 100)}%
            </p>
            <div className="game-controls">
              <button type="button" onClick={restart}>
                Újrakezdés
              </button>
              <Link className="button-link" to="/tasks">
                Vissza a feladatokhoz
              </Link>
            </div>
          </div>
        ) : null}
        {!loading && !error && currentQuestion && !isDone ? (
          <>
            <div className="game-question">
              <p className="question-label">Melyik műben szerepel?</p>
              <div className="char-name-row">
                <div className="char-name">{currentQuestion.characterName}</div>
                <button
                  type="button"
                  className="hint-btn"
                  aria-label="Tipp mutatása"
                  aria-expanded={showHint}
                  onClick={() => setShowHint((value) => !value)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 18h6M10 22h4M8.5 14.5C7.6 13.7 7 12.6 7 11.3A5 5 0 0 1 12 6a5 5 0 0 1 5 5.3c0 1.3-.6 2.4-1.5 3.2-.7.6-1.2 1.5-1.3 2.5h-4.4c-.1-1-.6-1.9-1.3-2.5Z" />
                  </svg>
                </button>
              </div>
              {showHint ? (
                <div className="hint-panel">
                  <p>
                    <strong>Szerző:</strong> {currentQuestion.writer}
                  </p>
                  <p>
                    <strong>Mű:</strong> {currentQuestion.correctTitle}
                  </p>
                  {currentQuestion.description ? (
                    <p>
                      <strong>Leírás:</strong> {currentQuestion.description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="options">
              {currentQuestion.options.map((title) => {
                const isSelected = selectedTitle === title;
                const isRightAnswer = title === currentQuestion.correctTitle;
                const buttonClass = [
                  "option-btn",
                  isRightAnswer && selectedTitle ? "correct" : "",
                  isSelected && selectedTitle && !isCorrect ? "wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={title}
                    type="button"
                    className={buttonClass}
                    disabled={selectedTitle !== null}
                    onClick={() => {
                      if (selectedTitle !== null) {
                        return;
                      }
                      setSelectedTitle(title);
                      if (title === currentQuestion.correctTitle) {
                        setScore((value) => value + 1);
                      }
                    }}
                  >
                    {title}
                  </button>
                );
              })}
            </div>

            {selectedTitle ? (
              <div className={`feedback ${isCorrect ? "correct" : "wrong"}`}>
                {isCorrect ? "Helyes!" : `Rossz! A helyes válasz: ${currentQuestion.correctTitle}`}
              </div>
            ) : null}

            <div className="game-controls">
              <button
                type="button"
                hidden={!selectedTitle}
                onClick={() => {
                  setCurrentIndex((value) => value + 1);
                  setSelectedTitle(null);
                  setShowHint(false);
                }}
              >
                Következő
              </button>
              <button
                type="button"
                hidden={!selectedTitle}
                onClick={() => {
                  setEarlyFinishCount(currentIndex + 1);
                  setCurrentIndex(questions.length);
                }}
              >
                Befejezés most
              </button>
            </div>

            <p className="status">
              {currentIndex + 1} / {questions.length}
            </p>
          </>
        ) : null}
      </section>
    </section>
  );
}
