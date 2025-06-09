import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load embeddings
const embeddingsFile = path.join(process.cwd(), 'data/embeddings.json');
const embeddingsData = JSON.parse(fs.readFileSync(embeddingsFile, 'utf-8'));

// Load structured event data
const eventsFile = path.join(process.cwd(), 'data/events.json');
const eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf-8'));

// Create embedding for a question
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Cosine similarity helper
function cosineSimilarity(a, b) {
  const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
  const magB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
  return dot / (magA * magB);
}

// Helper to find the next upcoming event
function getNextEvent() {
  const today = new Date();

  const upcomingEvents = eventsData
    .map(event => ({
      ...event,
      dateObj: new Date(event.date),
    }))
    .filter(event => event.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj);

  return upcomingEvents[0] || null;
}

// POST handler
export async function POST(req) {
  try {
    const body = await req.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ text: 'No message provided.' }), { status: 400 });
    }

    // 1️⃣ Check if question is about the next competition
    const lowerMsg = userMessage.toLowerCase();
    if (
      lowerMsg.includes('next competition') ||
      lowerMsg.includes('upcoming event') ||
      lowerMsg.includes('next event') ||
      lowerMsg.includes('when is the next')
    ) {
      const nextEvent = getNextEvent();
      if (nextEvent) {
        const responseText = `The next competition is **${nextEvent.name}** on **${nextEvent.dateObj.toDateString()}**.`;
        return new Response(JSON.stringify({ text: responseText }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ text: 'No upcoming events found.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 2️⃣ Otherwise, do embeddings-based search
    const userEmbedding = await createEmbedding(userMessage);

    const similarities = embeddingsData.map(chunk => ({
      text: chunk.text,
      similarity: cosineSimilarity(userEmbedding, chunk.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topChunks = similarities.slice(0, 3).map(c => c.text);

    const systemPrompt = `
You are a helpful assistant. Use only the following information to answer:

${topChunks.join('\n\n')}

If the answer is not in this information, say "I don’t know."
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const aiMessage = response.choices[0].message.content.trim();

    return new Response(JSON.stringify({ text: aiMessage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ text: '⚠️ Error fetching response.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
