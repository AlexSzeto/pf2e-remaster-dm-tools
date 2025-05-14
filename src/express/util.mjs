import { promises as fs } from 'fs';

export const errorResponse = (message) => {
    return {
        error: true,
        message: message
    }
}

export const successResponse = (message) => {
    return {
        error: false,
        message: message
    }
}

export const loadJSON = async (path) => await fs.readFile(path, 'utf-8')
    .then((data) => JSON.parse(data))
