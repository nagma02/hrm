import { suggestedQuestions } from '../data/suggestedQuestions'
export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return <div className="hr-chat-suggestions" aria-label="Suggested questions">{suggestedQuestions.map((question) => <button key={question} onClick={() => onSelect(question)}>{question}</button>)}</div>
}
