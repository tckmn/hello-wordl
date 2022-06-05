import { useRef } from "react";

interface TimerProps {
  count: number;
  times: Time[];
}

interface Timer2Props {
  morelen: number[];
  times: Time[];
  mode: string;
  firstKeyTiming: boolean;
  hibest: string;
}

export interface Time {
  word: string,
  time: number,
  firstKey: number,
  penalty: number,
  correct: boolean
}

interface TimeData {
  time: number | undefined,
  timeStart: number,
  timeStop: number,
  firstKeyTime: number | undefined,
  firstKeyTimeStart: number,
  firstKeyTimeStop: number
}

export function Timer(props: TimerProps) {
  const count = props.count;

  const best = useRef({
    count: count,
    time: 0
  });

  const correct = props.times.filter(t => t.correct);

  const diffs = correct
    .map((t, i) => (t.time - (i ? correct[i-1].time : 0))/1000)
    .slice(1).slice(-count);

  const slowest = Math.max.apply(0, diffs),
        fastest = Math.min.apply(0, diffs),
        total = diffs.length === count ? diffs.reduce((x,y) => x+y) : undefined;

  if (best.current.count !== count) {
    best.current = {
      count: count,
      time: 0
    };
  }

  if (total !== undefined && (best.current.time === 0 || total < best.current.time)) {
    best.current.time = total;
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
          <td>last {count}:</td>
          <td>{total && total.toFixed(2)}</td>
        </tr>
        <tr>
          <td>best:</td>
          <td>{best.current.time ? best.current.time.toFixed(2) : ''}</td>
        </tr>
      </table>
    </div>
  );
}

function clamp(lo: number, hi: number, x: number) {
  return Math.max(lo, Math.min(hi, x));
}

function paren(x: string | undefined) {
  return x === undefined ? '' : `(${x})`;
}

export function Timer2(props: Timer2Props) {
  const best = useRef({
    counts: [] as number[],
    data: [] as TimeData[]
  });

  const diffs = props.times.map((t, i) => i === 0 ? {
    word: '',
    time: 0,
    bonus: 0,
    correct: true
  } : {
    word: t.word,
    time: (t.time - props.times[i-1].time) / 1000 + t.penalty,
    bonus: (t.firstKey - props.times[i-1].time) / 1000,
    correct: t.correct
  }).slice(1);

  const goodIndices = diffs.reduce((acc, t, idx) => (
    t.correct ? acc.concat(idx) : acc
  ), [] as number[]);

  // check if best is stale

  if (best.current.counts.length !== props.morelen.length ||
      best.current.counts.some((c,i) => c !== props.morelen[i])) {

    // recompute best
    best.current.counts = props.morelen;
    best.current.data = [] as TimeData[];

    props.morelen.forEach(count => {
      const newbest: TimeData = {
        time: undefined,
        timeStart: 0,
        timeStop: 0,
        firstKeyTime: undefined,
        firstKeyTimeStart: 0,
        firstKeyTimeStop: 0
      };
      for (let i = 0; i + count <= goodIndices.length; ++i) {
        const start = goodIndices[i],
              stop = goodIndices[i+count],
              newtotal = diffs.slice(start, stop).reduce((x,y) => x+y.time, 0),
              newfirsttotal = newtotal - diffs[start].bonus;
        if (newbest.time === undefined || newtotal < newbest.time) {
            newbest.time = newtotal;
            newbest.timeStart = start;
            newbest.timeStop = stop;
        }
        if (newbest.firstKeyTime === undefined || newfirsttotal < newbest.firstKeyTime) {
            newbest.firstKeyTime = newfirsttotal;
            newbest.firstKeyTimeStart = start;
            newbest.firstKeyTimeStop = stop;
        }
      }
      best.current.data.push(newbest);
    });

  }

  // for displaying last
  const totals: (number | undefined)[] = [];
  const firstKeyTotals: (number | undefined)[] = [];

  props.morelen.forEach((count, i) => {

    const fromIdx = goodIndices.slice(-count, -count + 1)[0];
    const total = fromIdx === undefined ? undefined :
            diffs.slice(fromIdx).reduce((x,y) => x+y.time, 0),
          firstKeyTotal = total === undefined ? undefined :
            total - diffs[fromIdx].bonus;

    totals.push(total);
    firstKeyTotals.push(firstKeyTotal);

    if (total !== undefined && total < (best.current.data[i].time ?? Infinity)) {
      best.current.data[i].time = total;
      best.current.data[i].timeStart = fromIdx;
      best.current.data[i].timeStop = diffs.length;
    }

    if (firstKeyTotal !== undefined && firstKeyTotal < (best.current.data[i].firstKeyTime ?? Infinity)) {
      best.current.data[i].firstKeyTime = firstKeyTotal;
      best.current.data[i].firstKeyTimeStart = fromIdx;
      best.current.data[i].firstKeyTimeStop = diffs.length;
    }

  });

  // compute slowest and fastest for bar lengths (hardcoded to use last 10)
  const testrange = diffs.slice(-10).map(t => t.time),
        slowest = Math.max.apply(0, testrange),
        fastest = Math.min.apply(0, testrange);

  return (
    <div className="Game-timer2" aria-hidden="true">
      <div className="Game-timer2-times">
        {diffs.map((t, i) => {
          const rel = clamp(0, 1, 1-(t.time-fastest)/(slowest-fastest));
          const shade = (props.hibest === 'total' && best.current.data[0].timeStart <= i && i < best.current.data[0].timeStop) ||
                        (props.hibest === 'firstkey' && best.current.data[0].firstKeyTimeStart <= i && i < best.current.data[0].firstKeyTimeStop);
          return (
            <div key={i} className={"Game-timer2-round Game-timer2-" + (t.correct ? "correct" : "incorrect") + (shade ? ' Game-timer2-best' : '')}>
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
      {props.morelen.map((count, i) => <>
        <div className="Game-timer2-stats">
          <span>
            last {count}: {totals[i]?.toFixed(2)}
          </span>
          <span className="spacer"></span>
          <span>
            best: {best.current.data[i].time?.toFixed(2)}
          </span>
        </div>
        {props.firstKeyTiming ?
          <div className="Game-timer2-stats">
            <span>
              {paren(firstKeyTotals[i]?.toFixed(2))}
            </span>
            {i === 0 ?
              <span className="spacer">{props.times.filter(x=>x.correct).length-1}/{props.times.length-1}</span> :
              <span className="spacer"></span>
            }
            <span>
              {paren(best.current.data[i].firstKeyTime?.toFixed(2))}
            </span>
          </div>
        : undefined}
      </>)}
      <div className="Game-timer2-stats">
        <span className="spacer"></span>
        <span>{props.mode}</span>
        <span className="spacer"></span>
      </div>
    </div>
  );
}
