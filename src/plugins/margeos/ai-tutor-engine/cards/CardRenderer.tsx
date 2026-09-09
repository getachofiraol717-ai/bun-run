import React from "react";
import type { LessonCard } from "../types/Lesson";
import { ConceptCard } from "./ConceptCard";
import { FormulaCard } from "./FormulaCard";
import { DiagramCard } from "./DiagramCard";
import { SummaryCard } from "./SummaryCard";
import { FlashcardCard } from "./FlashcardCard";
import { QuizCard } from "./QuizCard";
import { CodingCard } from "./CodingCard";
import { DebugCard } from "./DebugCard";
import { ReferenceCard } from "./ReferenceCard";
import { VisualLearningCard } from "./VisualLearningCard";
import { AccessibilityCard } from "./AccessibilityCard";
import { ExplanationCard } from "./ExplanationCard";
import { CodeCard } from "./CodeCard";
import { TimelineCard } from "./TimelineCard";
import { PracticeCard } from "./PracticeCard";
import { CommonMistakesCard } from "./CommonMistakesCard";
import { TipsCard } from "./TipsCard";
import { ChallengeCard } from "./ChallengeCard";
import { NextLessonCard } from "./NextLessonCard";
import { ProgressCard } from "./ProgressCard";

export const CardRenderer: React.FC<{ card: any }> = ({ card }) => {
  if (!card) return null;

  switch (card.type) {
    case "concept":
      return <ConceptCard data={card.data || card} />;
    case "formula":
      return <FormulaCard data={card.data || card} />;
    case "diagram":
      return <DiagramCard data={card.data || card} />;
    case "summary":
      return <SummaryCard data={card.data || card} />;
    case "flashcard":
      return <FlashcardCard data={card.data || card} />;
    case "quiz":
    case "quiz_card":
      return <QuizCard data={card.data || card} />;
    case "coding":
    case "code":
      return card.data ? <CodingCard data={card.data} /> : <CodeCard c={card} />;
    case "debug":
      return <DebugCard data={card.data || card} />;
    case "reference":
      return card.data ? <ReferenceCard data={card.data} /> : <ReferenceCard c={card} />;
    case "visual":
      return <VisualLearningCard data={card.data || card} />;
    case "accessibility":
      return <AccessibilityCard data={card.data || card} />;
    case "explanation":
      return <ExplanationCard c={card} />;
    case "timeline":
      return <TimelineCard c={card} />;
    case "practice":
      return <PracticeCard c={card} />;
    case "mistakes":
      return <CommonMistakesCard c={card} />;
    case "tips":
      return <TipsCard c={card} />;
    case "challenge":
      return <ChallengeCard c={card} />;
    case "next":
      return <NextLessonCard c={card} />;
    case "progress":
      return <ProgressCard c={card} />;
    default:
      return null;
  }
};

export default CardRenderer;
