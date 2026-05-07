const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'raw_essays.txt'), 'utf-8');

const regex = /\d+\.\s*(.+?)\n\n([\s\S]+?)(?=\n\n\d+\.\s*|$)/g;
let match;
const essays = [];

while ((match = regex.exec(raw)) !== null) {
  const title = match[1].trim();
  const content = match[2].trim();
  essays.push({ title, content });
}

const fileContent = `export const essays = ${JSON.stringify(essays, null, 2)};\n`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'essays.ts'), fileContent, 'utf-8');
console.log('Successfully created src/data/essays.ts with ' + essays.length + ' essays.');
