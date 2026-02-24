import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (_error) {
        return false;
    }
}

async function ensureParentDir(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readRawRgba(filePath) {
    const output = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    return output;
}

async function writeRawRgba(filePath, data, width, height) {
    await ensureParentDir(filePath);
    await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(filePath);
}

export async function compareWithBaseline(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const actualPath = String(opts.actualPath || '').trim();
    const baselinePath = String(opts.baselinePath || '').trim();
    const diffPath = String(opts.diffPath || '').trim();
    const visualThresholdPercent = Number.isFinite(Number(opts.visualThresholdPercent))
        ? Number(opts.visualThresholdPercent)
        : 0.8;
    const updateBaseline = Boolean(opts.updateBaseline);

    if (!actualPath) {
        throw new Error('compareWithBaseline requires actualPath');
    }
    if (!baselinePath) {
        throw new Error('compareWithBaseline requires baselinePath');
    }
    if (!diffPath) {
        throw new Error('compareWithBaseline requires diffPath');
    }

    const baselineExists = await exists(baselinePath);
    if (updateBaseline) {
        await ensureParentDir(baselinePath);
        await fs.copyFile(actualPath, baselinePath);
        await ensureParentDir(diffPath);
        await fs.copyFile(actualPath, diffPath);
        return {
            visualDiffPercent: 0,
            visualThresholdPercent,
            baselinePath,
            actualPath,
            diffPath,
            baselineUpdated: true,
            pass: true
        };
    }

    if (!baselineExists) {
        await ensureParentDir(diffPath);
        await fs.copyFile(actualPath, diffPath);
        return {
            visualDiffPercent: 100,
            visualThresholdPercent,
            baselinePath,
            actualPath,
            diffPath,
            baselineUpdated: false,
            pass: false,
            reason: `missing baseline: ${baselinePath}`
        };
    }

    const actual = await readRawRgba(actualPath);
    const baseline = await readRawRgba(baselinePath);

    if (
        actual.info.width !== baseline.info.width
        || actual.info.height !== baseline.info.height
    ) {
        await ensureParentDir(diffPath);
        await fs.copyFile(actualPath, diffPath);
        return {
            visualDiffPercent: 100,
            visualThresholdPercent,
            baselinePath,
            actualPath,
            diffPath,
            baselineUpdated: false,
            pass: false,
            reason: `dimension mismatch actual=${actual.info.width}x${actual.info.height} baseline=${baseline.info.width}x${baseline.info.height}`
        };
    }

    const width = actual.info.width;
    const height = actual.info.height;
    const pixelCount = width * height;
    const diffBuffer = Buffer.alloc(pixelCount * 4);

    let changedPixels = 0;
    for (let i = 0; i < actual.data.length; i += 4) {
        const ar = actual.data[i];
        const ag = actual.data[i + 1];
        const ab = actual.data[i + 2];
        const aa = actual.data[i + 3];

        const br = baseline.data[i];
        const bg = baseline.data[i + 1];
        const bb = baseline.data[i + 2];
        const ba = baseline.data[i + 3];

        const changed = ar !== br || ag !== bg || ab !== bb || aa !== ba;
        if (changed) {
            changedPixels += 1;
            diffBuffer[i] = 255;
            diffBuffer[i + 1] = 48;
            diffBuffer[i + 2] = 48;
            diffBuffer[i + 3] = 255;
        } else {
            const gray = Math.round((ar + ag + ab) / 3);
            diffBuffer[i] = gray;
            diffBuffer[i + 1] = gray;
            diffBuffer[i + 2] = gray;
            diffBuffer[i + 3] = 80;
        }
    }

    await writeRawRgba(diffPath, diffBuffer, width, height);

    const visualDiffPercent = Number(((changedPixels / pixelCount) * 100).toFixed(4));
    return {
        visualDiffPercent,
        visualThresholdPercent,
        baselinePath,
        actualPath,
        diffPath,
        baselineUpdated: false,
        pass: visualDiffPercent <= visualThresholdPercent
    };
}
