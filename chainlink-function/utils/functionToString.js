const fs = require("fs");
const path = require("path");

function escapeSolidityString(jsCode) {
  return jsCode
    .split("\n")
    .map((line) => `"${line.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join("\n");
}

const inputPath = path.resolve(__dirname, "chainlink-function.js");
const outputPath = path.resolve(__dirname, "source.txt");

const jsCode = fs.readFileSync(inputPath, "utf8");
const solidityString = `string source =\n${escapeSolidityString(jsCode)};`;

fs.writeFileSync(outputPath, solidityString);
console.log(`Solidity-compatible string written to ${outputPath}`);
