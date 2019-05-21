const puppeteer = require('puppeteer');
const cp = require('child_process');

const screenshot = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const pages = []
  await page.setViewport({width: 1920, height: 1080})
  await page.goto('https://agenda.pdc.bug.builders/', {waitUntil: 'networkidle0'});

  await page.evaluate((sel) => {
    var elements = document.querySelectorAll(sel);
    for(var i=0; i< elements.length; i++){
        elements[i].parentNode.removeChild(elements[i]);
    }
  }, '.jumbotron')

  await page.evaluate((sel) => {
    var elements = document.querySelectorAll(sel);
    for(var i=0; i< elements.length; i++){
        elements[i].style.display = 'none';
    }
  }, '.rbc-current-time-indicator')

  await page.evaluate((sel) => {
    var elements = document.querySelectorAll(sel);
    for(var i=0; i< elements.length; i++){
        elements[i].style['background-color'] = 'inherit';
    }
  }, '.rbc-today')


  for(let i = 0; i < 4; i += 1) {
    const screenshot = `/tmp/page_${i}.pdf`;
    await page.emulateMedia('screen');
    await page.pdf({scale: 0.9, pageRanges: '1', path: screenshot, printBackground: true, landscape: true});
    await page.click('.rbc-btn-group>button:nth-child(3)')
    console.log(screenshot);
    pages.push(screenshot)
  }

  await browser.close();

  const output = '/tmp/agenda.pdf'
  cp.execSync(`pdftk ${pages.join(' ')} cat output ${output}`)

  return output;
}

module.exports = screenshot
