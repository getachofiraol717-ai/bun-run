import type { Lesson } from "../types/Lesson";
import type { StudentContext } from "../types/StudentContext";

export interface AITutorState {
  currentLesson: Lesson | null;
  history: Lesson[];
  loading: boolean;
  error: string | null;
  context: StudentContext;
}

let state: AITutorState = {
  currentLesson: null,
  history: [],
  loading: false,
  error: null,
  context: {},
};
const subs = new Set<(s: AITutorState) => void>();

export function getState(): AITutorState {
  return state;
}
export function setState(patch: Partial<AITutorState>) {
  state = { ...state, ...patch };
  for (const s of subs) s(state);
}
export function subscribe(fn: (s: AITutorState) => void): () => void {
  subs.add(fn);
  return () => { subs.delete(fn); };
}
export function pushLesson(lesson: Lesson) {
  setState({
    currentLesson: lesson,
    history: [lesson, ...state.history].slice(0, 25),
  });
}

// Legacy shims for pre-existing engine files (Phase 1 preservation).
export const getProfile: any = () => ({});
export const getSession: any = () => ({});
export const setProfile: any = (_: any) => {};
export const setSession: any = (_: any) => {};
export const subscribeProfile: any = (fn: any) => { return () => {}; };
export const subscribeSession: any = (fn: any) => { return () => {}; };
