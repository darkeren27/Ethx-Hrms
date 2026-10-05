const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.resolve(__dirname, 'ETHX_HRMS_Technical_Architecture.html');
const pdfPathWorkspace = path.resolve(__dirname, 'ETHX_HRMS_Technical_Architecture.pdf');
const pdfPathDownloads = 'C:\\Users\\Krishna Tiwari\\Downloads\\ETHX_HRMS_Technical_Architecture.pdf';

if (!fs.existsSync(chromePath)) {
  console.error('Chrome executable not found at:', chromePath);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) {
  console.error('Source HTML not found at:', htmlPath);
  process.exit(1);
}

console.log('Compiling HTML to PDF using Chrome Headless...');
const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPathWorkspace}" "${htmlPath}"`;
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPathWorkspace)) {
  const stats = fs.statSync(pdfPathWorkspace);
  console.log(`Generated workspace PDF successfully (${stats.size} bytes)`);
  
  // Copy to Downloads folder
  fs.copyFileSync(pdfPathWorkspace, pdfPathDownloads);
  console.log(`Copied PDF to Downloads: ${pdfPathDownloads}`);
} else {
  console.error('PDF generation failed; file not found.');
  process.exit(1);
}
