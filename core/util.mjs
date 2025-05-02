import { promises as fs } from 'fs';

export const loadJSON = async (path) => await fs.readFile(path, 'utf-8')
    .then((data) => JSON.parse(data))
