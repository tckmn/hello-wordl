import { useRef } from "react";

interface TimerProps {
  count: number;
  times: Time[];
}

interface Timer2Props {
  times: Time[];
}

export interface Time {
  word: string,
  time: number,
  correct: boolean
}

export function Timer(props: TimerProps) {
  const best = useRef<number | undefined>(undefined);

  const correct = props.times.filter(t => t.correct);

  const diffs = correct
    .map((t, i) => (t.time - (i ? correct[i-1].time : 0))/1000)
    .slice(1).slice(-props.count);

  const slowest = Math.max.apply(0, diffs),
        fastest = Math.min.apply(0, diffs),
        total = diffs.length === props.count ? diffs.reduce((x,y) => x+y) : undefined;

  if (total !== undefined && (best.current === undefined || total < best.current)) {
    best.current = total;
  }

  return (
    <div className="Game-timer" aria-hidden="true">
      <div className="Game-timer-bars">
        {diffs.length ? diffs.map(t => {
          const rel = 1-(t-fastest)/(slowest-fastest);
          return (
            <div className="Game-timer-bar-wrap">
              <div className="Game-timer-bar" style={{
                height: t/slowest*70,
                backgroundColor: `hsl(${rel*120},90%,40%)`
              }} />
              {t.toFixed(1)}
            </div>
          );
        }) : 'solve some wordles to see timer'}
      </div>
      <table className="Game-timer-stats">
        <tr>
          <td>last:</td>
          <td>{diffs.length ? diffs.slice(-1)[0].toFixed(2) : ''}</td>
        </tr>
        <tr>
          <td>last {props.count}:</td>
          <td>{total && total.toFixed(2)}</td>
        </tr>
        <tr>
          <td>best:</td>
          <td>{best.current && best.current.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  );
}

function clamp(lo: number, hi: number, x: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function Timer2(props: Timer2Props) {
  const diffs = props.times.map((t, i) => i === 0 ? {
    word: '',
    time: 0,
    correct: true
  } : {
    word: t.word,
    time: (t.time - props.times[i-1].time) / 1000,
    correct: t.correct
  }).slice(1);

  const testrange = diffs.slice(-10).map(t => t.time),
        slowest = Math.max.apply(0, testrange),
        fastest = Math.min.apply(0, testrange);

  return (
    <div className="Game-timer2" aria-hidden="true">
      {diffs.map(t => {
        const rel = clamp(0, 1, 1-(t.time-fastest)/(slowest-fastest));
        return (
          <div className={"Game-timer2-round Game-timer2-" + (t.correct ? "correct" : "incorrect")}>
            <div className="Game-timer2-word">
              {t.word.toUpperCase()}
            </div>
            <div className="Game-timer2-bar" style={{
              width: clamp(0, 1, t.time/slowest)*70,
              backgroundColor: `hsl(${rel*120},90%,40%)`
              }}>
              {t.time.toFixed(2)}
            </div>
          </div>
        );
      }).reverse()}
    </div>
  );
}
