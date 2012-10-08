"use strict"; 


process.on('uncaughtException', function(err) {
  console.error(JSON.stringify(err));
});



function print() { 
	var args = Array.prototype.slice.call(arguments, 0); 
	process.stdout.write(args.join(""));
}

function whitespace() {
	print("\t"); 
}

function isNonEmptyArray(obj) {
	return !!obj.length; 
}

function readTypedefs(typedefs) {
	function getNamespaceObject(namespace) {
		//foo::bar => bar
		var touple = namespace.split(/::/); 
		return touple[ touple.length - 1 ]; 
	}

	var touples = typedefs.map(function(td) {
		//typedef unsigned long GLenum -> ["GLenum", "unsigned long"]
		return [td.name, td.idlType.idlType]; 
	});

	var ret = Object.create(null); 
	touples.forEach(function(t) { 
		var from = t[0]; 
		var to   = getNamespaceObject(t[1]); 
		if(from !== to)
			ret[from] = to; 
	});

	return ret; 
};

function mapIdlTypeToTSType(typedefs, name) {
	if(typedefs[name]) {
		return mapIdlTypeToTSType(typedefs, typedefs[name]); 
	}

	switch(name) {
		case "boolean": 
		return "bool"; 

		case "unsigned long": 
		case "byte": 
		case "short": 
		case "long": 
		case "long long": 
		case "unsigned byte": 
		case "unsigned short": 
		case "unsigned int": 
		case "float": 
		return "number"; 

		case "DOMString": 
		return "string"; 

		case "FloatArray": 
		return "Float32Array"; 

		case "object":
		return "any"; 

		default: 
		return name;
	}
}

function printInterfaces(interfaces, typedefs) {
	interfaces.forEach(function (interf) {
		var hasInheritance = interf.inheritance !== ""; 

		print("interface "); 
		print(interf.name); 

		if(hasInheritance) {
			if(interf.inheritance.length !== 1) {
				throw new Error("more than one inheritance." + interf.inheritance); 
			}

			print(" extends ", interf.inheritance[0]); 
		}

		print(" {\n"); 

		printMembers(interf.members); 

		print("}\n\n"); 

		function printMembers(members) {
			function getTSType(idlType) {
				if(typeof idlType === "string") return mapIdlTypeToTSType(typedefs, idlType); 

				var name = getTSType(idlType.idlType);
				if(idlType.sequence || idlType.array) {
					return name + "[]"; 
				}
				return name; 
			}

			function printTSType(idlType) {
				print(getTSType(idlType)); 
			}

			function printMembers(members) {
				members.forEach(function (member) { 
					var type = member.idlType || member.type; 

					whitespace(); 
					print(member.name, " : "); 
					printTSType(type); 
					print(";\n"); 
				});
			}

			function printOperations(ops) {
				"use strict"; 
				ops.forEach(function(op) {
					whitespace(); 
					print(op.name, "("); 					
					print(op.arguments.map(function(arg) {
						return arg.name + 
							" : " + 
							getTSType(arg.type); 
					}).join(", "));
					print(") : "); 			
					print(getTSType(op.idlType)); 
					print(";\n"); 
				}); 
			}

			var constants  = members.filter(function(member) { return member.type === "const"; }); 
			var attributes = members.filter(function(member) { return member.type === "attribute"; }); 
			var operations = members.filter(function(member) { return member.type === "operation"; });
			var dicAttributes = members.filter(function(member) { return !!member.type.idlType; });

			printMembers(constants);    
			printMembers(attributes);
			printMembers(dicAttributes);
			printOperations(operations); 
		}
	});
}

function printModuleMember(module) { 
	if(isNonEmptyArray(module)) { 
		var typedefs = readTypedefs(module.filter(function(token) { return token.type === "typedef"; }));

		var dictionaries = module.filter(function(def) { return def.type === "dictionary"; }); 
		var interfaces   = module.filter(function(def) { return def.type === "interface"; }); 
		var submodules   = module.filter(function(def) { return def.type === "module"; }); 

		printInterfaces(dictionaries, typedefs); 
		printInterfaces(interfaces, typedefs); 
		printModuleMember(submodules);
	}	
}

(function() { 
	var WebIDLParser = require("./webidlparser.js").Parser; 
	var fs = require("fs"); 

	var idl, out, module, webGlContext, constants, finalObject, i, json, m, args, obj, isSequence;

	if(!process.argv[2]) {
		console.error("No Filename."); 
		return; 
	}

	idl = fs.readFileSync(process.argv[2]).toString();
	module = WebIDLParser.parse(idl); 

	if(module.type === "module") {
		printModuleMember(module.definitions); 
	}
	else {
		printModuleMember(module[0].definitions); 
	}
}()); 
