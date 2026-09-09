import { useState } from "react";
import { RecommendationEngine } from "../core/RecommendationEngine";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<any>(null);

  const fetchRecommendations = (topic: string) => {
    const recs = RecommendationEngine.getRecommendations(topic);
    setRecommendations(recs);
    return recs;
  };

  return { recommendations, fetchRecommendations };
}
