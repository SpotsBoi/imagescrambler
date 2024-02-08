const COLOR_COMPONENTS = 4;

window.onload = function() {
    // Get HTML elements.
    const imageURLContainer = document.getElementById("imageurlcontainer");
    const localFileContainer = document.getElementById("localfilecontainer");
    const imageURLInput = document.getElementById("imageurlinput");
    const imageFileInput = document.getElementById("imagefileinput");

    const useLocalFileButton = document.getElementById("uselocalfilebutton");
    const useImageURLButton = document.getElementById("useimageurlbutton");

    const passwordInput = document.getElementById("passwordinput");
    const ivInput = document.getElementById("ivinput");

    const scrambleButton = document.getElementById("scramblebutton");
    const unscrambleButton = document.getElementById("unscramblebutton");

    const canvas = document.getElementById("imagecanvas");
    const context = canvas.getContext("2d");

    // Global state
    let useImageURL = true;

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
            canvas.width = targetImage.width;
            canvas.height = targetImage.height;

            // Get the image data.
            context.drawImage(targetImage, 0, 0);
            let imageData = context.getImageData(0, 0, targetImage.width, targetImage.height);

            let pixelCount = targetImage.width * targetImage.height;

            // Hash the password and IV.
            let hashedPassword = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
            let hashedIV = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(iv)));
            let key = await crypto.subtle.importKey("raw", hashedPassword, "AES-CBC", false, ["encrypt"]);

            // Determine loop bounds and increments.
            let pixelStart, pixelEnd, inc;

            if (unscramble) {
                pixelStart = pixelCount - 1;
                pixelEnd = -1;
                inc = -1;
            } else {
                pixelStart = 0;
                pixelEnd = pixelCount;
                inc = 1;
            }

            // Generate random numbers.
            let randomNumbers = new Uint32Array(pixelCount);
            
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
                randomNumbers[i] = (randomNumbers[i] % pixelCount) * COLOR_COMPONENTS;

            // Scramble or unscramble the pixels.
            for (let j = pixelStart; j != pixelEnd; j += inc) {
                let jx4 = j * 4;

                for (let k = 0; k < 4; k++) {
                    let tempColor = imageData.data[jx4 + k];
                    imageData.data[jx4 + k] = imageData.data[randomNumbers[j] + k];
                    imageData.data[randomNumbers[j] + k] = tempColor;
                }
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

    scrambleButton.onclick = function() {
        ScrambleImage(imageURLInput.value, passwordInput.value, ivInput.value, false);
    }

    unscrambleButton.onclick = function() {
        ScrambleImage(imageURLInput.value, passwordInput.value, ivInput.value, true);
    }
}
