const fs = require('fs')

const rawText = fs.readFileSync('scratch/raw_letters.txt', 'utf-8')
const blocks = rawText.split(/(?:^\d+\.\s.*$)/m).filter(b => b.trim())

const letters = blocks.map(block => {
  const lines = block.trim().split('\n')
  const title = lines[0].trim()
  const content = lines.slice(1).join('\n').trim()
  return { title, content }
}).filter(l => l.title)

const output = `export const letters = ${JSON.stringify(letters, null, 2)}
`

fs.writeFileSync('src/data/letters.ts', output)
console.log(`Successfully created src/data/letters.ts with ${letters.length} letters.`)
