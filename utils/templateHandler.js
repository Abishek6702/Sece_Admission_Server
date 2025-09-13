const welcome = require("./mailTemplates/welcomeMail");
const enquiry = require("./mailTemplates/enquiryMail");

const templates = {
  welcome,
  enquiry,
 
};

function renderTemplate(templateName, data) {
  const templateFn = templates[templateName];
  if (!templateFn) {
    throw new Error(`Template "${templateName}" not found`);
  }
  return templateFn(data);
}

module.exports = renderTemplate;
