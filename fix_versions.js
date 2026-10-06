const fs = require('fs');

const replacements = [
  ['Next.js 15', 'Next.js'],
  ['React 19', 'React']
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const [oldVal, newVal] of replacements) {
    // We want to be a bit careful, but since they want all places fixed:
    content = content.split(oldVal).join(newVal);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'src/data/courses.ts',
  'src/data/academy-knowledge.ts',
  'src/components/ui/dev-icon.tsx',
  'src/components/chat/enrollment-card.tsx',
  'src/components/admin/course-editor-page.tsx',
  'src/components/chat/course-catalog-response.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
      processFile(f);
  }
});
