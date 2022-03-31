import "./App.css";
import { maxGuesses, seed, urlParam } from "./util";
import Game from "./Game";
import { useEffect, useState } from "react";
import { About } from "./About";

function useSetting<T>(
  key: string,
  initial: T
): [T, (value: T | ((t: T) => T)) => void] {
  const [current, setCurrent] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch (e) {
      return initial;
    }
  });
  const setSetting = (value: T | ((t: T) => T)) => {
    try {
      const v = value instanceof Function ? value(current) : value;
      setCurrent(v);
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  };
  return [current, setSetting];
}

const now = new Date();
const todaySeed =
  now.toLocaleDateString("en-US", { year: "numeric" }) +
  now.toLocaleDateString("en-US", { month: "2-digit" }) +
  now.toLocaleDateString("en-US", { day: "2-digit" });

function App() {
  type Page = "game" | "about" | "settings" | "changelog";
  const [page, setPage] = useState<Page>("game");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [dark, setDark] = useSetting<boolean>("dark", prefersDark);
  const [colorBlind, setColorBlind] = useSetting<boolean>("colorblind", false);
  const [topbar, setTopbar] = useSetting<boolean>("topbar", false);
  const [autoenter, setAutoenter] = useSetting<boolean>("autoenter", false);
  const [runlen, setRunlen] = useSetting<number>("runlen", 10);
  const [difficulty, setDifficulty] = useSetting<number>("difficulty", 0);
  const [keyboard, setKeyboard] = useSetting<string>(
    "keyboard",
    "qwertyuiop-asdfghjkl-BzxcvbnmE"
  );
  const [enterLeft, setEnterLeft] = useSetting<boolean>("enter-left", false);
  const [autoguess, setAutoguess] = useSetting<string>("autoguess", '');
  const [firstKeyTiming, setFirstKeyTiming] = useSetting<boolean>("firstkey", true);
  const [delay, setDelay] = useSetting<number>("delay", 0);
  const [penalty, setPenalty] = useSetting<number>("penalty", 0);

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    if (urlParam("today") !== null || urlParam("todas") !== null) {
      document.location = "?seed=" + todaySeed;
    }
    setTimeout(() => {
      // Avoid transition on page load
      document.body.style.transition = "0.3s background-color ease-out";
    }, 1);
  }, [dark]);

  const link = (emoji: string, label: string, page: Page) => (
    <button
      className="emoji-link"
      onClick={() => setPage(page)}
      title={label}
      aria-label={label}
    >
      {emoji}
    </button>
  );

  return (
    <div className={"App-container" + (colorBlind ? " color-blind" : "")}>
      <div className="topwrap">
        <h1>
            speedle
        </h1>
        <div className="top-right">
          {page !== "game" ? (
            link("❌", "Close", "game")
          ) : (
            <>
              {link("❓", "About", "about")}
              {link("⚙️", "Settings", "settings")}
            </>
          )}
        </div>
      </div>
      {/*
      <div
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          visibility: page === "game" ? "visible" : "hidden",
        }}
      >
        <a href={seed ? "?random" : "?seed=" + todaySeed}>
          {seed ? "Random" : "Today's"}
        </a>
      </div>
      */}
      {page === "about" && <About />}
      {page === "settings" && (
        <div className="Settings">
          <div className="Settings-setting">
            <input
              id="dark-setting"
              type="checkbox"
              checked={dark}
              onChange={() => setDark((x: boolean) => !x)}
            />
            <label htmlFor="dark-setting">Dark theme</label>
          </div>
          <div className="Settings-setting">
            <input
              id="colorblind-setting"
              type="checkbox"
              checked={colorBlind}
              onChange={() => setColorBlind((x: boolean) => !x)}
            />
            <label htmlFor="colorblind-setting">High-contrast colors</label>
          </div>
          <div className="Settings-setting">
            <input
              id="topbar-setting"
              type="checkbox"
              checked={topbar}
              onChange={() => setTopbar((x: boolean) => !x)}
            />
            <label htmlFor="topbar-setting">Old speedrun timer style</label>
          </div>
          <div className="Settings-setting">
            <input
              id="autoenter-setting"
              type="checkbox"
              checked={autoenter}
              onChange={() => setAutoenter((x: boolean) => !x)}
            />
            <label htmlFor="autoenter-setting">Automatically press Enter</label>
          </div>
          <div className="Settings-setting">
            <input
              id="firstkey-setting"
              type="checkbox"
              checked={firstKeyTiming}
              onChange={() => setFirstKeyTiming((x: boolean) => !x)}
            />
            <label htmlFor="firstkey-setting">First-key timing</label>
          </div>
          <div className="Settings-setting">
            <input
              id="runlen-setting"
              type="number"
              value={runlen}
              onChange={(e) => setRunlen(parseInt(e.target.value) || 10)}
            />
            <label htmlFor="runlen-setting">Run length</label>
          </div>
          <div className="Settings-setting">
            <input
              id="delay-setting"
              type="number"
              value={delay}
              step="0.1"
              onChange={(e) => setDelay(Math.round(parseFloat(e.target.value)*10)/10)}
            />
            <label htmlFor="delay-setting">Guess delay (seconds)</label>
          </div>
          <div className="Settings-setting">
            <input
              id="penalty-setting"
              type="number"
              value={penalty}
              step="0.1"
              onChange={(e) => setPenalty(Math.round(parseFloat(e.target.value)*10)/10)}
            />
            <label htmlFor="penalty-setting">Guess penalty (seconds)</label>
          </div>
          <div className="Settings-setting">
            <input
              id="difficulty-setting"
              type="range"
              min="0"
              max="2"
              value={difficulty}
              onChange={(e) => setDifficulty(+e.target.value)}
            />
            <div>
              <label htmlFor="difficulty-setting">Difficulty:</label>
              <strong>{["Normal", "Hard", "Ultra Hard"][difficulty]}</strong>
              <div
                style={{
                  fontSize: 14,
                  height: 40,
                  marginLeft: 8,
                  marginTop: 8,
                }}
              >
                {
                  [
                    `Guesses must be valid dictionary words.`,
                    `Wordle's "Hard Mode". Green letters must stay fixed, and yellow letters must be reused.`,
                    `An even stricter Hard Mode. Yellow letters must move away from where they were clued, and gray clues must be obeyed.`,
                  ][difficulty]
                }
              </div>
            </div>
          </div>
          <div className="Settings-setting">
            <label htmlFor="keyboard-setting">Keyboard layout:</label>
            <select
              name="keyboard-setting"
              id="keyboard-setting"
              value={keyboard}
              onChange={(e) => setKeyboard(e.target.value)}
            >
              <option value="qwertyuiop-asdfghjkl-BzxcvbnmE">QWERTY</option>
              <option value="azertyuiop-qsdfghjklm-BwxcvbnE">AZERTY</option>
              <option value="qwertzuiop-asdfghjkl-ByxcvbnmE">QWERTZ</option>
              <option value="BpyfgcrlE-aoeuidhtns-qjkxbmwvz">Dvorak</option>
              <option value="qwfpgjluy-arstdhneio-BzxcvbkmE">Colemak</option>
            </select>
            <input
              style={{ marginLeft: 20 }}
              id="enter-left-setting"
              type="checkbox"
              checked={enterLeft}
              onChange={() => setEnterLeft((x: boolean) => !x)}
            />
            <label htmlFor="enter-left-setting">"Enter" on left side</label>
          </div>
          <div className="Settings-setting" style={{flexDirection: 'column'}}>
            <label htmlFor="autoguess-setting">Automatically guess at start of game:</label>
            <textarea
              name="autoguess-setting"
              id="autoguess-setting"
              value={autoguess}
              onChange={(e) => setAutoguess(e.target.value)}
            >
            </textarea>
          </div>
        </div>
      )}
      {page === "changelog" && (
        <div className="App-changelog">
          <p><strong>2022-03-30</strong></p>
          <ul>
            <li>Added "delay" option: amount of time to wait after every guess (including correct ones), like in original wordle.</li>
            <li>Added "penalty" option: on wrong guesses only, adds the given amount of time to your total time, but does not impose any real-time delay.</li>
          </ul>
          <p><strong>2022-03-29</strong></p>
          <ul>
            <li>Added "first-key timing" option: shows your total time starting from the first keystroke of the first word, instead of the start of the first round.</li>
          </ul>
          <p><strong>2022-02-15</strong></p>
          <ul>
            <li>Many changes for the first version of speedle that was released unto the world.</li>
          </ul>
          <p><strong>2022-02-08</strong></p>
          <ul>
            <li>The very first primitive version of speedle was conceived (still accessible via Settings -&gt; Old speedrun timer style).</li>
          </ul>
        </div>
      )}
      <Game
        maxGuesses={maxGuesses}
        hidden={page !== "game"}
        difficulty={difficulty}
        colorBlind={colorBlind}
        topbar={topbar}
        autoenter={autoenter}
        runlen={runlen}
        autoguess={autoguess}
        firstKeyTiming={firstKeyTiming}
        delay={delay}
        penalty={penalty}
        keyboardLayout={keyboard.replaceAll(
          /[BE]/g,
          (x) => (enterLeft ? "EB" : "BE")["BE".indexOf(x)]
        )}
        noev={page === 'settings'}
        chlink={
          <a href='#'
             onClick={e => { e.preventDefault(); setPage("changelog") }}>
               changelog
          </a>
        }
      />
    </div>
  );
}

export default App;
