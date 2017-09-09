const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const {JSDOM} = require("jsdom")
const DOM = new JSDOM('<!DOCTYPE html>')
const search = '.spec.js'
const dirpath = path.resolve(__dirname, '../../tests')
const status = {return: false}

global.document = DOM.window.document
global.Node = DOM.window.Node
global.Event = DOM.window.Event

/**
 * @param  {Object} x
 * @param  {Object} y
 * @return {Boolean}
 */
global.deepEqual = (x, y) => {
  const ok = Object.keys, tx = typeof x, ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    ok(x).length === ok(y).length &&
      ok(x).every(key => deepEqual(x[key], y[key]))
  ) : (x === y)
}

/**
 * @param  {Node} a
 * @param  {String} b
 * @return {Boolean}
 */
global.compare = (a, b) => {
	return a.innerHTML === b.replace(/\n|\t|\s{2,}/g, '')
}

/**
 * @param  {String} name
 * @param  {Function} body
 */
global.test = (name, body) => {
	const failed = []
	const passed = []
	const underline = '----------------'

	const exit = () => {
		if (!argv('--watch')) {
			process.exit(1)
		}
	}

	const report = (pass, fail) => {
		if (pass === 0 && fail === 0) {
			console.log('/* could not find any tests */')
		}
		
		console.log(underline+'\n'+pass +' assertions passed.\n'+fail+ ' assertions failed.\n')

		if (fail > 0) {
			setTimeout(exit)
		}
	}

	const log = (status, {msg, type}) => {
		switch (status) {
			case 'FAIL':
				console.log('\x1b[31m', type+': ✖', msg||'', '\x1b[0m')
				break
			case 'PASS':
				console.log('\x1b[32m', type+': ✓', msg||'', '\x1b[0m')
		}
	}

	const failure = (report) => status.return = (failed.push(report), end)
	const sucess = (report) => passed.push(report)

	const end = () => {
		if (status.return && status.return !== end)
			return

		console.log('\x1b[36m%s', name, '\n'+underline, '\x1b[0m')

		if (failed.length > 0) {
			console.log('Failed Tests')
			failed.forEach((v) => log('FAIL', v))
		}
		if (passed.length > 0) {
			console.log('Passed Tests');
			passed.forEach((v) => log('PASS', v))
		}

		report(passed.length, failed.length)
	}

	const ok = (value, msg) => (value ? sucess : failure)({type: 'OK', msg: msg})
	const equal = (value, expect, msg) => (value === expect ? sucess : failure)({type: 'EQUAL', msg: msg})
	const fail = (msg) => failure({type: 'FAIL', msg})
	const pass = (msg) => failure({type: 'PASS', msg})

	try {
		body({end, ok, equal, deepEqual, fail, pass})
	} catch (err) {
		console.error('\x1b[31m', err, '\x1b[0m')
		failure({type: 'ERR', msg: err})
	}
}

/**
 * @return {}
 */
const argv = (filter) => process.argv.join('').indexOf(filter) > -1

/**
 * @param {string} filepath
 * @return {*}
 */
const load = (filepath) => {
	delete require.cache[require.resolve(filepath)]
	return require(filepath)
}

/**
 * @return {void}
 */
const factory = (type) => {
	const files = fs.readdirSync(dirpath).filter((file) => file.lastIndexOf(search) > -1)
	const dependency = load('../../dist/dio.umd.js')

	try {
		console.log('\n')

		const specs = files.map((file) => path.join(dirpath, file))[type]((spec) => {
			delete require.cache[require.resolve(spec)]
			require(spec)(dependency)

			return status.return
		})

	} catch (err) {
		console.error('\x1b[31m', err, '\x1b[0m')
	}
}

/**
 * @param {string} file
 */
const listener = (file) => {
	if (!file)
		console.log('\nwatching..', 'tests')
	else
		console.log('changed > ' + file)

	status.return = false

	factory('some')
}

/**
 * @return {void}
 */
const startup = () => {
	const watch = argv('--watch') && chokidar.watch(dirpath, {ignored: /[\/\\]\./})
	
	if (!watch)		
		return factory('map')

	watch.on('ready', listener)
	watch.on('change', listener)
}

startup()
