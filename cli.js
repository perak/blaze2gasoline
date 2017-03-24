#! /usr/bin/env node

const commandLineArgs = require("command-line-args");
const fs = require("fs");
const path = require("path");
const replaceExt = require("replace-ext");
const b2g = require("./blaze2gasoline");

const optionDefinitions = [
  { name: "input", alias: "i", type: String },
  { name: "output", alias: "o", type: String },
  { name: "overwrite", alias: "w", type: Boolean}
];

const args = commandLineArgs(optionDefinitions);

console.log("");
console.log("Converts \"Blaze\" template (html and js) code to json. Resulting json is input file for gasoline-turbo which can generate Blaze, React or Angular code.");

var printUsage = function() {
	console.log("");
	console.log("Usage:");
	console.log("\tblaze2gasoline -i input.html -o output.json");
	console.log("\t\t-i, --input\tInput file");
	console.log("\t\t-o, --output\tOutput file");
	console.log("\t\t-w, --overwrite\tOverwrite existing output files.");
	console.log("");
	console.log("Enjoy! (and expect bugs)");
	console.log("");
};

if(!args.input) {
	printUsage();
	process.exit(1);
}

if(!fs.existsSync(args.input)) {
	console.log("Error: input file \"" + args.input + "\" not found.");
	process.exit(1);
}

var inputStat = fs.lstatSync(args.input);

if(!inputStat.isFile()) {
	console.log("Error: input \"" + args.input + "\" is not a file.");
	process.exit(1);
}

if(!args.output) {
	printUsage();
	process.exit(1);
}

if(fs.existsSync(args.output)) {
	if(!args.overwrite) {
		console.log("Error: output file \"" + args.output + "\" already exists.");
		console.log("Use -w switch to overwrite.");
		process.exit(1);
	}

	var outputStat = fs.lstatSync(args.output);

	if(outputStat.isDirectory()) {
		console.log("Error: output \"" + args.output + "\" is not a file.");
		process.exit(1);
	}
}


// read input file
var inputHTML = "";
try {
	inputHTML = fs.readFileSync(args.input, "utf8");
} catch(e) {
	console.log("Error: cannot read input file \"" + args.input + "\". " + e.message);
	process.exit(1);
}

var inputJS = "";
var inputJSfile = replaceExt(args.input, ".js");
if(fs.existsSync(inputJSfile)) {
	try {
		inputJS = fs.readFileSync(inputJSfile, "utf8");
	} catch(e) {
		console.log("Error: cannot read input file \"" + inputJSfile + "\". " + e.message);
		process.exit(1);
	}
}

console.log("");
console.log("Converting...");
var gas = b2g.blaze2gasoline(inputHTML, inputJS);

try {
	fs.writeFileSync(args.output, JSON.stringify(gas, null, "\t"), "utf8");
} catch(e) {
	console.log("Error: cannot write output \"" + args.output + "\". " + e.message);
	process.exit(1);
}

console.log("Success.");
console.log("");
