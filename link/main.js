function Base64ToBytes(input) {
    let decoded = atob(input);
    let bytes = new Uint8Array(decoded.length);

    for (let i = 0; i < bytes.length; i++)
        bytes[i] = decoded.charCodeAt(i);

    return bytes;
}

window.onload = function() {
    const canvas = document.getElementById("imagecanvas");

    if (window.location.hash != "" && window.location.hash.length > 48) {
        let keyBytes = Base64ToBytes(window.location.hash.substring(1, 45));
        let blockSize = parseInt(window.location.hash.substring(45, 47), 16);
        let imageURL = window.location.hash.substring(47, window.location.hash.length);

        // Load the image.
        let targetImage = new Image();
        targetImage.crossOrigin = "";
        targetImage.src = imageURL;

        targetImage.onload = function() {
            ScrambleImage(targetImage, canvas, keyBytes, true, blockSize);
        }
    }
}
