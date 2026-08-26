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

    const { width: rotatedWidth, height: rotatedHeight } = rotateSize(image.width, image.height, rotation)

    canvas.width = rotatedWidth
    canvas.height = rotatedHeight

    ctx.translate(rotatedWidth / 2, rotatedHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)
    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)

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

    const outputContext = canvas.getContext('2d')
    if (!outputContext) return null
    outputContext.putImageData(imageData, 0, 0)
    if (targetWidth !== pixelCrop.width || targetHeight !== pixelCrop.height) {
        const resizedCanvas = document.createElement('canvas')
        resizedCanvas.width = pixelCrop.width
        resizedCanvas.height = pixelCrop.height
        const resizedContext = resizedCanvas.getContext('2d')
        if (!resizedContext) return null
        resizedContext.putImageData(imageData, 0, 0)
        outputContext.drawImage(resizedCanvas, 0, 0, targetWidth, targetHeight)
    }

    // As a compressed blob
    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file)
        }, 'image/webp', 0.8)
    })
}
