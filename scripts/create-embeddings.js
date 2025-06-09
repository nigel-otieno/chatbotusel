/**
 * scripts/create-embeddings.js
 *
 * Usage:
 *   node scripts/create-embeddings.js
 *
 * Make sure you have:
 * - .env.local with OPENAI_API_KEY
 * - data/knowledge.txt
 */

import fs from 'fs';
import OpenAI from 'openai';
import 'dotenv/config';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Read the extracted text
const text = fs.readFileSync('./data/knowledge.txt', 'utf-8');

// Helper: split text into ~1000-character chunks
function chunkText(text, maxLength = 1000) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

async function createEmbeddings() {
  const chunks = chunkText(text);
  const embeddings = [];

  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });
    const embedding = response.data[0].embedding;
    embeddings.push({ text: chunk, embedding });
    console.log('✅ Created embedding for chunk:', chunk.slice(0, 50));
  }

  fs.writeFileSync('./data/embeddings.json', JSON.stringify(embeddings, null, 2));
  console.log('✅ All embeddings saved to data/embeddings.json');
}

createEmbeddings().catch(console.error);
