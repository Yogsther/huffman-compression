const fs = require("file-system");
var nodes = [];
var locations = {
    text: "text.txt",
    out: "out.txt",
    tree: ""
}
var text;
var compress = true;
var stream = "";
var ids = 0;

class Node {
    constructor(frequency, value) {
        this.frequency = frequency;
        this.value = value ? value : "";
        this.children = [];
        this.id = ids++;
    }

    addChildren(children) {
        children = typeof children == "Array" ? children : [children];
        for (var child of children){
            child.parent = this.id;
            this.children.push(child);
        }
    }
}

class ConnectorNode extends Node {
    constructor(frequency) {
        super(frequency);
        this.connector = true;
    }
}

var flags = {
    "c": () => compress = true,
    "d": () => compress = false,
    "s": value => locations.text = value,
    "t": value => locations.tree = value,
    "o": value => locations.out = value,
    "-help": () => {
        help();
        return true; // Stop process
    }
}


for (i = 0; i < process.argv.length; i++) {
    // Handle flags
    if (process.argv[i].indexOf("-") != -1) {
        for (flag in flags) {
            if ("-" + flag == process.argv[i]) {
                if(flags[flag](process.argv[(i + 1 < process.argv0.length) ? i + 1 : null])) return;
            }
        }
    }
}

text = fs.readFileSync("text.txt", "utf8");

if (locations.tree == "" || compress) {
    generate_tree();
}



/* Generates a huffman-tree from text */
function generate_tree() {
    // Fill out all character-nodes

    for (i = 0; i < text.length; i++) {
        var letter = text[i];
        var exists = false;
        for (node of nodes) {
            if (letter === node.value) {
                exists = true;
                node.frequency++;
            }
        }
        if (!exists) nodes.push(new Node(1, letter));
    }

    while (nodes.length > 1) {
        for (i = 0; i < nodes.length - 1; i += 2) {
            var node = new ConnectorNode(nodes[i].frequency + nodes[i + 1].frequency); // Create the new parent
                node.addChildren(JSON.parse(JSON.stringify([nodes[i], nodes[i+1]])))
                node.children[0].parent = "    A       A      A       "
            
            nodes.push(node); // Add the nodes into the list
            console.log(nodes[nodes.length-1].children);
            nodes.splice(i, 2); // Delete the two added nodes
        }
        sort(); // Maybe doesn't do anything?
    }
    save();
    console.log(JSON.stringify(nodes));
    console.log("Generated tree.");
}

function sort() {
    // Sort all nodes from lowest frequency to highest.
    nodes.sort((a, b) => {
        return a.frequency - b.frequency;
    })
}

function save() {
    fs.writeFile(locations.tree == "" ? "tree.json" : locations.tree, JSON.stringify(nodes));
}

function compress(){
    for(i = 0; i < text.length; i++){

    }
}

function help() {
    console.log(` 
    Huffman.js | Help
        Flags are optional

    Usage:
        node huffman.js [flags | --help]   
    
    Flags & options:
        -c  Compress (default)
        -d  Decompress
        -s  Location of the source text to read
        -t  Location of the tree
        -o  Output locatiton for the file
    
    Example:
        node huffman.js -s text.txt -t tree.json -o output.txt
    `)
}