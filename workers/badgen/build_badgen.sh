rm -rf dist/*.js dist/*.js.map dist/*.ts
git clone https://github.com/badgen/badgen
cd badgen
npm run build:node
npm run build:types
cd ..
cp badgen/dist/*.* ./dist
rm -rf badgen

rm icons.json
git clone https://github.com/badgen/badgen-icons
node badgen-icons/build.js
cp badgen-icons/icons.json ./dist
rm -rf badgen-icons

echo "Updated badgen & icons!"
