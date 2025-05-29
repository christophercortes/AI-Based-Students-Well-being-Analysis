'use client';

import { useState } from 'react';

type SentimentScore = {
  neg: number;
  neu: number;
  pos: number;
  compound: number;
};

type Emotion = {
  label: string;
  score: number;
};

type ApiResponse = {
  sentiment?: SentimentScore;
  emotion?: Emotion[];
  summary: string;
};

export default function StudentForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a text file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const text = reader.result as string;

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data: ApiResponse = await res.json();
      console.log('API result:', data);
      setResult(data);
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Analyze Student Sentiment</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Analyze
        </button>
      </form>

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Results:</h3>
          <p>{result.summary}</p>
        </div>
      )}
    </div>
  );
}
