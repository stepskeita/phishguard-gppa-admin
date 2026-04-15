import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PageHeader from "../../components/shared/PageHeader";

export default function QuizManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [questions, setQuestions] = useState([
    { id: 1, text: "What is phishing?", options: ["A type of fishing", "A cyber attack via fake emails", "A network protocol", "A software tool"], correct: 1 },
    { id: 2, text: "Which is a sign of a phishing email?", options: ["Urgent language", "Known sender", "Clear formatting", "No links"], correct: 0 },
  ]);

  const [quizTitle, setQuizTitle] = useState("Phishing Basics Quiz");

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (qId) => {
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  const updateQuestionText = (qId, text) => {
    setQuestions(questions.map((q) => q.id === qId ? { ...q, text } : q));
  };

  const updateOption = (qId, oi, value) => {
    setQuestions(questions.map((q) => q.id === qId ? { ...q, options: q.options.map((o, i) => i === oi ? value : o) } : q));
  };

  const setCorrect = (qId, oi) => {
    setQuestions(questions.map((q) => q.id === qId ? { ...q, correct: oi } : q));
  };

  return (
    <div>
      <PageHeader
        title="Quiz Management"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Training", href: "/training" },
          { label: "Quiz" },
        ]}
      />

      <div className="max-w-2xl space-y-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-secondary border-0" />
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Question {qi + 1}</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeQuestion(q.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)} placeholder="Enter question..." className="bg-secondary border-0" />
            <p className="text-xs text-muted-foreground">Select the correct answer:</p>
            <RadioGroup value={String(q.correct)} onValueChange={(v) => setCorrect(q.id, Number(v))} className="space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  q.correct === oi ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                }`}>
                  <RadioGroupItem value={String(oi)} />
                  <Input value={opt} onChange={(e) => updateOption(q.id, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0" />
                </label>
              ))}
            </RadioGroup>
          </div>
        ))}

        <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Add Question
        </Button>

        <div className="flex items-center gap-3">
          <Button onClick={() => { toast.success("Quiz saved successfully"); navigate("/training"); }}>Save Quiz</Button>
          <Button variant="outline" onClick={() => navigate("/training")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}