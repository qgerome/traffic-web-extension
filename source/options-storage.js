import OptionsSync from 'webext-options-sync'

export default new OptionsSync({
	defaults: {
		googleApiKey: null,
		home: {
			value: {},
			address: ''
		},
		work: {
			value: {},
			address: ''
		}
	},
	migrations: [OptionsSync.migrations.removeUnused],
	logging: true
})
