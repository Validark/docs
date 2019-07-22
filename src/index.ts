import { Project, JSDoc } from "ts-morph";
import path from "path";
import fs from "fs";

const OUTPUT_PATH = "C:/Users/blach/Documents/GitHub/dumpling/test-files";

const project = new Project({
	tsConfigFilePath: path.join(__dirname, "..", "include", "tsconfig.json")
});

const main = project.getSourceFileOrThrow("include/generated/None.d.ts");
const servicesInterface = main.getInterfaceOrThrow("Services");
const instancesInterface = main.getInterfaceOrThrow("Instances");
const creatableInstancesInterface = main.getInterfaceOrThrow("CreatableInstances");
const instanceInterfaces = main
	.getInterfaces()
	.filter(i => i !== servicesInterface && i !== instancesInterface && i !== creatableInstancesInterface);

const outputFolder = path.join(OUTPUT_PATH, "..");

function writeFileSync(filePath: string, data: string) {
	const pathValues = filePath.normalize().split("/");
	const fileName = pathValues.pop()!;

	let currentDirectory = outputFolder;

	for (const folderName of pathValues) {
		fs.existsSync(currentDirectory) || fs.mkdirSync(currentDirectory);
		currentDirectory = path.join(currentDirectory, folderName);
	}

	fs.existsSync(currentDirectory) || fs.mkdirSync(currentDirectory);

	fs.writeFileSync(path.join(currentDirectory, fileName), data);
}

function processInterface(instanceName: string, docs: Array<JSDoc>, target: string, typeInfo?: string) {
	let source = new Array<string>();
	let tags = new Array<string>();

	for (const doc of docs) {
		const text = doc.getText();
		const client_serverTag = text.match(/^\/\*\* @rbxts (server|client) \*\/$/);

		if (client_serverTag) tags.push(client_serverTag[1].replace(/^\w/, s => s.toUpperCase()));
		else {
			const lines = text.split("\n");

			lines.pop();
			lines.shift();

			source.push(
				lines
					.map(line => line.replace(/^\s+\* ?/, ""))
					.join("")
					.replace(/Tags: ([\w, ]+)/, (_, s: string) => {
						tags.push(...s.split(", "));
						return "";
					})
			);
		}
	}

	source.unshift("");
	source.unshift("+++");
	if (tags.length > 0) source.unshift(`Tags = "${tags.join(", ")}"`);
	if (typeInfo) source.unshift("Type = " + typeInfo);
	source.unshift(`Target = "${instanceName}${target === "index" ? "" : "." + target}"`);
	source.unshift("+++");
	writeFileSync(`content/${instanceName}/${target.replace(/^\["/, "").replace(/"]$/, "")}.md`, source.join("\n"));
}

for (const instanceInterface of instanceInterfaces) {
	const instanceName = instanceInterface.getName();
	console.log(instanceName);

	processInterface(instanceName, instanceInterface.getJsDocs(), "index");

	for (const property of instanceInterface.getProperties().filter(property => property.getName() !== "ClassName")) {
		processInterface(instanceName, property.getJsDocs(), property.getName(), property.getType().getText());
	}

	for (const method of instanceInterface.getMethods()) {
		processInterface(instanceName, method.getJsDocs(), method.getName(), method.getType().getText());
	}
}
