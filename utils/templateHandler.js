const welcome = require("./mailTemplates/welcomeMail");


const templates = {
  welcome,
 
};

function renderTemplate(templateName, data) {
  const templateFn = templates[templateName];
  if (!templateFn) {
    throw new Error(`Template "${templateName}" not found`);
  }
  return templateFn(data);
}

module.exports = renderTemplate;
