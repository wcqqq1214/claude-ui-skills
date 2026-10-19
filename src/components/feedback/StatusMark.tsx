import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useVisible } from '../../hooks/useVisible';
import { classes } from '../../lib/classes';
import { createStatusPlayback } from './statusPlayback';
import type { Activity } from './statusPlayback';

export type StatusMarkProps = Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'onAnimationStart'> & {
  activity: Activity;
  running?: boolean;
  active?: boolean;
  /** Change to restart from the growing dot, including after completion. */
  replayKey?: string | number;
  onActivityEnter?: (activity: Activity) => void;
  onComplete?: () => void;
};

export function StatusMark({ activity, running = true, active = true, replayKey, onActivityEnter, onComplete, className, ...props }: StatusMarkProps) {
  const root = useRef<HTMLSpanElement>(null), strip = useRef<HTMLSpanElement>(null);
  const playback = useRef<ReturnType<typeof createStatusPlayback> | null>(null);
  const callbacks = useRef({ onActivityEnter, onComplete });
  const visible = useVisible(root, active);
  useLayoutEffect(() => { callbacks.current = { onActivityEnter, onComplete }; });
  useEffect(() => {
    const instance = createStatusPlayback(root.current!, strip.current!, value => callbacks.current.onActivityEnter?.(value), () => callbacks.current.onComplete?.());
    playback.current = instance;
    return () => { instance.dispose(); playback.current = null; };
  }, []);
  // A fresh run is explicit. Activity changes only select the next authored handoff.
  useEffect(() => { playback.current?.start(activity); }, [replayKey]);
  useEffect(() => {
    playback.current?.select(activity);
    if (!running) playback.current?.finish();
  }, [running, activity, replayKey]);
  useEffect(() => { playback.current?.pause(!visible); }, [visible, replayKey]);
  return <span {...props} ref={root} aria-hidden="true" className={classes('cui-status-mark relative inline-block size-5 shrink-0 overflow-clip text-[#d97757]', className)}>
    <span ref={strip} className="block w-5 bg-size-[100%_100%] bg-no-repeat" />
  </span>;
}
