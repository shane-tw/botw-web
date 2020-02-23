import "../css/main.css";

const worker = new Worker('./worker.js');

async function get_save_version(game_data_sav, option_sav) {
	return handle_message({
		cmd: 'get_save_version',
		game_data_sav: game_data_sav,
		option_sav: option_sav
	});
}

async function get_save_target_platform(option_sav) {
	return handle_message({
		cmd: 'get_save_target_platform',
		option_sav: option_sav
	});
}

async function convert_files(files) {
	return handle_message({
		cmd: 'convert_files',
		files: files
	});
}

function handle_message(params) {
	const promise = new Promise((resolve, reject) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = (e) => {
			const data = e.data;
			if (data.status === 'ok') {
				resolve(data.response);
			} else {
				reject(data.response);
			}
		};
		worker.postMessage(params, [channel.port2]);
	});
	return promise;
}

async function read_files(files) {
	const promises = [];
	for (const file of files) {
		promises.push(new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				resolve({
					path: file.webkitRelativePath,
					contents: reader.result
				});
			});
			reader.addEventListener('error', reject);
			reader.readAsArrayBuffer(file);
		}));
	}
	return Promise.all(promises);
}

async function handle_blob(blob, target_platform, version) {
	const blobUrl = URL.createObjectURL(blob);

	const file_name = `botw_save.${target_platform}.zip`;
	const link = document.getElementById('download-link');
	link.href = blobUrl;
	link.innerHTML = `${file_name} - Latest ${version}`;
	link.download = file_name;
	link.style.display = '';
	link.click();
}

const filePicker = document.getElementById('file-picker');
filePicker.addEventListener('change', (event) => {
	const link = document.getElementById('download-link');
	link.style.display = 'none';

	const filepickerBtn = document.getElementById('file-picker-btn');
	const oldLabel = filepickerBtn.innerHTML;
	filepickerBtn.innerText = 'Working, please wait...';
	filepickerBtn.setAttribute('disabled', 'disabled');

	const files = event.target.files;
	const option_sav = Array.from(files).find(
		(file) => file.name === 'option.sav'
	);

	const cleanup = () => {
		filepickerBtn.innerHTML = oldLabel;
		filepickerBtn.removeAttribute('disabled');
	};

	if (!option_sav) {
		alert("There isn't a file named option.sav there :(");
		return cleanup();
	}

	setTimeout(() => {
		read_files(files).then(async (files) => {
			const option_sav = files.find((file) => file.path.endsWith('option.sav'));
			const platform = await get_save_target_platform(option_sav);
			const game_sav_latest = files.find((file) => file.path.endsWith('5/game_data.sav'));
			const version = await get_save_version(game_sav_latest, option_sav);
			const blob = await convert_files(files);
			handle_blob(blob, platform, version);
		}).catch((e) => {
			alert('Failed, see console for reason');
			console.error(e);
		}).finally(cleanup);
	}, 10);
});