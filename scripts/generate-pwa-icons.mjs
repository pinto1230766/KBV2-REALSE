import sharp from 'sharp';

const publicDir = './public';

async function generatePwaIcons() {
  const iconPath = `${publicDir}/icon.png`;
  const outputDir = `${publicDir}/images`;
  
  // Generate pwa-192x192.png
  await sharp(iconPath)
    .resize(192, 192)
    .png()
    .toFile(`${outputDir}/pwa-192x192.png`);
  
  console.log('Generated pwa-192x192.png');
  
  // Generate pwa-512x512.png
  await sharp(iconPath)
    .resize(512, 512)
    .png()
    .toFile(`${outputDir}/pwa-512x512.png`);
  
  console.log('Generated pwa-512x512.png');
  
  console.log('PWA icons generation complete!');
}

generatePwaIcons().catch(console.error);
