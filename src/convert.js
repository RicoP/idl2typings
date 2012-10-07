"use strict"; 

var useDefine = false; 

var WebIDLParser = require("./webidlparser.js").Parser; 
var fs = require("fs"); 

var idl, out, module, webGlContext, constants, finalObject, i, json, m, args, obj, isSequence;

process.argv.forEach(function (val, index, array) {
	if(val === "-d") {
		useDefine = true; 
	}
}); 

idl = fs.readFileSync("webgl.idl").toString();
module = WebIDLParser.parse(idl)[0]; 

var defs = module.definitions; 

var interfaces = defs.filter(function(def) { return def.type === "interface"; }); 

function print() { 
	var args = Array.prototype.slice.call(arguments, 0); 
	process.stdout.write(args.join(""));
}

printInterfaces( interfaces ); 

function printInterfaces(interfaces) {
	for(var i = 0; i !== interfaces.length; i++) {
		var interf = interfaces[i]; 
		printInterface(interf); 
	}

	function printInterface(interf) {
		var hasInheritance = interf.inheritance !== ""; 

		print("interface "); 
		print(interf.name); 

		if(hasInheritance) {
			if(interf.inheritance.length !== 1) {
				throw new Error("more than one inheritance." + interf.inheritance); 
			}

			print(" extends ", interf.inheritance[0]); 
		}

		print("{\n"); 

		printMembers(interf.members); 

		print("}\n\n"); 

		function printMembers(members) {
			printAttributes(members.filter(function(member) { return member.type === "attribute"; })); 
			printConstants(members.filter(function(member) { return member.type === "const"; })); 


			function toJSType(idlType) {
				function getName(name) { 
					switch(name) {
						case "bool": case "boolean": case "GLboolean": 
						return "bool"; 

						case "GLenum": case "GLbitfield": case "GLbyte": case "GLshort": 
						case "GLint":  case "GLsize": case "GLintptr": case "GLsizeptr": 
						case "GLubyte": case "GLushort": case "GLuint": case "GLfloat": 
						case "GLclampf": case "unsigned long": case "byte": case "short":  
						case "long": case "unsigned byte": case "unsigned short": case "unsigned int": 
						return "number"; 

						case "DOMString": 
						return "string"; 

						case "FloatArray": 
						return "Float32Array"; 

						default: 
						return name;
					}
				}

				print(getName(idlType.idlType)); 
				if(idlType.sequence || idlType.array) {
					print("[]"); 
				}
			}

			function printAttributes(members) {
				members.forEach(function (member) { 
					var type = member.idlType; 

					print("  "); 
					print(member.name, " : "); 
					toJSType(type); 
					print(";\n"); 

				});
			}
			
			function printConstants(members) {
				members.forEach(function (member) { 
					var type = member.idlType; 

					print("  "); 
					print(member.name, " : "); 
					toJSType(type); 
					print(";\n"); 

				});
			}
		}
	}
}
