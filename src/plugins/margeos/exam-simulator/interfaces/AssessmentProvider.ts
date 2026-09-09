/**
 * AssessmentProvider.ts
 *
 * Interface definitions for assessment data providers.
 */

import type { Exam, ExamQuestion } from '../models';

export interface IQuestionProvider {
  getQuestions(topic: string, limit?: number): Promise<ExamQuestion[]>;
  getQuestionById(questionId: string): Promise<ExamQuestion | null>;
  addQuestions(questions: ExamQuestion[]): Promise<void>;
  updateQuestion(question: ExamQuestion): Promise<void>;
  deleteQuestion(questionId: string): Promise<void>;
  searchQuestions(query: string): Promise<ExamQuestion[]>;
}

export interface IExamProvider {
  getExam(examId: string): Promise<Exam | null>;
  getExams(filter?: ExamFilter): Promise<Exam[]>;
  createExam(exam: Exam): Promise<void>;
  updateExam(exam: Exam): Promise<void>;
  deleteExam(examId: string): Promise<void>;
}

export interface ExamFilter {
  mode?: string;
  subject?: string;
  topic?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IResultProvider {
  getResult(resultId: string): Promise<any>;
  getResults(userId: string, limit?: number): Promise<any[]>;
  getResultsByExam(examId: string): Promise<any[]>;
  saveResult(result: any): Promise<void>;
}

export interface IContentProvider {
  getTopics(): Promise<string[]>;
  getTopicsBySubject(subject: string): Promise<string[]>;
  getSubjects(): Promise<string[]>;
  getRelatedTopics(topic: string): Promise<string[]>;
  getTopicPrerequisites(topic: string): Promise<string[]>;
}

export interface IResourceProvider {
  getStudyResources(topic: string): Promise<StudyResource[]>;
  getPracticeQuestions(topic: string, difficulty?: number): Promise<ExamQuestion[]>;
  getVideoTutorials(topic: string): Promise<VideoResource[]>;
  getArticles(topic: string): Promise<ArticleResource[]>;
}

export interface StudyResource {
  id: string;
  type: 'video' | 'article' | 'practice' | 'flashcard' | 'formula';
  title: string;
  url?: string;
  duration?: string;
  readTime?: string;
  difficulty?: number;
}

export interface VideoResource extends StudyResource {
  type: 'video';
  duration: string;
  thumbnail?: string;
}

export interface ArticleResource extends StudyResource {
  type: 'article';
  readTime: string;
  author?: string;
}
