const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Reading CSV file...');
  const csvPath = 'C:/Users/user/Desktop/FINAL_BOYS_DATA_UPLOAD.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Parse header
  const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM if exists
  const headers = headerLine.split(',');

  const idIdx = headers.indexOf('id');
  const genderIdx = headers.indexOf('gender');
  const eventIdx = headers.indexOf('event');
  const rankIdx = headers.indexOf('rank');
  const athleteNameIdx = headers.indexOf('athlete_name');
  const recordIdx = headers.indexOf('record');
  const teamNameIdx = headers.indexOf('team_name');
  const gradeIdx = headers.indexOf('grade');
  const isDeletedIdx = headers.indexOf('is_deleted');

  console.log('Parsing records...');
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV split by comma (assuming no quotes around commas in values based on preview)
    // If there are quotes, we might need a better parser, but let's try simple first
    const row = lines[i].split(',');
    if (row.length < headers.length) continue;

    records.push({
      id: row[idIdx],
      gender: row[genderIdx],
      event: row[eventIdx],
      rank: parseInt(row[rankIdx], 10) || null,
      athlete_name: row[athleteNameIdx],
      school: row[teamNameIdx],
      record: row[recordIdx],
      grade: parseInt(row[gradeIdx], 10) || null,
      is_deleted: row[isDeletedIdx]?.toLowerCase().trim() === 'true',
      year: 2025 // Default to 2025 since girls have 2025
    });
  }

  console.log(`Parsed ${records.length} records. Starting chunked insertion...`);

  const chunkSize = 500;
  let successCount = 0;

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    console.log(`Inserting chunk ${i / chunkSize + 1} (${chunk.length} records)...`);
    
    const { data, error } = await supabase
      .from('nationwide_rankings')
      .upsert(chunk, { onConflict: 'id' }); // Upsert just in case

    if (error) {
      console.error('Error inserting chunk:', error.message, error.details);
      process.exit(1);
    }
    
    successCount += chunk.length;
  }

  console.log(`Successfully inserted ${successCount} records!`);
  
  // Verify with a count query
  const { count, error } = await supabase
    .from('nationwide_rankings')
    .select('*', { count: 'exact', head: true })
    .eq('gender', '남자');

  if (error) {
    console.error('Verification error:', error);
  } else {
    console.log(`Verified male records in DB: ${count}`);
  }
}

run().catch(console.error);
