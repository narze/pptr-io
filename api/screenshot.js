// const puppeteer = require("puppeteer-core")
// const chromium = require("@sparticuz/chromium-min")
// const chrome = require("chrome-aws-lambda")
const chrome = require("@sparticuz/chrome-aws-lambda")
// const playwright = require("playwright-core")

const ALLOWED_FILE_TYPES = ["jpeg", "webp", "png"]

module.exports = async (req, res) => {
  try {
    const url = req.query.url

    const fullPage = req.query.fullPage
      ? req.query.fullPage.toString().toLowerCase() == "true"
        ? true
        : false
      : false
    const screenshotFileType = req.query.type
      ? req.query.type.toString().toLowerCase()
      : "png"
    const fileType = ALLOWED_FILE_TYPES.includes(screenshotFileType)
      ? screenshotFileType
      : "png"

    // browser = await chromium.puppeteer.launch({
    //   args: chromium.args,
    //   defaultViewport: chromium.defaultViewport,
    //   executablePath: await chromium.executablePath,
    //   headless: chromium.headless,
    //   ignoreHTTPSErrors: true,
    // })

    // let page = await browser.newPage()

    // await page.goto(event.url || "https://example.com")

    // result = await page.title()

    const options = process.env.VERCEL
      ? {
          args: chrome.args,
          executablePath: await chrome.executablePath,
          headless: chrome.headless,
        }
      : {
          args: [],
          executablePath:
            process.platform === "win32"
              ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
              : process.platform === "linux"
              ? "/usr/bin/google-chrome"
              : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        }
    const browser = await chrome.puppeteer.launch(options)
    // const browser = await puppeteer.launch(options)

    // Chromium-min
    // const browser = await puppeteer.launch({
    //   args: chromium.args,
    //   // executablePath:
    //   //   process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
    //   executablePath: await chromium.executablePath(
    //     "https://github.com/Sparticuz/chromium/releases/download/v114.0.0/chromium-v114.0.0-pack.tar"
    //   ),
    //   headless: chromium.headless,
    //   ignoreHTTPSErrors: true,
    //   // headless: true,
    //   // ...more config options
    // })

    const page = await browser.newPage()

    // await page.setViewportSize({
    //   width: Number(req.query.width) || 1920,
    //   height: Number(req.query.height) || 1080,
    //   deviceScaleFactor: Number(req.query.deviceScaleFactor) || 1,
    // })

    await page.goto(url, {
      waitUntil: "networkidle2",
    })
    const file = await page.screenshot({
      type: fileType,
      fullPage: fullPage,
    })
    await browser.close()

    res.statusCode = 200
    res.setHeader("Content-Type", `image/${fileType}`)
    res.end(file)
  } catch (err) {
    console.log(err)
    res.statusCode = 500
    res.json({
      error: err.toString(),
    })
    res.end()
  }
}
