/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define(['embeddedEditor/builder/embeddedEditor'],
function(mEmbeddedEditor) {
	var defaultPluginURLs = [
		"../../javascript/plugins/javascriptPlugin_embed_dev.html",
		"../../webtools/plugins/webToolsPlugin_embed_dev.html",
		"../../plugins/embeddedToolingPlugin.html"
	];
	var contents = 'var foo = "bar";\n' +
						 "var bar = foo;\n" + 
						 "/*\n" + 
						 " * test demo\n" + 
						 "*/\n" + 
						 "function test(){\n" + 
						 "	var foo1 = bar.lastIndexOf(char, from);\n" + 
						 "}\n" + 
						"//Keep editting in this demo and try the content assit, probem validations and hover service!\n" +
						 "var foo2 = foo."; 
	var contents1 = 
						 '<div class="embeddedEditorParentOuter" id="embeddedEditor1">\n' + 
						 "</div>\n" + 
						 "<span>var foo2</span>"; 
						 
	var contents2 = '<server description="new server">\n' +
					 '</server>';
	var embeddedEditor = new mEmbeddedEditor();
	var proposals = [
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal ",
		"proposal "
	];
	var contentAssistProvider = {
		computeProposals: function(buffer, offset, context) {
			var result = [];
			for(var i = 0; i < proposals.length; i++){
				result.push({//name: "<" + proposals[i] + i + ">", 
							 //description: "<" + proposals[i] + i + ">", 
							 proposal: "<" + proposals[i] + i + ">", 
							 overwrite: true,
							 prefix: "<"});
			}
			return result;
		}
	};
	var hoverProvider = {
		computeHoverInfo: function (editorContext, context) {
			var pContent = "*This text will be italic*\n\n **This text will be bold**\n\n";
			if(typeof context.offset === "number") {
				return context.offset > 12 ? {
					title: "This is the title",
					content: pContent,
					type: "markdown"} : null;
			} else if(typeof context.proposal === "string") {
				var index = parseInt(context.proposal.substring("proposal ".length - 1), 10);
				return index > 3 ? {
					title: "This is the title",
					content: pContent,
					type: "markdown"} : {};
			}
			return null;
		}
	};
	embeddedEditor.create({parent: "embeddedEditor", _defaultPlugins: defaultPluginURLs}).then(function(editorViewer) {
		document.getElementById("progressMessageDiv").textContent = "Plugins loaded!";
		editorViewer.setContents(contents, "application/javascript");
		//editorViewer.inputManager.setAutoSaveTimeout(-1);
		editorViewer.editor.getTextView().setOptions({themeClass: "editorTheme"});
	});
	embeddedEditor.create({parent: "embeddedEditor1", _defaultPlugins: defaultPluginURLs,
						   contentType: "application/xml",
						   contents: contents2}).then(function(editorViewer){
		editorViewer.serviceRegistry.registerService("orion.edit.contentassist",
				contentAssistProvider,
	    		{	name: "xmlContentAssist",
	    			contentType: ["application/xml"]
	    		});
		editorViewer.serviceRegistry.registerService("orion.edit.hover",
			hoverProvider,
    		{	name: "xmlContentHover",
    			contentType: ["application/xml"]
    		});
	
						   		
	});
});
