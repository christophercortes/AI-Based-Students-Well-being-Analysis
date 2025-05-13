// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as vader from 'vader-sentiment';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { text } = req.body;
    const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    
    // Return the result inside the "sentiment" field
    res.status(200).json({ sentiment: result });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
