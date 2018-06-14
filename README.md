# Kai's Operating System

This is my Operating Systems project written in TypeScript and HTML5.
See http://www.labouseur.com/courses/os/ for details.


Running
================
Load index.html in Chrome or Firefox.
Need help? Type help into the CLI.


Setup TypeScript
================

1. Install the [npm](https://www.npmjs.org/) package manager if you don't already have it.
1. Run `npm install -g typescript` to get the TypeScript Compiler. (You may need to do this as root.)


Setup Gulp
==========

1. `npm install gulp` to get the Gulp Task Runner.
1. `npm install gulp-tsc` to get the Gulp TypeScript plugin.


Run `gulp` at the command line in the root directory of this project.

Gulp will automatically:

* Watch for changes in your source/scripts/ directory for changes to .ts files and run the TypeScript Compiler on them.
* Watch for changes to your source/styles/ directory for changes to .css files and copy them to the distrib/ folder if you have them there.

