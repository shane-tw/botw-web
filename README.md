# About
This is a client-side web application which allows converting BoTW saves from WiiU to Switch and vice-versa.

# Usage
1. Uploads your BoTW save directory, which contains option.sav
2. Wait a few seconds
3. Save should download, click the link below the button if it doesn't

Make sure your installed version of BoTW is newer or equal to the save version mentioned in the generated download link or the game won't boot

# Build instructions
Clone this repo. Make sure to clone the [botw-conv]() repo so it's placed beside this repo.
In www directory, run one of the following:
* `npm run start` - run in live mode
* `npm run build` - build for production. Afterwards, use `wasm-opt -O3 file.wasm -o out.wasm`

# Sources used
[WemI0/BOTW_SaveConv](https://github.com/WemI0/BOTW_SaveConv)
[marcrobledo/savegame-editors](https://github.com/marcrobledo/savegame-editors)
[DeltaJordan/BotW-Save-Manager](https://github.com/DeltaJordan/BotW-Save-Manager)