blaze2gasoline
==============

**Convert [Meteor](https://www.meteor.com) Blaze template (html and js code) to input file for [Gasoline Turbo](https://www.npmjs.com/package/gasoline-turbo).** 

**Gasoline Turbo can generate Blaze, React or Angular** template, so you can use it in conjuction with this package to convert Meteor projects from Blaze to React or Angular. Don't expect miracles, but it can save you from a lot of (boring) manual work.


Project status
==============

Under development - just started.


Usage
=====

When installed globally as npm module `npm install -g blaze2gasoline`, you can run CLI from your terminal:

```
blaze2gasoline -i input.html -o output.json
	-i, --input 	Input file
	-o, --output	Output file
	-w, --overwrite	Overwrite existing output file
```

Or you can add it to your Meteor application by running `meteor npm install --save blaze2gasoline` and in your code:

```js
const b2g = require("blaze2gasoline");

var gas = b2g.blaze2gasoline(htmlString, jsString);
```

*(works both-client side and server-side)*


Examples
========

*Please install `blaze2gasoline` and `gasoline-turbo` first*

Convert Blaze to React
----------------------

```
blaze2gasoline -i path_to_blaze_file.html -o ./gas.json
gasoline-turbo -i ./gas.json -o ./ -f react
```

Convert Blaze to Angular
------------------------

```
blaze2gasoline -i path_to_blaze_file.html -o ./gas.json
gasoline-turbo -i ./gas.json -o ./ -f angular
```

*Angular is not supported yet by gasoline-turbo, but contributions are welcome!*

---

To be continued...
