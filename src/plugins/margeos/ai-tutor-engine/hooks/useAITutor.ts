import { useEffect, useState, useCallback } from "react";
import { getState, subscribe, type AITutorState } from "../store/aiTutorStore";
import { ask, type AskArgs } from "../core/ResponseOrchestrator";

export function useAITutor() {
  const [state, setLocal] = useState<AITutorState>(getState());
  useEffect(() => subscribe(setLocal), []);
  const askTutor = useCallback((args: AskArgs) => ask(args), []);
  return { ...state, ask: askTutor };
}
