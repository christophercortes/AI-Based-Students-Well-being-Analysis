import type { NextApiRequest, NextApiResponse } from 'next';
import * as vader from 'vader-sentiment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'No text provided' });
  }

  // VADER Sentiment Analysis
  const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text);
  const tone =
    vaderResult.compound >= 0.05
      ? 'positive'
      : vaderResult.compound <= -0.05
      ? 'negative'
      : 'neutral';

  // Hugging Face Emotion Analysis
  let emotionResult;
  try {
    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!hfRes.ok) {
      const errorText = await hfRes.text();
      console.error('Hugging Face Error:', errorText);
      return res.status(500).json({ message: 'Error analyzing emotion with Hugging Face API' });
    }

    emotionResult = await hfRes.json();
    console.log('Hugging Face response:', emotionResult);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch emotion analysis' });
  }

  // Extract top emotion
  const emotions: { label: string; score: number }[] = emotionResult[0];
  const topEmotion = emotions.sort((a, b) => b.score - a.score)[0];
  const emotion = topEmotion.label;
  const emotionScore = Math.round(topEmotion.score * 100);

  // Summary message
  let summary = '';
  if (tone === 'positive' && emotion === 'joy') {
    summary = `The tone is positive and the main feeling is joy with a ${emotionScore}% score. The student appears emotionally well.`;
  } else if (tone === 'negative' && emotion === 'sadness') {
    summary = `The tone is negative and the main feeling is sadness with a ${emotionScore}% score. This may suggest signs of depression. Please check on the student.`;
  } else if (tone === 'negative' && emotion === 'anger') {
    summary = `The tone is negative and the main feeling is anger with a ${emotionScore}% score. This could indicate frustration or bullying. Intervention may be needed.`;
  } else if (tone === 'neutral' && emotion === 'fear') {
    summary = `The tone is neutral but the main feeling is fear with a ${emotionScore}% score. The student might feel anxious or unsafe. Further observation is recommended.`;
  } else if (tone === 'neutral' && emotion === 'neutral') {
    summary = `The tone and emotion are neutral. The student's emotional state seems stable.`;
  } else {
    summary = `The tone is ${tone} and the main feeling is ${emotion} with a ${emotionScore}% score. Continue monitoring the student as needed.`;
  }

  return res.status(200).json({
    sentiment: vaderResult,
    emotion: emotions,
    summary,
  });
}
