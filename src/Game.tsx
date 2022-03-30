import { useEffect, useRef, useState } from "react";
import { Row, RowState } from "./Row";
import dictionary from "./dictionary.json";
import { Clue, clue, describeClue, violation } from "./clue";
import { Timer, Timer2, Time } from "./Timer";
import { Keyboard } from "./Keyboard";
import targetList from "./targets.json";
import {
  describeSeed,
  dictionarySet,
  Difficulty,
  pick,
  resetRng,
  seed,
  speak,
  urlParam,
} from "./util";
import { decode, encode } from "./base64";

enum GameState {
  Playing,
  Won,
  Lost,
}

interface GameProps {
  maxGuesses: number;
  hidden: boolean;
  difficulty: Difficulty;
  colorBlind: boolean;
  topbar: boolean;
  autoenter: boolean;
  runlen: number;
  keyboardLayout: string;
  autoguess: string;
  noev: boolean;
  firstKeyTiming: boolean;
  delay: number;
  penalty: number;
}

const targets = targetList.slice(0, targetList.indexOf("murky") + 1); // Words no rarer than this one
const minLength = 4;
const maxLength = 11;

function randomTarget(wordLength: number): string {
  const eligible = targets.filter((word) => word.length === wordLength);
  let candidate: string;
  do {
    candidate = pick(eligible);
  } while (/\*/.test(candidate));
  return candidate;
}

function getChallengeUrl(target: string): string {
  return (
    window.location.origin +
    window.location.pathname +
    "?challenge=" +
    encode(target)
  );
}

let initChallenge = "";
let challengeError = false;
try {
  initChallenge = decode(urlParam("challenge") ?? "").toLowerCase();
} catch (e) {
  console.warn(e);
  challengeError = true;
}
if (initChallenge && !dictionarySet.has(initChallenge)) {
  initChallenge = "";
  challengeError = true;
}

function parseUrlLength(): number {
  const lengthParam = urlParam("length");
  if (!lengthParam) return 5;
  const length = Number(lengthParam);
  return length >= minLength && length <= maxLength ? length : 5;
}

function parseUrlGameNumber(): number {
  const gameParam = urlParam("game");
  if (!gameParam) return 1;
  const gameNumber = Number(gameParam);
  return gameNumber >= 1 && gameNumber <= 1000 ? gameNumber : 1;
}

function Game(props: GameProps) {
  const [gameState, setGameState] = useState(GameState.Playing);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [challenge, setChallenge] = useState<string>(initChallenge);
  const [wordLength, setWordLength] = useState(
    challenge ? challenge.length : parseUrlLength()
  );
  const [gameNumber, setGameNumber] = useState(parseUrlGameNumber());
  const [target, setTarget] = useState(() => {
    resetRng();
    // Skip RNG ahead to the parsed initial game number:
    for (let i = 1; i < gameNumber; i++) randomTarget(wordLength);
    return challenge || randomTarget(wordLength);
  });
  const [hint, setHint] = useState<string>(
    challengeError
      ? `Invalid challenge string, playing random game.`
      : `Make your first guess!`
  );
  const [times, setTimes] = useState<Time[]>([{
    word: '',
    time: +new Date(),
    firstKey: +new Date(),
    penalty: 0,
    correct: true
  }]);
  const [firstKey, setFirstKey] = useState<number | undefined>(undefined);
  const currentSeedParams = () =>
    `?seed=${seed}&length=${wordLength}&game=${gameNumber}`;
  useEffect(() => {
    if (seed) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + currentSeedParams()
      );
    }
  }, [wordLength, gameNumber]);
  const tableRef = useRef<HTMLTableElement>(null);
  const startNextGame = () => {
    if (challenge) {
      // Clear the URL parameters:
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setChallenge("");
    const newWordLength =
      wordLength >= minLength && wordLength <= maxLength ? wordLength : 5;
    setWordLength(newWordLength);
    setTarget(randomTarget(newWordLength));
    setHint("");
    setGuesses([]);
    setCurrentGuess("");
    setGameState(GameState.Playing);
    setGameNumber((x) => x + 1);
    setFirstKey(undefined);
    doAutoguess();
  };

  const autoguesses =
    props.autoguess.toLowerCase().replace(/[^a-z]+/g, ' ').split(' ').filter(x => x).slice(0,5);
  const doAutoguess = () => {
    autoguesses.forEach(x => submit(x, true));
  };

  useEffect(doAutoguess, []);

  async function share(copiedHint: string, text?: string) {
    const url = seed
      ? window.location.origin + window.location.pathname + currentSeedParams()
      : getChallengeUrl(target);
    const body = url + (text ? "\n\n" + text : "");
    if (
      /android|iphone|ipad|ipod|webos/i.test(navigator.userAgent) &&
      !/firefox/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({ text: body });
        return;
      } catch (e) {
        console.warn("navigator.share failed:", e);
      }
    }
    try {
      await navigator.clipboard.writeText(body);
      setHint(copiedHint);
      return;
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed:", e);
    }
    setHint(url);
  }

  const onKey = (key: string) => {
    if (gameState !== GameState.Playing) {
      if (key === "Enter") {
        startNextGame();
      }
      return;
    }
    if (guesses.length === props.maxGuesses) return;
    if (/^[a-z]$/i.test(key)) {
      setFirstKey(k => k ?? +new Date());
      let failed = false;
      if (props.autoenter && currentGuess.length === wordLength - 1) {
        if (submit(currentGuess + key.toLowerCase()) === 1) return;
        else failed = true;
      }
      setCurrentGuess((guess) =>
        (guess + key.toLowerCase()).slice(0, wordLength)
      );
      tableRef.current?.focus();
      if (!failed) setHint("");
    } else if (key === "Backspace") {
      setCurrentGuess((guess) => guess.slice(0, -1));
      setHint("");
    } else if (key === "Enter") {
      submit(currentGuess);
    }
  };

  const log = (target: string, correct: boolean) => {
      const time = +new Date(), dur = time - times[times.length-1].time;
      setTimes(times => [...times, {
        word: target,
        time: time,
        firstKey: firstKey ?? time,
        penalty: guesses.length * props.penalty,
        correct
      }]);
      localStorage.setItem('log', (localStorage.getItem('log') || '') + ',' + target + ' ' + (correct ? dur : 0));
  };

  const submit = (guess: string, autoing: boolean = false) => {
    if (guess.length !== wordLength) {
      setHint("Too short");
      return;
    }
    if (!dictionary.includes(guess)) {
      setHint("Not a valid word");
      return;
    }
    if (!autoing) {
      for (const g of guesses) {
        const c = clue(g, target);
        const feedback = violation(props.difficulty, c, guess);
        if (feedback) {
          setHint(feedback);
          return;
        }
      }
    }
    setGuesses((guesses) => guesses.concat([guess]));
    setCurrentGuess((guess) => "");

    const gameOver = (verbed: string) =>
      `You ${verbed}! The answer was ${target.toUpperCase()}. (Enter to ${
        challenge ? "play a random game" : "play again"
      })`;

    if (autoing) {
      // nop (TODO what if it's right lmao)
    } else if (guess === target) {
      setHint(gameOver("won"));
      setGameState(GameState.Won);
      log(target, true);
      if (props.autoenter) startNextGame();
    } else if (guesses.length + 1 === props.maxGuesses) {
      setHint(gameOver("lost"));
      setGameState(GameState.Lost);
      log(target, false);
      // if (props.autoenter) startNextGame();
    } else {
      setHint("");
      speak(describeClue(clue(guess, target)));
    }
    return 1;
  };

  const diffstring =
    props.difficulty === Difficulty.Normal ? 'N' :
    props.difficulty === Difficulty.Hard ? 'H' :
    props.difficulty === Difficulty.UltraHard ? 'U' : '';
  const autostring = `a${props.autoenter ? 1 : 0}${autoguesses.length}`;
  const mode = `v01-${diffstring}${wordLength}x${props.runlen}-${autostring}`;

  const noev = props.noev;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noev) return;
      if (!e.ctrlKey && !e.metaKey) {
        onKey(e.key);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [currentGuess, gameState, noev]);

  let letterInfo = new Map<string, Clue>();
  const tableRows = Array(props.maxGuesses)
    .fill(undefined)
    .map((_, i) => {
      const guess = [...guesses, currentGuess][i] ?? "";
      const cluedLetters = clue(guess, target);
      const lockedIn = i < guesses.length;
      if (lockedIn) {
        for (const { clue, letter } of cluedLetters) {
          if (clue === undefined) break;
          const old = letterInfo.get(letter);
          if (old === undefined || clue > old) {
            letterInfo.set(letter, clue);
          }
        }
      }
      return (
        <Row
          key={i}
          wordLength={wordLength}
          rowState={
            lockedIn
              ? RowState.LockedIn
              : i === guesses.length
              ? RowState.Editing
              : RowState.Pending
          }
          cluedLetters={cluedLetters}
        />
      );
    });

  return (
    <div className="Game" style={{ display: props.hidden ? "none" : "block" }}>
      {props.topbar && <Timer count={props.runlen} times={times} />}
      <div className="Game-options">
        <label htmlFor="wordLength">Letters:</label>
        <input
          type="range"
          min={minLength}
          max={maxLength}
          id="wordLength"
          disabled={
            gameState === GameState.Playing &&
            (guesses.length > 0 || currentGuess !== "" || challenge !== "")
          }
          value={wordLength}
          onChange={(e) => {
            const length = Number(e.target.value);
            resetRng();
            setGameNumber(1);
            setGameState(GameState.Playing);
            setGuesses([]);
            setCurrentGuess("");
            setTarget(randomTarget(length));
            setWordLength(length);
            setHint(`${length} letters`);
          }}
        ></input>
        <button
          style={{ flex: "0 0 auto" }}
          disabled={gameState !== GameState.Playing || guesses.length === 0}
          onClick={() => {
            setHint(
              `The answer was ${target.toUpperCase()}. (Enter to play again)`
            );
            setGameState(GameState.Lost);
            log(target, false);
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          Give up
        </button>
      </div>
      <div className="Game-main">
        <table
          className="Game-rows"
          tabIndex={0}
          aria-label="Table of guesses"
          ref={tableRef}
        >
          <tbody>{tableRows}</tbody>
        </table>
        {!props.topbar && <div
          className="Game-new-sidebar"
        >
          <Timer2 count={props.runlen} times={times} mode={mode} firstKeyTiming={props.firstKeyTiming} />
        </div>}
      </div>
      <p
        role="alert"
        style={{
          userSelect: /https?:/.test(hint) ? "text" : "none",
          whiteSpace: "pre-wrap",
        }}
      >
        {hint || `\u00a0`}
      </p>
      <Keyboard
        layout={props.keyboardLayout}
        letterInfo={letterInfo}
        onKey={onKey}
      />
      <div className="Game-seed-info">
        forked from
        {" "}
        <a href="https://hellowordl.net">hello wordl</a>
        {" "}
        by
        {" "}
        <a href="https://twitter.com/chordbug">Lynn / @chordbug</a>
      </div>
      {/*<p>
        <button
          onClick={() => {
            share("Link copied to clipboard!");
          }}
        >
          Share a link to this game
        </button>{" "}
        {gameState !== GameState.Playing && (
          <button
            onClick={() => {
              const emoji = props.colorBlind
                ? ["⬛", "🟦", "🟧"]
                : ["⬛", "🟨", "🟩"];
              share(
                "Result copied to clipboard!",
                guesses
                  .map((guess) =>
                    clue(guess, target)
                      .map((c) => emoji[c.clue ?? 0])
                      .join("")
                  )
                  .join("\n")
              );
            }}
          >
            Share emoji results
          </button>
        )}
      </p>
      */}
    </div>
  );
}

export default Game;
