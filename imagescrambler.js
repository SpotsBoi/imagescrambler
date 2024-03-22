const COLOR_COMPONENTS = 4;
const IV_SIZE = 16;

function BlockToPixelIndex(imageData, blockIndex, blockSize) {
    let imageBlockWidth = imageData.width / blockSize;

    return {
        x: (blockIndex % imageBlockWidth) * blockSize,
        y: Math.floor(blockIndex / imageBlockWidth) * blockSize
    };
}

function GetPixelIndex(imageData, x, y) {
    return (y * imageData.width + x) * COLOR_COMPONENTS;
}

function SwapBlocks(imageData, block1, block2, blockSize) {
    if (blockSize === 1) {
        let block1Index = block1 * COLOR_COMPONENTS;
        let block2Index = block2 * COLOR_COMPONENTS;

        for (let i = 0; i < COLOR_COMPONENTS; i++) {
            let tempColor = imageData.data[block1Index + i];
            imageData.data[block1Index + i] = imageData.data[block2Index + i];
            imageData.data[block2Index + i] = tempColor;
        }
    } else {
        let block1Start = BlockToPixelIndex(imageData, block1, blockSize);
        let block2Start = BlockToPixelIndex(imageData, block2, blockSize);

        for (let yOffset = 0; yOffset < blockSize; yOffset++) {
            for (let xOffset = 0; xOffset < blockSize; xOffset++) {
                let block1Index = GetPixelIndex(imageData, block1Start.x + xOffset, block1Start.y + yOffset);
                let block2Index = GetPixelIndex(imageData, block2Start.x + xOffset, block2Start.y + yOffset);

                for (let i = 0; i < COLOR_COMPONENTS; i++) {
                    let tempColor = imageData.data[block1Index + i];
                    imageData.data[block1Index + i] = imageData.data[block2Index + i];
                    imageData.data[block2Index + i] = tempColor;
                }
            }
        }
    }
}

async function ScrambleImage(targetImage, targetCanvas, keyBytes, unscramble, blockSize) {
    const context = targetCanvas.getContext("2d");

    // Resize the canvas to fit the image.
    if (targetImage.width % blockSize === 0)
        targetCanvas.width = targetImage.width;
    else
        targetCanvas.width = targetImage.width + blockSize - (targetImage.width % blockSize);

    if (targetImage.height % blockSize === 0)
        targetCanvas.height = targetImage.height;
    else
        targetCanvas.height = targetImage.height + blockSize - (targetImage.height % blockSize);

    // Get the image data.
    context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    context.drawImage(targetImage, 0, 0);
    let imageData = context.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

    let blockCount = (targetCanvas.width * targetCanvas.height) / (blockSize * blockSize);

    // Hash the password.
    let iv = new Uint8Array(IV_SIZE);
    let key = await crypto.subtle.importKey("raw", keyBytes, "AES-CBC", false, ["encrypt"]);

    // Determine loop bounds and increments.
    let blockStart, blockEnd, inc;

    if (unscramble) {
        blockStart = blockCount - 1;
        blockEnd = -1;
        inc = -1;
    } else {
        blockStart = 0;
        blockEnd = blockCount;
        inc = 1;
    }

    // Generate random numbers.
    let randomNumbers = new Uint32Array(blockCount);
    
    randomNumbers = await crypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: iv,
        },
        key,
        randomNumbers
    );
    
    // Turn the random numbers into pixel indices.
    randomNumbers = new Uint32Array(randomNumbers);
    for (let i = 0; i < randomNumbers.length; i++)
        randomNumbers[i] = randomNumbers[i] % blockCount;

    // Scramble or unscramble the pixels.
    for (let j = blockStart; j != blockEnd; j += inc) {
        SwapBlocks(imageData, j, randomNumbers[j], blockSize);
    }

    // Put the result back on the canvas.
    context.putImageData(imageData, 0, 0);
}
