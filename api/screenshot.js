const chrome = require("@sparticuz/chrome-aws-lambda")

const ALLOWED_FILE_TYPES = ["jpeg", "webp", "png"]
const LOCAL = ["production", "preview"].includes(process.env.VERCEL_ENV)

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

    const darkMode = !!req.query.dark

    const options = LOCAL
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

    const page = await browser.newPage()

    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "true" },
    ])

    if (darkMode) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: "dark" },
      ])
    }

    await page.setViewport({
      width: Number(req.query.width) || 1920,
      height: Number(req.query.height) || 1080,
      deviceScaleFactor: Number(req.query.deviceScaleFactor) || 2,
    })

    await page.goto(url, {
      waitUntil: "networkidle2",
    })
    const file = await page.screenshot({
      type: fileType,
      // fullPage: fullPage,
      clip: {
        x: Number(req.query.x) || 0,
        y: Number(req.query.y) || 0,
        width: Number(req.query.width) || 1920,
        height: Number(req.query.height) || 1080,
      },
    })
    await browser.close()

    res.statusCode = 200
    res.setHeader("Content-Type", `image/${fileType}`)

    if (!LOCAL) {
      res.setHeader(
        "Cache-Control",
        `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
      )
    }

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
