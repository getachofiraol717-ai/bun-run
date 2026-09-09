export interface ExampleOptions {
  concept: string;
  ageBand?: string;
  learningStyle?: string;
}

export function generateExampleText(opts: ExampleOptions): string {
  return `Real-world example for ${opts.concept}: Imagine you are driving a bike up a steep hill. The resistance you feel is directly proportional to gravity and slope angle. This illustrates ${opts.concept} in action!`;
}
