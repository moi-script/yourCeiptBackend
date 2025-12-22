import fs from 'fs';


export function getFileList(file) {
	return fs.readdirSync(file);
}

export async function time(label, fn) {
    const start = performance.now();
    const res = await fn();
    const end = performance.now();
    console.log(`${label}: ${end - start} ms`);
    return res;
}
