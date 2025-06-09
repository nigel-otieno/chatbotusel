import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import 'dotenv/config';

const filePath = './data/knowledge.pdf'; // Adjust path as needed

async function extractText() {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }

  fs.writeFileSync('./data/knowledge.txt', text, 'utf-8');
  console.log('✅ Extracted text saved to data/knowledge.txt');
}

extractText().catch(console.error);
