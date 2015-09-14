/*******************************************************************************
 * @license
 * Copyright (c) 2010, 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
/*global JSLINT*/
define([
	"orion/plugin",
	"orion/jslintworker",
	"orion/objects"
], function(PluginProvider, _, objects) {
	var DEFAULT_VALIDATION_OPTIONS = {
			bitwise: false, eqeqeq: true, es5: true, immed: true, indent: 1, maxerr: 300, newcap: true, nomen: false,
			onevar: false, plusplus: false, regexp: true, strict: false, undef: true, white: false
	};
	var validationOptions = DEFAULT_VALIDATION_OPTIONS;

	function jslint(contents) {
		JSLINT(contents, validationOptions);
		return JSLINT.data();
	}

	function cleanup(error) {
	    var fixes = [
		  ["Expected '{'", "Statement body should be inside '{ }' braces."],
			"Missing semicolon",
			"Extra comma",
			"Missing property name",
			"Unmatched ",
			" and instead saw",
			" is not defined",
			"Unclosed string",
			"Stopping, unable to continue"
		];
		var description = error.description;
		if(description.indexOf("Dangerous comment") === -1) {
    		for (var i=0; i < fixes.length; i++) {
    			var fix = fixes[i],
    			    find = (typeof fix === "string" ? fix : fix[0]),
    			    replace = (typeof fix === "string" ? null : fix[1]);
    			if((description.indexOf(find) !== -1) && replace) {
    				error.description = replace;
    			}
    		}
    		return error;
		}
		return null;
	}

	/**
	 * @param {Object} options
	 * @param {String} contents Text of file.
	 */
	function _computeProblems(options, contents) {
		var result = jslint(contents);
		var problems = [];
		var i;
		if (result.errors) {
			var errors = result.errors;
			for (i=0; i < errors.length; i++) {
				var error = errors[i];
				if (error) {
					var start = error.character - 1,
					    end = start + 1;
					if (error.evidence) {
						var index = error.evidence.substring(start).search(/.\b/);
						if (index > -1) {
							end += index;
						}
					}
					// Convert to format expected by validation service
					error.description = error.reason;
					error.start = error.character;
					error.end = end;
					error = cleanup(error);
					if (error) { problems.push(error); }
				}
			}
		}
		if (result.functions) {
			var functions = result.functions;
			var lines;
			for (i=0; i < functions.length; i++) {
				var func = functions[i];
				var unused = func.unused;
				if (!unused || unused.length === 0) {
					continue;
				}
				if (!lines) {
					lines = contents.split(/\r?\n/);
				}
				var nameGuessed = func.name[0] === '"';
				var name = nameGuessed ? func.name.substring(1, func.name.length - 1) : func.name;
				var line = lines[func.line - 1];
				for (var j=0; j < unused.length; j++) {
					// Find "function" token in line based on where fName appears.
					// nameGuessed implies "foo:function()" or "foo = function()", and !nameGuessed implies "function foo()"
					var nameIndex = line.indexOf(name);
					var funcIndex = nameGuessed ? line.indexOf("function", nameIndex) : line.lastIndexOf("function", nameIndex);
					if (funcIndex !== -1) {
						problems.push({
							reason: "Function declares unused variable '" + unused[j] + "'.",
							line: func.line,
							character: funcIndex + 1,
							end: funcIndex + "function".length,
							severity: "warning"
						});
					}
				}
			}
		}
		return { problems: problems };
	}

	var validationService = {
		// ManagedService
		updated: function(properties) {
			if (properties) {
				if (typeof properties.options === "string") {
					var options = properties.options;
					if (!/^\s*$/.test(options)) {
						var userOptionsMap = {}, hasUserOption = false;
						options.split(/,/).forEach(function(option) {
							var match = /\s*(\w+)\s*:\s*(\w+)\s*/.exec(option); // name:value
							if (match === null) {
								console.log('JSLint ignoring bad option: ' + option);
							} else {
								var name = match[1], value = match[2];
								userOptionsMap[name] = value;
								hasUserOption = true;
							}
						});
						validationOptions = {};
						objects.mixin(validationOptions, DEFAULT_VALIDATION_OPTIONS, userOptionsMap);
						if (hasUserOption) {
							console.log('JSLint using user-provided options: {' + Object.keys(userOptionsMap).map(function(k) {
								return k + ':' + userOptionsMap[k];
							}).join(',') + "}");
						}
					}
				}
			}
		},
		// orion.edit.validator
		computeProblems: function(editorContext, context) {
			return editorContext.getText().then(_computeProblems.bind(null, context));
		}
	};

	function connect() {
		var headers = {
			name: "Orion JSLint Service",
			version: "1.0",
			description: "This plugin provides JSLint functionality for validating JSON."
		};
		var pluginProvider = new PluginProvider(headers);
		registerServiceProviders(pluginProvider);
		pluginProvider.connect();
	}

	function registerServiceProviders(provider) {
		provider.registerService(["orion.edit.validator"], validationService, {
			contentType: ["application/json"],
		});
	}

	return {
		connect: connect,
		registerServiceProviders: registerServiceProviders
	};
});