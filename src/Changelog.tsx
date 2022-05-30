export function Changelog() {
  return (
    <div className="App-changelog">
      <p><strong>2022-05-30</strong></p>
      <ul>
        <li>Updated New York Times wordlist (the words KORAN and QURAN can now be guessed).</li>
      </ul>
      <p><strong>2022-04-12</strong></p>
      <ul>
        <li>Wordlist selection: there is now an option for the New York Times wordlist.</li>
      </ul>
      <p><strong>2022-03-31</strong></p>
      <ul>
        <li>Added blind and no-keyboard variants. (Blind means the letters disappear after you guess a word.)</li>
        <li>Renamed first-key timing to "extra data" and also show total number of games this session.</li>
        <li>Left and right arrow keys change word length.</li>
      </ul>
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
  );
}
