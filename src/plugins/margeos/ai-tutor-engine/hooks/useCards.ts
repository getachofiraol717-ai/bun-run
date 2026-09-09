import { useState } from "react";
import { ResponseCardEngine } from "../core/ResponseCardEngine";

export function useCards() {
  const [cards, setCards] = useState<any[]>([]);

  const generateCard = (type: string, topic: string, extraData?: any) => {
    const card = ResponseCardEngine.createCard(type, topic, extraData);
    setCards((prev) => [...prev, card]);
    return card;
  };

  const clearCards = () => setCards([]);

  return { cards, generateCard, clearCards };
}
