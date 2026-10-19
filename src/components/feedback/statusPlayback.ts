import grow from '../../assets/status/grow.webp';
import thinkIn from '../../assets/status/think-in.webp';
import thinkLoop from '../../assets/status/think-loop.webp';
import thinkOut from '../../assets/status/think-out.webp';
import readIn from '../../assets/status/read-in.webp';
import readLoop from '../../assets/status/read-loop.webp';
import readOut from '../../assets/status/read-out.webp';
import writeIn from '../../assets/status/write-in.webp';
import writeLoop from '../../assets/status/write-loop.webp';
import writeOut from '../../assets/status/write-out.webp';
import codeIn from '../../assets/status/code-in.webp';
import codeLoop from '../../assets/status/code-loop.webp';
import codeOut from '../../assets/status/code-out.webp';

export type Activity = 'think' | 'read' | 'write' | 'code';
type Stage = 'dot' | 'grow' | 'in' | 'loop' | 'out' | 'done';
const frameMs = 33.3333;
const marks = {
  think: { frames: [16, 110, 15], seams: [54], urls: [thinkIn, thinkLoop, thinkOut] },
  read: { frames: [21, 60, 19], seams: [], urls: [readIn, readLoop, readOut] },
  write: { frames: [31, 60, 14], seams: [], urls: [writeIn, writeLoop, writeOut] },
  code: { frames: [16, 75, 9], seams: [18, 37, 56], urls: [codeIn, codeLoop, codeOut] },
};

/** Owns only the decorative strip. React owns props, labels and completion state. */
export function createStatusPlayback(host: HTMLElement, strip: HTMLElement, onEnter: (activity: Activity) => void, onComplete: () => void) {
  const decoded = new Set<Activity>(), pending = new Map<Activity, Promise<boolean>>();
  let activity: Activity = 'think', wanted: Activity = 'think', stage: Stage = 'dot';
  let revision = 0, animation: Animation | null = null, seamTimer: ReturnType<typeof setTimeout> | undefined;
  let finishing = false, paused = true, disposed = false;
  const target = () => decoded.has(wanted) ? wanted : activity;
  const clearSeam = () => { clearTimeout(seamTimer); seamTimer = undefined; };
  function settle() {
    clearSeam(); animation?.cancel(); animation = null;
    host.dataset.phase = stage = 'done';
    if (finishing) {
      finishing = false;
      const run = revision;
      // A mount with running=false may settle before decoding. Let StrictMode
      // dispose its probe instance before notifying the host.
      queueMicrotask(() => { if (!disposed && run === revision && stage === 'done') onComplete(); });
    }
  }
  function scheduleSeam() {
    clearSeam();
    if (paused || stage !== 'loop' || target() === activity || finishing || !animation || animation.currentTime === null) return;
    const time = Number(animation.currentTime);
    const seam = marks[activity].seams.map(frame => frame * frameMs).find(ms => ms > time + 50);
    if (seam === undefined) return;
    const current = animation, run = revision;
    seamTimer = setTimeout(() => {
      if (run === revision && animation === current && target() !== activity && !finishing && !paused) void play('out', run);
    }, seam - time);
  }
  async function play(nextStage: 'grow' | 'in' | 'loop' | 'out', run: number) {
    if (disposed || run !== revision) return;
    clearSeam(); animation?.cancel(); animation = null;
    stage = nextStage;
    const index = nextStage === 'in' ? 0 : nextStage === 'loop' ? 1 : 2;
    const frames = nextStage === 'grow' ? 10 : marks[activity].frames[index];
    host.dataset.phase = nextStage === 'grow' ? 'grow' : `${activity}-${nextStage}`;
    strip.style.backgroundImage = `url("${nextStage === 'grow' ? grow : marks[activity].urls[index]}")`;
    strip.style.height = `${frames * 20}px`;
    if (nextStage === 'in') onEnter(activity);
    let current: Animation | undefined;
    try {
      current = animation = strip.animate(Array.from({ length: frames }, (_, frame) => ({ transform: `translateY(-${frame * 20}px)` })), {
        duration: frames * frameMs, iterations: 1, easing: `steps(${frames}, jump-none)`, fill: 'forwards',
      });
      if (paused) current.pause();
      scheduleSeam();
      await current.finished;
    } catch {
      if (!disposed && run === revision && (!current || animation === current)) {
        clearSeam(); animation = null; host.dataset.phase = stage = 'dot';
        if (finishing) settle();
      }
      return;
    }
    if (disposed || run !== revision || animation !== current) return;
    if (nextStage === 'out') {
      if (finishing) return settle();
      activity = target(); return play('in', run);
    }
    if (nextStage === 'grow') { activity = target(); return play('in', run); }
    // Always finish entry, then loop; changed targets leave at a seam or loop end.
    void play(finishing || nextStage === 'loop' && target() !== activity ? 'out' : 'loop', run);
  }
  function select(nextActivity: Activity) {
    if (disposed) return;
    wanted = nextActivity; finishing = false;
    const run = revision;
    if (!pending.has(wanted)) {
      pending.set(wanted, Promise.all([grow, ...marks[wanted].urls].map(url => {
        const image = new Image(); image.src = url; return image.decode();
      })).then(() => { decoded.add(nextActivity); return true; }, () => false));
    }
    scheduleSeam();
    void pending.get(wanted)!.then(ready => {
      if (!ready || disposed || run !== revision || wanted !== nextActivity || finishing || stage === 'done') return;
      if (stage === 'dot') { activity = wanted; void play('grow', run); }
      else scheduleSeam();
    });
  }
  return {
    start(nextActivity: Activity) {
      revision++; clearSeam(); animation?.cancel(); animation = null;
      host.dataset.phase = stage = 'dot'; strip.style.backgroundImage = '';
      activity = nextActivity; select(nextActivity);
    },
    select,
    finish() {
      if (stage === 'done' || finishing) return;
      finishing = true; clearSeam();
      if (!animation) { revision++; settle(); }
    },
    pause(value: boolean) {
      paused = value;
      if (paused) { animation?.pause(); clearSeam(); }
      else { animation?.play(); scheduleSeam(); }
    },
    dispose() { disposed = true; revision++; clearSeam(); animation?.cancel(); animation = null; },
  };
}
