const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateEnquiryPDF(data, outputFilePath) {
  let template = fs.readFileSync(
    path.join(__dirname, 'pdfTemplates/enquiryFormTemplate.html'), 'utf-8'
  );

  // Replace placeholders in template
  Object.keys(data).forEach(key => {
    const val = data[key] || '';
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] }); // for server deploy, use no-sandbox
  const page = await browser.newPage();
  await page.setContent(template, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputFilePath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();
}

module.exports = generateEnquiryPDF;
