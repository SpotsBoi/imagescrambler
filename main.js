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

    const scrambleButton = document.getElementById("scramblebutton");
    const unscrambleButton = document.getElementById("unscramblebutton");
    const saveImageButton = document.getElementById("saveimagebutton");

    const downloadLink = document.createElement("a");
    downloadLink.download = "imagescrambleroutput.png";

    const canvas = document.getElementById("imagecanvas");

    // Global state
    let useImageURL = true;
    let blockSizeGlobal = 1;

    function UpdateBlockSize() {
        blockSizeGlobal = Math.pow(2, parseInt(blockSizeSilder.value));
        blockSizeText.innerHTML = "Block Size: " + blockSizeGlobal;
    }

    function FetchAndScrambleImage(unscramble) {
        // Create a new image.
        let targetImage = new Image();

        // Fetch the image.
        if (useImageURL) {
            targetImage.crossOrigin = "";
            targetImage.src = imageURLInput.value;
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

        targetImage.onload = function() {
            ScrambleImage(targetImage, canvas, passwordInput.value, unscramble, blockSizeGlobal);
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
        FetchAndScrambleImage(false);
    }

    unscrambleButton.onclick = function() {
        FetchAndScrambleImage(true);
    }

    saveImageButton.onclick = function() {
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.click();
    }

    UpdateBlockSize();
}
