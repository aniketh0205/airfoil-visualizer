import { useState, useEffect } from 'react';
import { fetchQuiz } from '../api/airfoilApi';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz().then(data => {
      setQuestions(data.questions);
      setLoading(false);
    }).catch(() => {
      setQuestions([
        { id: 1, question: 'What happens to lift when velocity increases?', options: ['Lift decreases', 'Lift increases proportionally to V²', 'Lift stays the same', 'Lift increases proportionally to V'], correctAnswer: 1 },
        { id: 2, question: 'Which force acts opposite to aircraft motion?', options: ['Lift', 'Thrust', 'Drag', 'Weight'], correctAnswer: 2 },
        { id: 3, question: 'What is angle of attack?', options: ['Angle between wing chord and relative wind', 'Angle of aircraft to ground', 'Angle of tail to fuselage', 'Angle between wing surfaces'], correctAnswer: 0 },
        { id: 4, question: 'What happens after stall angle?', options: ['Lift increases', 'Lift stays constant', 'Lift decreases rapidly', 'Lift becomes zero'], correctAnswer: 2 },
        { id: 5, question: 'Why do cambered airfoils generate lift at low AoA?', options: ['They are lighter', 'Curved upper surface creates pressure difference', 'Lower thickness', 'More drag increases lift'], correctAnswer: 1 },
      ]);
      setLoading(false);
    });
  }, []);

  const handleAnswer = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--accent-blue)' }}>Loading quiz...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 heading-gradient">Knowledge Quiz</h1>
      <p className="text-gray-400 mb-8">Test your understanding of aerodynamics concepts</p>

      {submitted && (
        <div className={`card mb-8 text-center`}
          style={score >= 4 ? { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)' } : score >= 3 ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' } : { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
          <p className="text-3xl mb-2">{score >= 4 ? '🎉' : score >= 3 ? '👍' : '📚'}</p>
          <h2 className="text-2xl font-bold mb-1">{score} / {questions.length}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {score === 5 ? 'Perfect score! Excellent understanding!' :
             score >= 4 ? 'Great job! Almost perfect!' :
             score >= 3 ? 'Good effort! Review some topics to improve.' :
             'Keep studying! Review the Learn page for more information.'}
          </p>
          <button onClick={handleReset} className="btn-primary mt-4">Retry Quiz</button>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, i) => {
          const isCorrect = submitted && answers[q.id] === q.correctAnswer;
          const isWrong = submitted && answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer;
          return (
            <div key={q.id} className={`card`}
              style={isCorrect ? { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)' } : isWrong ? { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)' } : {}}>
              <h3 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>
                <span className="mr-2" style={{ color: 'var(--accent-blue)' }}>Q{i + 1}.</span>
                {q.question}
              </h3>
              <div className="space-y-2">
                {q.options.map((opt, j) => {
                  let baseStyle = {
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    cursor: submitted ? 'default' : 'pointer'
                  };
                  let style = { ...baseStyle };
                  if (submitted) {
                    if (j === q.correctAnswer) {
                      style = { ...style, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600 };
                    } else if (j === answers[q.id] && j !== q.correctAnswer) {
                      style = { ...style, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' };
                    } else {
                      style = { ...style, borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' };
                    }
                  } else {
                    style = answers[q.id] === j
                      ? { ...style, borderColor: 'var(--accent-blue)', backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', fontWeight: 600 }
                      : { ...style, borderColor: 'var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-secondary)' };
                    style[':hover'] = {};
                  }
                  return (
                    <button
                      key={j}
                      onClick={() => !submitted && handleAnswer(q.id, j)}
                      style={style}
                      disabled={submitted}
                      onMouseEnter={e => { if (!submitted && answers[q.id] !== j) { e.target.style.borderColor = 'var(--accent-blue)'; e.target.style.backgroundColor = 'rgba(59,130,246,0.05)'; }}}
                      onMouseLeave={e => { if (!submitted && answers[q.id] !== j) { e.target.style.borderColor = 'var(--border-color)'; e.target.style.backgroundColor = 'transparent'; }}}
                    >
                      <span className="inline-block w-6 text-center font-medium text-xs mr-2">
                        {String.fromCharCode(65 + j)}.
                      </span>
                      {opt}
                      {submitted && j === q.correctAnswer && <span className="float-right" style={{ color: '#22c55e' }}>✓</span>}
                      {submitted && j === answers[q.id] && j !== q.correctAnswer && <span className="float-right" style={{ color: '#ef4444' }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="btn-primary px-12"
          >
            {Object.keys(answers).length < questions.length
              ? `Answer all questions (${Object.keys(answers).length}/${questions.length})`
              : 'Submit Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}
