const Spider = require('spidering')
const { CronJob } = require('cron')
const AlertGuy = require('alertguy')
const jsonfile = require('jsonfile')
require('dotenv').config()
const searchArray = [ 'lactantes sem comorbidades', 'lact. sem comorb.' ]

async function scrapeInfoSite() {
	const url = 'https://filometro.saude.salvador.ba.gov.br'
	const spider = new Spider()
	await spider.createBrowser({
		slowMo: 1, headless: true,
	})
	await spider.createPage('clean')
	await spider.navigateTo(url)
	const vacinaInfoScript = `Array.from(document.querySelectorAll('.row.bgEnderecos')).map(item=>({"Local":item.querySelector('div').innerText,"PublicAlvo":item.querySelector('.publicoAlvo').innerText}))`
	const vacinaInfo = await spider.evaluate(vacinaInfoScript, '.row.bgEnderecos')
	await spider.closeBrowser()

	return vacinaInfo
}

// function getFromFile() {
// 	return jsonfile.readFileSync('tests/infotest.json')
// }

async function getInfoFromSite() {
	const foundArray = []
	// const vacinaInfo = await getFromFile()
	const vacinaInfo = await scrapeInfoSite()
	for (let i = 0; i < vacinaInfo.length; i += 1) {
		const info = vacinaInfo[i]
		for (let j = 0; j < searchArray.length; j += 1) {
			const search = searchArray[j]
			if (info.PublicAlvo.toLowerCase().indexOf(search) > -1) {
				foundArray.push(info)
			}
		}
	}

	if (foundArray.length === 0) {
		console.log('Found nothing')

		return 'Found nothing'
	}

	return foundArray
}

async function sendTelegramMessage(info) {
	let message = ''
	const alertguyConfig = { telegram: {
		token: process.env.TELEGRAM_TOKEN_1,
		chatId: process.env.TELEGRAM_CHATID_1,
	} }
	const alertguyConfig2 = { telegram: {
		token: process.env.TELEGRAM_TOKEN_2,
		chatId: process.env.TELEGRAM_CHATID_2,
	} }
	const alertguy = new AlertGuy(alertguyConfig)
	const alertguy2 = new AlertGuy(alertguyConfig2)
	if (info !== 'Found nothing') {
		for (let i = 0; i < info.length; i += 1) {
			const localInfo = info[i]
			message += `LOCAL: ${localInfo.Local}\n\nPUBLICO ALVO: ${localInfo.PublicAlvo}\n\n\n\n`
		}
		message = message.substr(0, message.length - 3)

		await alertguy.sendTelegramMessage(message)
		await alertguy2.sendTelegramMessage(message)
	}
}

function startCronjobs() {
	const cronJobsList = []
	console.log('Cronjob started. Waiting for the next execution')

	cronJobsList.app = new CronJob({
		cronTime: '0 */2 * * * *',
		onTick: async () => {
			if (cronJobsList.app.taskRunning) return

			console.log('Searching on the vacina site')

			cronJobsList.app.taskRunning = true

			const info = await getInfoFromSite()
			await sendTelegramMessage(info)

			console.log('Job ended. Waiting the next execution')

			cronJobsList.app.taskRunning = false
		},
		start: true,
		timeZone: 'America/Bahia',
	})
}

if (require.main === module) {
	startCronjobs()
}

// (async () => {

// })()

