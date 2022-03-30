import { Clue } from "./clue";
import { Row, RowState } from "./Row";
import { maxGuesses } from "./util";

export function About() {
  return (
    <div className="App-about">
      <p>
        <i>speedle</i> is a fork of{' '}
        <i><a href="https://hellowordl.net">hello wordl</a></i>{' '}
        by <a href="https://twitter.com/chordbug">Lynn / @chordbug</a>,
        which is a remake of the word game{" "}
        <a href="https://www.powerlanguage.co.uk/wordle/">
          <i>Wordle</i>
        </a>{" "}
        by <a href="https://twitter.com/powerlanguish">powerlanguage</a>, which
        is allegedly based on the TV show <i>Lingo</i>.
      </p>
      <p>
        There are many different parameters
        for how the game works,
        which you can change in the settings.
        The speedrun timer displays a code
        which describes these parameters.
        The default is <code>v01-N5x10</code>.
      </p>
      <ul style={{textAlign: 'left'}}>
        <li><code>v01</code> is the version, which is currently always v01.</li>
        <li><code>N</code> is the difficulty: N for normal, H for hard, and U for ultra hard.</li>
        <li><code>5</code> is the word length.</li>
        <li><code>x10</code> is the length of the speedrun (how many wordles you have to solve).</li>
        <li><code>-a<i>XY</i></code>, if present, indicates which autoguessing features are enabled. The first digit (X) is 1 if you have "automatically press enter" turned on and 0 otherwise, and the second digit (Y) is the number of autoguesses you have.</li>
        <li><code>-d<i>X</i></code>, if present, indicates the amount of delay time after each guess, measured in 10ths of a second.</li>
        <li><code>-p<i>X</i></code>, if present, indicates the amount of penalty time added for each wrong guess, measured in 10ths of a second.</li>
      </ul>
      <hr />
      <p>
        You get {maxGuesses} tries to guess a target word.
        <br />
        After each guess, you get Mastermind-style feedback.
      </p>
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Absent, letter: "w" },
          { clue: Clue.Absent, letter: "o" },
          { clue: Clue.Correct, letter: "r" },
          { clue: Clue.Elsewhere, letter: "d" },
        ]}
      />
      <p>
        <b>W</b> and <b>O</b> aren't in the target word at all.
      </p>
      <p>
        <b className={"green-bg"}>R</b> is correct! The third letter is{" "}
        <b className={"green-bg"}>R</b>
        .<br />
        <strong>(There may still be a second R in the word.)</strong>
      </p>
      <p>
        <b className={"yellow-bg"}>D</b> occurs <em>elsewhere</em> in the target
        word.
        <br />
        <strong>(Perhaps more than once. 🤔)</strong>
      </p>
      <hr />
      <p>
        Let's move the <b>D</b> in our next guess:
      </p>
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Correct, letter: "d" },
          { clue: Clue.Correct, letter: "a" },
          { clue: Clue.Correct, letter: "r" },
          { clue: Clue.Absent, letter: "k" },
        ]}
        annotation={"So close!"}
      />
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Correct, letter: "d" },
          { clue: Clue.Correct, letter: "a" },
          { clue: Clue.Correct, letter: "r" },
          { clue: Clue.Correct, letter: "t" },
        ]}
        annotation={"Got it!"}
      />
      <p>
        Report issues{" "}
        <a href="https://github.com/tckmn/speedle/issues">here</a>, or{' '}
        <a href="https://tck.mn/contact">contact me</a>.
      </p>
    </div>
  );
}
