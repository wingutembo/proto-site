/*******************************************************************************
 * @license
 * Copyright (c) 2013, 2015 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env amd*/
define([
], function() {

	var Signatures = {
	
		/**
		 * @name computeSignature
		 * @description Computes a signature object from the given AST node. The object holds two properties:
		 * <code>sig</code> - the human readable signature and <code>range</code> 
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to parse and compute the signature from
		 * @returns {Object} The computed signature object or <code>null</code> if the computation fails
		 */
		computeSignature: function(astnode) {
			if(astnode) {
				if(astnode.sig) {
					return astnode.sig;
				}
				var val = this.getNameFrom(astnode);
				return {
					sig: val.name,
					details: val.details,
					range: this.getSignatureSourceRangeFrom(astnode)
				};
			}
			return null;
		},
		
		/**
		 * @name getParamsFrom
		 * @description Retrieves the parameters from the given AST node iff it a function declaration. If there is an attached doc node
		 * it will be consulted to help compute the types of the parameters
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the parameters from
		 * @returns {Array} An array of parameter names suitable for display, in the order they are defined in source. If no parameters
		 * can be computed an empty array is returned, never <code>null</code>
		 */
		getParamsFrom: function(astnode) {
			if(astnode) {
				var params = astnode.params;
				//TODO with the attached doc node we can augment this infos
				if(params && params.length > 0) {
					var length = params.length;
					var value = '';
					for(var i = 0; i < length; i++) {
						if(params[i].name) {
							value += params[i].name;
						}
						else {
							value += 'Object';  //$NON-NLS-0$
						}
						if(i < length -1) {
							value += ', ';  //$NON-NLS-0$
						}
					}
					return value;
				} 
			}
		},
		
		/**
		 * @name getPropertyListFrom
		 * @description Retrieves the properties from the given AST node iff it is a object declaration.
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the parameters from
		 * @param {Integer} maxLength maximum length of string to return,  defaults to 50
		 * @returns {String} A list of named properties, comma separated in source defined order, surrounded by {}. 
		 * 			Ellipsis will be added if no properties are available or max length reached.
		 */
		getPropertyListFrom: function(astnode, maxLength) {
			if (!maxLength){
				maxLength = 50;
			}
			if (maxLength < 0){
				maxLength = 0;
			}
			if(astnode) {
				var props = astnode.properties;
				if(props && props.length > 0) {
					var length = props.length;
					var name;
					var value = '{';  //$NON-NLS-0$
					for(var i = 0; i < length; i++) {
						if(props[i].key && props[i].key.name) {
							name = props[i].key.name;
						} else {
							name = 'Object';  //$NON-NLS-0$
						}
						
						if ((value.length + name.length) > (maxLength+1)){
							value += '...';   //$NON-NLS-0$
							break;
						} else {
							value += name;
							if(i < length -1) {
								value += ', ';  //$NON-NLS-0$
							}
						}
					}
					value += '}';  //$NON-NLS-0$
					return value;
				}
			}
			return '{...}';  //$NON-NLS-0$
		},
		
		/**
		 * @name getNameFrom
		 * @description Returns an object describing what to display for the given AST node. If there is an attached doc node it
		 * will be consulted to help compute the name to display
		 * @function
		 * @public
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the name from
		 * @returns {String} An object containing 'name', the computed name to display for the node or <code>null</code> if one could not be 
		 * 					computed and possibly 'details' if optional display information is computed
		 */
		getNameFrom: function(astnode) {
			var name = "Anonyous " + astnode.type;  //$NON-NLS-0$
			var details;
			if(astnode && astnode.type) {
				if(astnode.type === 'FunctionDeclaration') {  //$NON-NLS-0$
					//TODO with the attached doc node we can augment this infos
					if(astnode.id && astnode.id.name) {
						name = astnode.id.name+'(';  //$NON-NLS-0$
						var fparams = this.getParamsFrom(astnode);
						if(fparams) {
							name += fparams;
						}
						name += ')';  //$NON-NLS-0$
					}
				}
				else if(astnode.type === 'FunctionExpression') {  //$NON-NLS-0$
					name = 'function(';  //$NON-NLS-0$
					var feparams = this.getParamsFrom(astnode);
					if(feparams) {
						name += feparams;
					}
					name += ')';  //$NON-NLS-0$
				}
				else if(astnode.type === 'ObjectExpression') {  //$NON-NLS-0$
					name = 'closure ';  //$NON-NLS-0$
					details = this.getPropertyListFrom(astnode);
				}
				else if(astnode.type === 'Property') {  //$NON-NLS-0$
					if(astnode.value) {
						if(astnode.value.type === 'FunctionExpression') {  //$NON-NLS-0$
							if(astnode.key) {
								if(astnode.key.name) {
									name = astnode.key.name + '(';  //$NON-NLS-0$
								}
								else if(astnode.key.value) {
									name = astnode.key.value + '(';  //$NON-NLS-0$
								}
							}
							else {
								name = 'function(';  //$NON-NLS-0$
							}
							var pparams = this.getParamsFrom(astnode.value);
							if(pparams) {
								name += pparams;
							}
							name += ')';  //$NON-NLS-0$
						}
						else if(astnode.value.type === 'ObjectExpression') {  //$NON-NLS-0$
							if(astnode.key) {
								if(astnode.key.name) {
									name = astnode.key.name + ' ';  //$NON-NLS-0$
								}
								else if(astnode.key.value) {
									name = astnode.key.value + ' ';  //$NON-NLS-0$
								}
								details = this.getPropertyListFrom(astnode.value);
							}
						}
						else if(astnode.key) {
							if(astnode.key.name) {
								name = astnode.key.name;
							}
							else if(astnode.key.value) {
								name = astnode.key.value;
							}
						}
					}
				}
				else if(astnode.type === 'VariableDeclarator') {  //$NON-NLS-0$
					if(astnode.init) {
						if(astnode.init.type === 'ObjectExpression') {  //$NON-NLS-0$
							if(astnode.id && astnode.id.name) {
								name = 'var '+astnode.id.name+ ' = ';  //$NON-NLS-0$  //$NON-NLS-1$
								details = this.getPropertyListFrom(astnode.init);
							}
						}
						else if(astnode.init.type === 'FunctionExpression') {  //$NON-NLS-0$
							if(astnode.id && astnode.id.name) {
								name = astnode.id.name + '(';  //$NON-NLS-0$
								var vparams = this.getParamsFrom(astnode.init);
								if(vparams) {
									name += vparams;
								}
								name += ')';  //$NON-NLS-0$
							}
							else {
								name = this.getNameFrom(astnode.init);
							}
						}
					}
				}
				else if(astnode.type === 'AssignmentExpression') {  //$NON-NLS-0$
					if(astnode.left && astnode.right) {
						var isobject = astnode.right.type === 'ObjectExpression';  //$NON-NLS-0$
						if(isobject || astnode.right.type === 'FunctionExpression') {  //$NON-NLS-0$
							if(astnode.left.name) {
								name = astnode.left.name;
							}
							else if(astnode.left.type === 'MemberExpression') {  //$NON-NLS-0$
								name = this.expandMemberExpression(astnode.left, '');
							}
							if(name) {
								//append the right stuff
								if(isobject) {
									name += ' ';  //$NON-NLS-0$
									details = this.getPropertyListFrom(astnode.right); 
								}
								else {
									name += '(';  //$NON-NLS-0$
									var aparams = this.getParamsFrom(astnode.right);
									if(aparams) {
										name += aparams;
									}
									name += ')';  //$NON-NLS-0$
								}
							}
							else {
								name = this.getNameFrom(astnode.right);
							}
						}
					}
				}
				else if(astnode.type === 'ReturnStatement') {  //$NON-NLS-0$
					if(astnode.argument) {
						if(astnode.argument.type === 'ObjectExpression' ||  //$NON-NLS-0$
							astnode.argument.type === 'FunctionExpression') {  //$NON-NLS-0$
								name = 'return ';  //$NON-NLS-0$
								details = this.getPropertyListFrom(astnode.argument);
						}
					}
				}
			}
			return {name: name, details: details};
		},
		
		/**
		 * @name expandMemberExpression
		 * @description Given a MemberExpression node this function will recursively compute the complete name from the node
		 * by visiting all of the child MemberExpressions, if any
		 * @function
		 * @private
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The MemberExpression AST node
		 * @returns {String} The name to use for the node
		 */
		expandMemberExpression: function(astnode, name) {
			if(astnode.type === 'MemberExpression') {  //$NON-NLS-0$
				if(astnode.property) {
				    var propname = astnode.property.name;
				    if(astnode.property.type === 'Literal') {
				        propname = astnode.property.value;
				    }
				    if(propname) {
    					if(name && name.length > 0) {
    						name = propname+'.' + name;  //$NON-NLS-0$
    					}
    					else {
    						name = propname;
    					}
					}
				}
				if(astnode.object && astnode.object.name) {
					name = astnode.object.name +'.'+ name;  //$NON-NLS-0$
				}
				//TODO recursion
				return this.expandMemberExpression(astnode.object, name);
			}
			return name;
		},
		
		/**
		 * @name getSignatureSourceRangeFrom
		 * @description Computes the signature source range (start, end) for the given node 
		 * @function
		 * @ppublic
		 * @memberof javascript.Signatures.prototype
		 * @param {Object} astnode The AST node to compute the range from
		 * @returns {Array} The computed signature source range as an array [start, end] or <code>[-1, -1]</code> if it could not
		 * be computed
		 */
		getSignatureSourceRangeFrom: function(astnode) {
			var range = [0, 0];
			if(astnode) {
				if(astnode.type === 'AssignmentExpression') {  //$NON-NLS-0$
					if(astnode.left && astnode.left.range) {
						range = astnode.left.range;
					}
				}
				else if(astnode.type === 'Property') {  //$NON-NLS-0$
					if(astnode.key && astnode.key.range) {
						range = astnode.key.range;
					}
				}
				else if(astnode.type === 'ReturnStatement') {  //$NON-NLS-0$
					range[0] = astnode.range[0];
					range[1] = range[0] + 6;
				}
				else if(astnode.id && astnode.id.range) {
					range = astnode.id.range;
				}
				else if(astnode.range) {
					range = astnode.range;
					if(astnode.type === 'FunctionExpression') {  //$NON-NLS-0$
						range[1] = range[0]+8;
					}
				}
				if(range[0] < 1) {
					//TODO hack since passing in a range starting with 0 causes no selection to be made
					range[0] = 1;
				}
			}
			return range;
		}
		
	};
	
	return Signatures;
});
