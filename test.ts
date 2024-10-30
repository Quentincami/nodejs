import * as fs from 'fs/promises';

const testPath = '/root/projects/nodejs/presentation.pptx';

(async () => {
  try {
    await fs.access(testPath);
    console.log('File found and accessible');
  } catch (error) {
    console.error('File not accessible:', error);
  }
})();
