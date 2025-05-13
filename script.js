const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const translate = require('google-translate-api-x');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function translateText(text, targetLang = 'ar') {
    const maxRetries = 1;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const result = await translate(text, { to: targetLang });
            console.log(`Successfully translated text: "${text}" -> "${result.text}"`);
            return result.text;
        } catch (error) {
            if (error.message.includes('Too Many Requests')) {
                attempts++;
                const waitTime = Math.pow(2, attempts) * 1000;  
                console.warn(`Rate limit hit. Retrying in ${waitTime / 1000} seconds...`);
                await delay(waitTime);
            } else {
                console.error('Error translating text:', error);
                return text; 
            }
        }
    }

    console.error('Max retries reached. Returning original text.');
    return text;  
}

const directoryPath = 'C:/Users/A/Desktop/test'; 

async function translateHTMLFiles() {
    try {
        const files = await fs.readdir(directoryPath);
        console.log(`Found files: ${files}`);

        for (const file of files) {
            if (path.extname(file) === '.html') {
                const filePath = path.join(directoryPath, file);
                console.log(`Processing file: ${filePath}`);

                const html = await fs.readFile(filePath, 'utf-8');
                const $ = cheerio.load(html);

                const elementsToTranslate = [
                    // 'title',
                    // 'h1',
                    // 'p.margin-0',
                    // 'p',
                    'li.li1',
                    // 'h2.title',
                    // 'li.breadcrumb-item.active',
                    // 'div.panel-place-title',
                    // 'div.rui-form-switch-button.preset-secondary.font-size-m',
                    // 'span.button-content',
                    // 'div.accordion-content *',
                    // 'div.ltgeneral-foot-about-nav a',
                    // 'li.breadcrumb-item a',
                    //  'div.empty-placeholder *',
                ];

                let textsToTranslate = [];
                let elements = [];

                for (const selector of elementsToTranslate) {
                    $(selector).each(function () {
                        const elem = $(this);
                        const text = elem.text();
                        console.log(`Found text to translate: "${text}" from element: "${selector}"`);
                        textsToTranslate.push(text);
                        elements.push(elem);
                    });
                }

                const translatedTexts = [];
                for (const text of textsToTranslate) {
                    const translatedText = await translateText(text);
                    translatedTexts.push(translatedText);
                    await delay(500); 
                }

                for (let i = 0; i < elements.length; i++) {
                    elements[i].text(translatedTexts[i]);
                    console.log(`Updated element with translated text: "${translatedTexts[i]}"`);
                }

                await fs.writeFile(filePath, $.html(), 'utf-8');
                console.log(`Translated and saved file: ${file}`);
                await delay(1000);
            }
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

translateHTMLFiles();

