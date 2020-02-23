import("../../botw-wasm/pkg").then(_wasm => {
	self.wasm = _wasm;
}).catch((e) => {
	console.error('wasm failed', e);
});

self.addEventListener('message', event => {
	let response, error;
	try {
		switch (event.data.cmd) {
			case 'convert_files':
				response = new Blob([self.wasm.convert_saves(event.data.files)]);
				break;
			case 'get_save_version':
				response = self.wasm.get_save_version(event.data.game_data_sav, event.data.option_sav);
				break;
			case 'get_save_target_platform':
				response = self.wasm.get_save_target_platform(event.data.option_sav);
				break;
		}
	} catch (e) {
		error = e.message;
	}

	if (response !== undefined || error !== undefined) {
		event.ports[0].postMessage({
			status: response !== undefined ? 'ok' : 'error',
			response: response !== undefined ? response : error
		});
	}
});