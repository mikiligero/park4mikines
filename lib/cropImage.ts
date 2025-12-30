export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
        image.src = url
    })

function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * This function was adapted from the one in the Readme of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // Calculate the center of the crop area
    const centerX = pixelCrop.x + pixelCrop.width / 2
    const centerY = pixelCrop.y + pixelCrop.height / 2

    // Max dimension for the cropped image (to avoid memory issues and speed up massive photos)
    const maxDimension = 1200;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    // Scale down if needed
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
        const ratio = targetWidth / targetHeight;
        if (targetWidth > targetHeight) {
            targetWidth = maxDimension;
            targetHeight = maxDimension / ratio;
        } else {
            targetHeight = maxDimension;
            targetWidth = maxDimension * ratio;
        }
    }

    // Set canvas size to the final target size
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate scale factor
    const scaleFactor = targetWidth / pixelCrop.width;

    // Move the context to the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Scale first (since we want the subsequent transforms and drawing to be scaled)
    ctx.scale(scaleFactor, scaleFactor);

    // Rotate and flip
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)

    // Translate back so the crop center aligns with the canvas center
    ctx.translate(-centerX, -centerY)

    // Draw the image
    ctx.drawImage(image, 0, 0)

    // As a compressed blob
    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file)
        }, 'image/webp', 0.8)
    })
}
