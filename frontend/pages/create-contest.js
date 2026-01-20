import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { contestAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CreateContest() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 30,
    maxParticipants: '',
    isPublic: true,
  });

  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    },
  ]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="alert alert-error">Please login to create a contest</div>
      </Layout>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10,
      },
    ]);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) {
          throw new Error(`Question ${i + 1} is empty`);
        }
        if (q.options.some((opt) => !opt.trim())) {
          throw new Error(`Question ${i + 1} has empty options`);
        }
      }

      const contestData = {
        ...formData,
        duration: parseInt(formData.duration),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        questions: questions.map((q) => ({
          ...q,
          correctAnswer: parseInt(q.correctAnswer),
          points: parseInt(q.points),
        })),
      };

      const response = await contestAPI.createContest(contestData);
      setSuccess('Contest created successfully!');
      setTimeout(() => {
        router.push(`/contest/${response.data.contest._id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '30px' }}>Create New Contest</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 className="card-title">Contest Details</h3>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="datetime-local"
                name="startTime"
                className="form-control"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input
                type="datetime-local"
                name="endTime"
                className="form-control"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                className="form-control"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Max Participants (leave empty for unlimited)</label>
              <input
                type="number"
                name="maxParticipants"
                className="form-control"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  style={{ marginRight: '10px' }}
                />
                Public Contest
              </label>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="card-title">Questions</h3>
              <button type="button" onClick={addQuestion} className="btn btn-success">
                Add Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4>Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIndex)} className="btn btn-danger">
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Question *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={question.question}
                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Options *</label>
                  {question.options.map((option, oIndex) => (
                    <input
                      key={oIndex}
                      type="text"
                      className="form-control"
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      style={{ marginBottom: '10px' }}
                      required
                    />
                  ))}
                </div>

                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select
                    className="form-control"
                    value={question.correctAnswer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                    required
                  >
                    {question.options.map((_, oIndex) => (
                      <option key={oIndex} value={oIndex}>
                        Option {oIndex + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Points *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={loading}>
            {loading ? 'Creating...' : 'Create Contest'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
