import fs from 'fs';
import pdfParse from 'pdf-parse';

const filePath = '/Users/nigelotieno/Documents/chatbotusel/data/knowledge.pdf';

const buffer = fs.readFileSync(filePath);

pdfParse(buffer).then(data => {
  console.log('First 100 chars:', data.text.slice(0, 100));
}).catch(console.error);
