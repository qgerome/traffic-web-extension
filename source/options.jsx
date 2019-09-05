import optionsStorage from './options-storage'
import React, { useState, useEffect } from 'react'
import { render } from 'react-dom'
import AsyncSelect from 'react-select/async'

const LocationPicker = ({ defaultValue, onChange }) => {
	const [isLoading, setLoading] = useState(false)
	function loadLocations(query, callback) {
		if (query) {
			setLoading(true)
			fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`, {
				headers: {
					accept: 'application/json'
				}
			})
				.then(response => response.json())
				.then(addresses => {
					const options = addresses.map(address => ({
						label: address.display_name,
						value: { lat: address.lat, lon: address.lon }
					}))
					setLoading(false)
					callback(options)
				})
		} else {
			callback([])
		}
	}

	return (
		<AsyncSelect
			cacheOptions
			loadOptions={loadLocations}
			isLoading={isLoading}
			defaultValue={defaultValue}
			onChange={onChange}
		/>
	)
}

const OptionsApp = ({ options }) => {
	const [home, setHome] = useState(options.home)
	const [work, setWork] = useState(options.work)
	const [googleApiKey, setApiKey] = useState(options.googleApiKey)
	useEffect(() => {
		optionsStorage.set({ home, work, googleApiKey })
	}, [home, work, googleApiKey])

	return (
		<main>
			<form id="options-form">
				<h2>API Keys</h2>
				<h4>Google Directions</h4>
				<input defaultValue={googleApiKey} onChange={e => setApiKey(e.target.value)} />

				<h2>Home Address</h2>
				<LocationPicker defaultValue={home} onChange={setHome} />

				<h2>Work Address</h2>
				<LocationPicker defaultValue={work} onChange={setWork} />
			</form>
		</main>
	)
}

optionsStorage.getAll().then(options => render(<OptionsApp options={options} />, document.getElementById('react-root')))
