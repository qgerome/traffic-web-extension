// eslint-disable-next-line import/no-unassigned-import
import optionsStorage from './options-storage'

const GOOGLE_DIRECTION_ENDPOINT = 'https://maps.googleapis.com/maps/api/directions/json'

function getColor(duration) {
	if (duration < 25) {
		return '#00cc00'
	} else if (duration < 30) {
		return '#99cc00'
	} else if (duration < 35) {
		return '#cccc00'
	} else if (duration < 40) {
		return '#cc9900'
	} else {
		return '#cc0000'
	}
}

function calculateDistance(a, b) {
	console.log(a, b)
	var R = 6371 // km
	var dLat = toRad(b.lat - a.lat)
	var dLon = toRad(b.lat - a.lat)
	var latA = toRad(a.lat)
	var latB = toRad(b.lon)

	var x =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(latA) * Math.cos(latB)
	var c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
	var d = R * c
	return d
}

function toRad(val) {
	return (val * Math.PI) / 180
}

async function fetchDuration({ origin, destination, key, departure = 'now' }) {
	const query = new URLSearchParams()
	query.set('origin', origin.lat + ',' + origin.lon)
	query.set('destination', destination.lat + ',' + destination.lon)
	query.set('key', key)
	query.set('departure_time', departure)

	const response = await fetch(GOOGLE_DIRECTION_ENDPOINT + '?' + query.toString(), {
		headers: { accept: 'application/json' }
	})
	const data = await response.json()
	if (data.routes && data.routes[0].legs) {
		return data.routes[0].legs[0].duration_in_traffic
	}
	return null
}

async function getCurrentPosition() {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
			reject
		)
	})
}

async function setTrafficDuration() {
	const { home, work, googleApiKey } = await optionsStorage.getAll()
	const currentPosition = await getCurrentPosition()
	const [origin, destination] =
		calculateDistance(home.value, currentPosition) < calculateDistance(work.value, currentPosition)
			? [home, work] // Going to work
			: [work, home] // Going back at home

	console.log(`Going from "${origin.label}" to "${destination.label}"`)
	const duration = await fetchDuration({ origin: origin.value, destination: destination.value, key: googleApiKey })
	console.log(duration)
	if (duration) {
		const minutes = duration.value / 60
		const unit = minutes < 60 ? '' : ' h'
		chrome.browserAction.setBadgeText({ text: `${Math.round(minutes)}${unit}` })
		chrome.browserAction.setBadgeBackgroundColor({ color: getColor(minutes) })
		chrome.browserAction.setTitle({ title: duration.text })
	}
}

function getTimer() {
	const now = new Date()
	const hours = now.getHours()
	console.log(now, hours)
	const fiveMinutes = 5 * 60 * 1000
	const twentyMinutes = 20 * 60 * 1000
	if (hours >= 7 && hours <= 10) {
		return fiveMinutes
	} else if (hours >= 16 && hours <= 19) {
		return fiveMinutes
	} else {
		return twentyMinutes
	}
}

let timeout
function loop() {
	try {
		setTrafficDuration()
	} catch (err) {
		console.error(err)
	} finally {
		const timer = getTimer()
		console.log('setTimeout => ', timer)
		timeout = setTimeout(loop, timer)
	}
}

loop()
