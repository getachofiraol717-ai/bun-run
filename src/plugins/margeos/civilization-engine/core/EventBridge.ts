import { useCivilizationStore } from '../store/civilizationStore';
import { CivilizationEvent } from '../models/Civilization';

type EventListener = (event: CivilizationEvent) => void;

export class EventBridge {
  private static listeners: Set<EventListener> = new Set();

  static subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static emit(event: Omit<CivilizationEvent, 'id' | 'timestamp'>) {
    const fullEvent: CivilizationEvent = {
      ...event,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    useCivilizationStore.getState().recordEvent(event);
    this.listeners.forEach(l => {
      try {
        l(fullEvent);
      } catch (err) {
        console.error('Error in EventBridge listener:', err);
      }
    });
  }

  // Cross-Engine trigger shortcuts
  static onPdfAnalyzed(docTitle: string, chaptersCount: number) {
    useCivilizationStore.getState().gainXp(80, `Analyzed ${docTitle} (${chaptersCount} chapters)`);
    this.emit({
      type: 'study_milestone',
      title: 'Textbook Ingestion Complete',
      description: `Discovered new knowledge nodes from ${docTitle}`,
      impactXp: 80
    });
  }

  static onFormulaSolved(formulaName: string) {
    useCivilizationStore.getState().gainXp(30, `Solved formula: ${formulaName}`);
    this.emit({
      type: 'study_milestone',
      title: 'Formula Mastery',
      description: `Derived and practiced ${formulaName}`,
      impactXp: 30
    });
  }

  static onQuizCompleted(quizScore: number, total: number) {
    const xp = Math.round((quizScore / total) * 100);
    useCivilizationStore.getState().gainXp(xp, `Completed Quiz (${quizScore}/${total})`);
  }
}
