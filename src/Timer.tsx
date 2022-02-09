import { useRef, useState } from "react";

interface TimerProps {
  count: number;
  times: number[];
}

export function Timer(props: TimerProps) {
  const best = useRef<number | undefined>(undefined);

  const diffs = props.times.map((t, i) => (t - props.times[i-1])/1000).slice(1).slice(-props.count);
  if (diffs.length < 2) {
    return <div className="Game-timer" />;
  }

  const slowest = Math.max.apply(0, diffs),
        fastest = Math.min.apply(0, diffs),
        total = diffs.length === props.count ? diffs.reduce((x,y) => x+y) : undefined;

  if (total !== undefined && (best.current === undefined || total > best.current)) {
    best.current = total;
  }

  return (
    <div className="Game-timer" aria-hidden="true">
      <div className="Game-timer-bars">
        {diffs.map(t => {
          const rel = 1-(t-fastest)/(slowest-fastest);
          return (
            <div className="Game-timer-bar-wrap">
              <div className="Game-timer-bar" style={{
                height: t/slowest*70,
                // backgroundColor: `rgb(${rel*200},${(1-rel)*150},0)`
                backgroundColor: `hsl(${rel*120},90%,40%)`
              }} />
              {t.toFixed(1)}
            </div>
          );
        })}
      </div>
      <table className="Game-timer-stats">
        <tr>
          <td>last:</td>
          <td>{diffs.slice(-1)[0].toFixed(2)}</td>
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
