const fs = require("file-system");
const START_TIME = Date.now();
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

if(compress){
    compressText();
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
                node.addChildren([nodes[i], nodes[i+1]]);
            
            nodes.push(JSON.parse(JSON.stringify(node))); // Add the nodes into the list
            nodes.splice(i, 2); // Delete the two added nodes
        }
        sort(); // Maybe doesn't do anything?
    }

    // Assign parents
    //exploreChildren(nodes[0]);

    save();
    console.log("Generated tree in " + (Date.now()-START_TIME) + "ms");
}

function getNodeFromValue(value){
    exploreChildren(nodes[0]);
    var found;
    function exploreChildren(parent){
        for(var child of parent.children){
            if(child.value == value) found = child;
            else if(child.children){
                exploreChildren(child);
            }
        }
    }
    return found;
}

function getNodeFromID(id){
    if(nodes[0].id == id) return nodes[0];
    exploreChildren(nodes[0]);
    var found;
    function exploreChildren(parent){
        for(var child of parent.children){
            if(child.id == id) found = child;
            else if(child.children){
                exploreChildren(child);
            }
        }
    }
    return found;
}

function getPathOut(value){
    var path = "";
    var node = getNodeFromValue(value);
    var pastID = node.id;
    var out = false;
    while(!out){
        if(node.parent){
            pastID = node.id;
            node = getNodeFromID(node.parent);
            console.log(node)
            path += (node.children[0].id == pastID) ? "1" : "0";
        } else {
            out = true;
        }
    }
    return path;
}

function sort() {
    // Sort all nodes from lowest frequency to highest.
    nodes.sort((a, b) => {
        return a.frequency - b.frequency;
    })
}

function save() {
    fs.writeFileSync(locations.tree == "" ? "tree.json" : locations.tree, JSON.stringify(nodes));
}

function compressText(){
    for(i = 0; i < text.length; i++){
        stream += getPathOut(text[i]);
    }
    fs.writeFileSync("compressed_" + locations.out, stream);
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