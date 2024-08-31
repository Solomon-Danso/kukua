Steps to convert create a desktop app (MacOS)
## Step 1:
npm install

## Step 2
add favicon.cns 

use this website https://anyconv.com/png-to-icns-converter/ to convert png images to icns

## Step 3

npx electron-packager . Kukua --platform=darwin --icon=./kukua.icns --overwrite

## Step 4
npm install -g electron-installer-dmg

electron-installer-dmg ./Kukua-darwin-x64/Kukua.app Kukua --out=release-builds --overwrite --icon=./kukua.icns










