/* eslint-disable */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_IMAGE = '/Users/mikines/.gemini/antigravity/brain/20a3d0a2-73db-4d3b-ad58-da6d529f452d/uploaded_image_0_1767099347494.jpg';
const APP_DIR = path.join(__dirname, '../app');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function generateIcons() {
    console.log('Processing icons...');

    // 1. app/icon.png (Used by Next.js to generate favicon and icons)
    // High res for best generation
    await sharp(SOURCE_IMAGE)
        .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(APP_DIR, 'icon.png'));
    console.log('Generated app/icon.png');

    // 2. app/apple-icon.png
    await sharp(SOURCE_IMAGE)
        .resize(180, 180, { fit: 'cover' })
        .png()
        .toFile(path.join(APP_DIR, 'apple-icon.png'));
    console.log('Generated app/apple-icon.png');

    // 3. public Web Manifest icons
    await sharp(SOURCE_IMAGE)
        .resize(192, 192, { fit: 'cover' })
        .png()
        .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));

    await sharp(SOURCE_IMAGE)
        .resize(512, 512, { fit: 'cover' })
        .png()
        .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
    console.log('Generated PWA icons in public/');
}

generateIcons().catch(console.error);
