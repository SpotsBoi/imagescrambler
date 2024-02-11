const COLOR_COMPONENTS = 4;

window.onload = function() {
    // Get HTML elements.
    const imageURLContainer = document.getElementById("imageurlcontainer");
    const localFileContainer = document.getElementById("localfilecontainer");
    const imageURLInput = document.getElementById("imageurlinput");
    const imageFileInput = document.getElementById("imagefileinput");

    const useLocalFileButton = document.getElementById("uselocalfilebutton");
    const useImageURLButton = document.getElementById("useimageurlbutton");

    const blockSizeText = document.getElementById("blocksizetext");
    const blockSizeSilder = document.getElementById("blocksizesilder");
    
    const passwordInput = document.getElementById("passwordinput");
    const ivInput = document.getElementById("ivinput");

    const scrambleButton = document.getElementById("scramblebutton");
    const unscrambleButton = document.getElementById("unscramblebutton");
    const saveImageButton = document.getElementById("saveimagebutton");

    const downloadLink = document.createElement("a");
    downloadLink.download = "scrambledimage.png";

    const canvas = document.getElementById("imagecanvas");
    const context = canvas.getContext("2d");

    // Global state
    let useImageURL = true;
    let blockSize = 1;

    function UpdateBlockSize() {
        blockSize = Math.pow(2, Math.floor(Math.log(parseInt(blockSizeSilder.value)) / Math.log(2)));
        blockSizeText.innerHTML = "Block Size: " + blockSize;
    }

    function BlockToPixelIndex(imageData, blockIndex) {
        let imageBlockWidth = imageData.width / blockSize;

        return {
            x: (blockIndex % imageBlockWidth) * blockSize,
            y: Math.floor(blockIndex / imageBlockWidth) * blockSize
        };
    }

    function GetPixelIndex(imageData, x, y) {
        return (y * imageData.width + x) * COLOR_COMPONENTS;
    }

    function SwapBlocks(imageData, block1, block2) {
        if (blockSize === 1) {
            let block1Index = block1 * COLOR_COMPONENTS;
            let block2Index = block2 * COLOR_COMPONENTS;

            for (let i = 0; i < COLOR_COMPONENTS; i++) {
                let tempColor = imageData.data[block1Index + i];
                imageData.data[block1Index + i] = imageData.data[block2Index + i];
                imageData.data[block2Index + i] = tempColor;
            }
        } else {
            let block1Start = BlockToPixelIndex(imageData, block1);
            let block2Start = BlockToPixelIndex(imageData, block2);

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

    function ScrambleImage(imageURL, password, iv, unscramble) {
        // Create a new image.
        let targetImage = new Image();

        // Fetch the image.
        if (useImageURL) {
            targetImage.crossOrigin = "";
            targetImage.src = imageURL;
        } else {
            if (imageFileInput.files.length === 0) {
                alert("Please upload a file.");
                return;
            } else {
                let fileReader = new FileReader();
                fileReader.onload = function() {
                    targetImage.src = fileReader.result;
                }
                fileReader.readAsDataURL(imageFileInput.files[0]);
            }
        }

        // Alert the user if the image doesn't load.
        targetImage.onerror = function() {
            alert("Failed to load image.");
        }

        targetImage.onload = async function() {
            // Resize the canvas to fit the image.
            if (targetImage.width % blockSize === 0)
                canvas.width = targetImage.width;
            else
                canvas.width = targetImage.width + blockSize - (targetImage.width % blockSize);

            if (targetImage.height % blockSize === 0)
                canvas.height = targetImage.height;
            else
                canvas.height = targetImage.height + blockSize - (targetImage.height % blockSize);

            // Get the image data.
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(targetImage, 0, 0);
            let imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            let blockCount = (canvas.width * canvas.height) / (blockSize * blockSize);

            // Hash the password and IV.
            let hashedPassword = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
            let hashedIV = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(iv)));
            let key = await crypto.subtle.importKey("raw", hashedPassword, "AES-CBC", false, ["encrypt"]);

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
                    iv: hashedIV.subarray(0, 16),
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
                SwapBlocks(imageData, j, randomNumbers[j]);
            }

            // Put the result back on the canvas.
            context.putImageData(imageData, 0, 0);
        }
    }

    useLocalFileButton.onclick = function() {
        imageURLContainer.style.display = "none";
        localFileContainer.style.display = "flex";
        useLocalFileButton.style.display = "none";
        useImageURLButton.style.display = "inline-block";
        
        useImageURL = false;
    }

    useImageURLButton.onclick = function() {
        localFileContainer.style.display = "none";
        imageURLContainer.style.display = "flex";
        useImageURLButton.style.display = "none";
        useLocalFileButton.style.display = "inline-block";
        
        useImageURL = true;
    }

    blockSizeSilder.oninput = UpdateBlockSize;

    scrambleButton.onclick = function() {
        ScrambleImage(imageURLInput.value, passwordInput.value, ivInput.value, false);
    }

    unscrambleButton.onclick = function() {
        ScrambleImage(imageURLInput.value, passwordInput.value, ivInput.value, true);
    }

    saveImageButton.onclick = function() {
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.click();
    }

    UpdateBlockSize();
}
