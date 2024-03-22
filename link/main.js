function Base64ToBytes(input) {
    try {
        let decoded = atob(input);
        let bytes = new Uint8Array(decoded.length);

        for (let i = 0; i < bytes.length; i++)
            bytes[i] = decoded.charCodeAt(i);
        
        return bytes;
    } catch {
        return null;
    }
}

window.onload = function() {
    const canvas = document.getElementById("imagecanvas");

    if (window.location.hash.length < 48) {
        alert("Error: not enough information in link.");
        return;
    }
    
    let keyBytes = Base64ToBytes(window.location.hash.substring(1, 45));
    let blockSize = parseInt(window.location.hash.substring(45, 47), 16);
    let imageURL = window.location.hash.substring(47, window.location.hash.length);

    // Validate input.
    if (keyBytes === null || keyBytes.length != 32) {
        alert("Error: invalid encryption key.");
        return;
    }

    let blockSizeExp = Math.log(blockSize) / Math.log(2);
    if (blockSizeExp < 0 || blockSizeExp > 4 || Math.floor(blockSizeExp) !== blockSizeExp) {
        alert("Error: invalid block size.");
        return;
    }

    // Load the image.
    let targetImage = new Image();
    targetImage.crossOrigin = "";
    targetImage.src = imageURL;

    // Unscramble and display it.
    targetImage.onload = function() {
        ScrambleImage(targetImage, canvas, keyBytes, true, blockSize);
    }

    targetImage.onerror = function() {
        alert("Error: failed to load image.");
    }
}
