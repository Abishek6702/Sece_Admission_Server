const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateEnquiryPDF(data, outputFilePath) {
  // Read your HTML template string or file
  let template = fs.readFileSync(path.join(__dirname, '../utils/pdfTemplates/enquiryFormTemplate.html'), 'utf-8');

  // Replace placeholders with actual data (adjust as needed)
  Object.keys(data).forEach(key => {
    const val = data[key] || '';
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(template, { waitUntil: 'networkidle0' });

  // PDF settings to fit true A4
  await page.pdf({
    path: outputFilePath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
}

module.exports = generateEnquiryPDF;
