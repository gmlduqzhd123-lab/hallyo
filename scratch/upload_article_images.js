require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const articles = [
  { id: '373d0bc3-f4fb-4474-94cb-23265464e9cc', imgName: 'swim_article_1_1778316456273.png' },
  { id: '275270d2-4c9b-4eae-bcd1-814d1a538c64', imgName: 'swim_article_2_1778316470979.png' },
  { id: '03c55bfe-5aa0-45f9-9865-0b0a629b03c3', imgName: 'swim_article_3_1778316485442.png' },
  { id: 'ac63afc3-a983-4095-917e-9a2d85bc8942', imgName: 'swim_article_4_1778316501071.png' },
  { id: '097d5902-d3bb-415b-a8d1-446b77fc89fa', imgName: 'swim_article_5_1778316518152.png' },
  { id: '58fe8f2f-e0fa-4d80-88e5-6d7da1313fcd', imgName: 'swim_article_6_1778316542246.png' },
  { id: '2a446c3f-1df5-4da3-9237-9f65d150b81e', imgName: 'swim_article_7_1778316563484.png' },
  { id: '20f2884d-f762-4c2e-83d8-a4c7c4efa9c0', imgName: 'swim_article_8_1778316581024.png' },
  { id: '128060f3-a4ea-4f1d-ae73-ba672e64ee8f', imgName: 'swim_article_9_1778316598398.png' }
];

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Auth error:', authError);
    // Maybe try different password or account?
  } else {
    console.log('Logged in successfully');
  }

  for (const article of articles) {
    const fullPath = `C:\\Users\\user\\.gemini\\antigravity\\brain\\c2200fb3-80a6-4308-acc9-95f863a370cd\\${article.imgName}`;
    console.log(`Processing ${article.id} with ${article.imgName}`);
    
    try {
      const fileBuffer = fs.readFileSync(fullPath);
      const fileName = `news_${article.id}_${Date.now()}.png`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('Upload Error:', error);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;

      // Update Database
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({ photo_url: publicUrl })
        .eq('id', article.id);

      if (updateError) {
        console.error('DB Update Error:', updateError);
      } else {
        console.log(`Successfully updated ${article.id} with photo_url: ${publicUrl}`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
    }
  }
}

run();
