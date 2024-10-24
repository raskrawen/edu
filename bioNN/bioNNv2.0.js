/*
date: april 2022
by: Rasmus Kragh Wendelbo
using: p5 library by p5js.org
license: CC-BY-NC 4.0
topic: Simulation of neurons network
version: 2.0
features: 
- GAME mode
- clickcounter
- inhibitory neurons fire more often
- infobox text

*/

let cvs;
let neurons = [];
let dyingNeurons = [];
let neuronSize = 1;
let numberOfNeurons = 40; //avr=50
let actualNumberOfNeurons;
let sliderSensitivity = 29;
let sensitivityRatio = 5; //increase for more activity (sensitive nerons etc.)
let development = false;
let writeNumbers = false;
let checkbox; let devCheckbox;
let noise = 1; // factor around 1
let branching = 5; // 6decrease for more neurons with 2 or 3 axons.
let stimulatingRatio = 5; // 1:num is inhib:stimulating neurons
let speed = 10;
let thresholdAvr = 29;
let mic;
let ear = false;
let paused = false;
let pixelSum;
let capture;
let sel;
let difficultyLevel = 1;
let noOptions = ['level 1', 'level 2', 'level 3', 'level 4'];
let clickX; let clickY;
let clickCounter = 0;
let lineDist;
let infoBox;
let message = "<h1>Byg et neuralt netværk.</h1><h3>Mål: Aktiver den grønne neuron i øverste højre hjørne.<br><br> Tilføje nye neuroner ved klik med musen.<br>De nye neuroner skal sende nervesignal fra den gullige sansecellen i nederste venstre hjørne til den grønne målcelle.<br><br>Tilføj så få nye neuroner som muligt.<br><br>Aktivér sansecellen i nederste venstre hjørne med museklik.<br><br>Undgå de lyserøde hæmmende neuroner.<br>";
let targetID;
let txt3;
let debugging = false;

/*debugging mode: inhibitory neurons: small. Normal: green. Senseing: purple */


function setup() {
    cvs = createCanvas(windowWidth, windowHeight - 50);
    cvs.show;
    cvs.mouseClicked(mouseReleasedInCanvas);
    console.log("Startet");
    drawGUI();
    angleMode(DEGREES);
    initializeNeurons();
    initializeInfoBox();
    if (debugging) { writeNumbers = true; }
}

function drawGUI() {
    let distInGUI = 100;
    Numberscheckbox = createCheckbox('Numre', writeNumbers);
    Numberscheckbox.position(distInGUI * 0 + 5, height + 5);
    Numberscheckbox.changed(turnNumbersOn);
    devCheckbox = createCheckbox('Simulator', false);
    devCheckbox.position(distInGUI * 0 + 5, height + 20);
    devCheckbox.changed(backToSim);
    //  s
    pausedCheckbox = createCheckbox('Pause', false);
    pausedCheckbox.position(distInGUI * 1 + 20, height + 20);
    pausedCheckbox.changed(turnPausedOn); //once mouse released
    // speed:
    sliderSpeed = createSlider(1, 30, 10, 1); //min, max, start, step
    sliderSpeed.position(distInGUI * 2, height + 5);
    sliderSpeed.style('width', '80px');
    let txt2 = createDiv('Hastighed');
    txt2.style('font-size', '16px')
    txt2.position(distInGUI * 2, height + 25);
    // button:
    resetButton = createButton('RePlay');
    resetButton.position(distInGUI * 3, height + 5);
    resetButton.mouseClicked(rePlay);
    // number of neurons:
    sel = createSelect();
    sel.position(distInGUI * 4, height + 5);
    sel.option(noOptions[0]); sel.option(noOptions[1]); sel.option(noOptions[2]); sel.option(noOptions[3]);
    sel.changed(selectLevel);
    // clickcountertext:
    txt3 = createDiv('Click-tæller: ' + clickCounter);
    txt3.style('font-size', '16px')
    txt3.position(distInGUI * 5, height + 5);
    // infoBox: 
    let txt = createDiv('Mus her for info');
    txt.style('font-size', '16px')
    txt.position(width - 200, height + 10);
}

function initializeNeurons() {
    neurons = [];
    neuronSize = 1;
    //draw first neuron:
    neurons.push(new NeuronType(49, height - 50, true));
    console.log(neurons[0]);
    neurons[0].sensoryNeuron = true;
    neurons[0].connectedTo[0] = 1;
    neurons[0].col = color(150 + random(0, 55), 120 + random(0, 50), random(0, 50));
    // second and thrid: 
    neurons.push(new NeuronType(151, height - 100, true));
    neurons[1].connectedTo[0] = 2;
    neurons[1].sensoryNeuron = false;
    neurons.push(new NeuronType(51, height - 150, true));
    neurons[2].connectedTo[0] = 0;
    neurons[2].sensoryNeuron = false;

    //inhib neurons:
    let k = 0;
    console.log(difficultyLevel);
    let noOfInhibNeurons = difficultyLevel * 2 + 4;
    for (j = 3; j < noOfInhibNeurons; j++) {
        neurons.push(new NeuronType(width - random(300, 800), height - random(200, 500), false));
        neurons[j].col = color(200 + random(0, 50), 20 + random(50, 100), 140 + random(50, 100));
        neurons[j].connectedTo[0] = j + 1;
        neurons[j].sensoryNeuron = true;
        k = j;
        //console.log(j);
    }
    neurons[k].connectedTo[0] = 3;

    // set target:
    targetID = neurons.length;
    neurons.push(new NeuronType(width - 100, 100, true));
    neurons[targetID].col = color(29, 133, 40);
    neurons[targetID].neuronSize = 2;

    //when all neurons have been drawn:
    assignNeuronIDs();
    for (let i = 0; i < neurons.length; i++) {
        neurons[i].drawOneNeuron();
        turnToNeighborS();
        adjustAxonLength();
        //neurons[i].

    }
    //neurons.push(new NeuronType(300,60,True));

    actualNumberOfNeurons = neurons.length;
    console.log("INITIAL Actu no of Neurons: " + actualNumberOfNeurons + ". Neurons array length: " + neurons.length);
}

function initializeInfoBox() {
    infoBox = createDiv(message);
    infoBox.style("width: 600px;");
    infoBox.style("height: 350px;");
    infoBox.style("padding: 10px;");
    //infoBox.style("f");
    infoBox.style("background-color: white");
    infoBox.style("z-index: -100");
    infoBox.position(200, 50);
    console.log("ini infobox");

}



function showNeurons() {
    background(200);
    for (let n of neurons) {
        // draw axon:
        n.drawOneNeuron();
    }
}

function checkOnEdge(n) {
    let EdgeLimit = n;
    for (let i = 0; i < neurons.length; i++) {
        if (neurons[i].x > width - EdgeLimit || neurons[i].x < EdgeLimit || neurons[i].y > height - EdgeLimit || neurons[i].y < EdgeLimit) {
            neurons.splice(i, 1); // removes neuron on edge
            actualNumberOfNeurons -= 1;
            checkOnEdge(n); //avoid collision with loop(?)
        }
    }
    console.log("Removing neurons on edges. #neurons: " + neurons.length);
}

function checkOverlap(n) {
    let minimumDistance = n
    for (let i = 0; i < neurons.length; i++) {
        for (let j = 0; j < neurons.length; j++) {
            // two overlapping somas, mini:
            if (i !== j && dist(neurons[i].x, neurons[i].y, neurons[j].x, neurons[j].y) < minimumDistance) {
                // move neuron to dying neurons: 
                if (development) {
                    console.log("moving neuron to dying");
                    dyingNeurons.push(new DyingNeuron(neurons[j].x, neurons[j].y));
                }
                // remove neuron from active duty:
                neurons.splice(j, 1);
                actualNumberOfNeurons -= 1;
                console.log("removed overlapping neuron.");
                checkOverlap(n);
            }
        }
    }
    console.log("Fjerner overlappende neuroner.");
}

function findNeigbour(n, m) {
    //let branchingNum = m;
    let searchDistance = n; // value 1..10, 1: find primary neighbor, 10: find distant neighbor
    console.log("Finder naboer..");
    let newNeighbor;
    let d_shortest = width;
    let d_new = width;
    //every neuron:
    for (let i = 0; i < neurons.length; i++) {
        // find number of axons for each neuron:
        //ex: b=10% => 10% for 2-3 axons (5% for 3 axons), else (90%) 1 axon.
        let rand = random(0, 100) + 1;
        if (rand < branching) {
            noOfAxons = 2;
            if (rand < branching * 0.5) {
                noOfAxons = 3;
            }
        } else {
            noOfAxons = 1;
        }
        // every axon:
        for (let k = 0; k < noOfAxons; k++) {
            neurons[i].connectedTo[k] = -1; // temp. value
            // find neighbors. j is every other neuron:
            for (let j = 0; j < neurons.length; j += searchDistance + k) {
                // don't find distance to self:
                if (i != j) {
                    d_new = dist(neurons[i].x, neurons[i].y, neurons[j].x, neurons[j].y);
                    // new short distance and avoid crosslinking:
                    if (d_new < d_shortest && neurons[j].connectedTo[0] != i) {
                        //console.log(d_new);
                        d_shortest = d_new;
                        newNeighbor = j;
                    }
                }
            }
            neurons[i].connectedTo[k] = newNeighbor;
            //console.log("Jeg er: " + i + ", forb til: " + neurons[i].connectedTo[k]);
            // reset distance for next comparison:
            d_shortest = width;
            d_new = width;
        }
    }
}

function turnToNeighborS() {
    console.log("Adjust axons direction and length..");
    // every neuron:
    for (let i = 0; i < neurons.length; i++) {
        // every neighbor:
        for (let j = 0; j < neurons[i].connectedTo.length; j++) {
            let no1connectedTo = neurons[i].connectedTo[j];
            let neighborX = neurons[no1connectedTo].x;
            let neighborY = neurons[no1connectedTo].y;
            let angleBetween;
            let fraction = (neurons[i].y - neighborY) / (neurons[i].x - neighborX);
            angleBetween = atan(fraction);
            // neighbor is behind neuron:
            if (neighborX < neurons[i].x) {
                angleBetween = angleBetween + 180
            }
            neurons[i].axonAngle[j] = angleBetween;
            //console.log("Jeg er: " + i + ", forb til: " + neurons[i].connectedTo[j] + " med vinkel: " + int(neurons[i].axonAngle[j]));
        }
    }
}

function adjustAxonLength() {
    //every neuron:
    for (let i = 0; i < neurons.length; i++) {
        // every neigbor:
        for (let j = 0; j < neurons[i].connectedTo.length; j++) {
            let no1connectedTo = neurons[i].connectedTo[j];
            let neighborX = neurons[no1connectedTo].x;
            let neighborY = neurons[no1connectedTo].y;
            neurons[i].axonLen[j] = dist(neurons[i].x, neurons[i].y, neighborX, neighborY);
            stroke('grey');
            strokeWeight(10 * neuronSize);
            neurons[i].axonLen[j] = dist(neurons[i].x, neurons[i].y, neighborX, neighborY) - neurons[no1connectedTo].soma / 1.5;
        }
    }
}

function assignNeuronIDs() {
    for (let i = 0; i < neurons.length; i++) {
        neurons[i].neuronID = i;
    }
}

function initializeOneNewNeuron() {
    // click between cells => new cell with two axons to neighbors:
    console.log("tegner ny celle");
    neurons.push(new Neuron(clickX, clickY));
    actualNumberOfNeurons += 1;
    neurons[neurons.length - 1].neuronID = neurons.length - 1;
    console.log("ny celle er oprettet.");
    // establish and draw new connection:
    neurons[neurons.length - 1].findTwoClosestNeighbors();
    neurons[neurons.length - 1].adjustOneAxonLength();
    neurons[neurons.length - 1].turnToOneNeighbor();
    neurons[neurons.length - 1].drawOneNeuron();
}



// interactivity-------------------------------------------------------
function mouseReleasedInCanvas() {
    let onNeuron;
    console.log("mouse released");
    clickX = mouseX;
    clickY = mouseY;
    //console.log(clickX);
    for (let n of neurons) {
        let d = dist(clickX, clickY, n.x, n.y);
        if (d < n.soma) {
            console.log("klik på celle!");
            onNeuron = true;
            if (n.sensoryNeuron) {
                n.pot = n.threshold + 10; //may increase pot to over threshold
            }
        }
    }
    if (!onNeuron) { //make new neuron
        //console.log("new cell");
        clickCounter += 1;
        initializeOneNewNeuron();
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.onNeuron = false; //true if on a neuron
        this.ID;
    }
}

function backToSim() {
    window.location.href = 'https://raskrawen.github.io/edu/bioNN/index.html';
}

function startGame() {
    difficultyLevel = 1;
    initializeNeurons();
}

function selectLevel() {
    let splitString = split(sel.value(), ' ');
    difficultyLevel = int(splitString[1]);
    initializeNeurons();
}

function turnNumbersOn() {
    if (Numberscheckbox.checked()) { writeNumbers = true; }
    else { writeNumbers = false; }
}

function turnPausedOn() {
    if (pausedCheckbox.checked()) {
        noLoop();
    }
    else { paused = false; loop(); }
}

function rePlay() {
    loop();
    sel.selected(noOptions[difficultyLevel]);
    paused = false; //numberOfNeurons = 40;
    removeElements(); //not the canvas?
    neurons = [];
    loop();
    setup();
}


// running tasks ----------------------------------------------------------
function draw() {
    background(200);
    //console.log("Actu no of Neurons: " + actualNumberOfNeurons + ". Neurons array length: " + neurons.length);
    if (mouseX > width - 200 && mouseY > height) {
        infoBox.style("z-index: 100");
    } else {
        infoBox.style("z-index: -100");
    }
    frameRate(sliderSpeed.value());
    for (let n of neurons) {
        //n.growNewAxon();
        n.drawOneNeuron();
        n.updateMembranePot();
        n.updateThreshold();
        n.drawThreshold();
        n.drawMembranePotential();
        let level = 1000;
        n.fireSensoryNeurons(level); //higher = more likely to fire
        if (writeNumbers) {
            n.writeMembraneData();
            n.writeNeuronID();
            n.writeNeuronType();
            //n.writeActivations();
        }
    }
    writeGameTags();
    updateClickCounter();
    //winning the game: 
    if (neurons[targetID].pot > neurons[targetID].threshold) {
        neurons[targetID].writeWinner();
    }
    if (debugging) {
        neurons[targetID].writeWinner();
    }
}

// --------------------end of DRAW------------

function updateClickCounter() {
    txt3.remove();
    txt3 = createDiv('Click-tæller: ' + clickCounter);
    txt3.style('font-size', '16px')
    txt3.position(100 * 5, height + 5);
}

function writeGameTags() {
    fill('black');
    textSize(12);
    textAlign(CENTER);
    // start: 
    text('Start', neurons[0].x, neurons[0].y + neurons[0].soma / 1.3);
    // goal: 
    text('Mål', neurons[targetID].x, neurons[targetID].y + neurons[targetID].soma / 1.3);
}

function scaleMP(pot) {
    // MP = 1.33*pot -90
    return (1.33 * pot - 90)
}

// Neuron------------------------------------------------------------------
class Neuron {
    constructor(x, y) {
        this.neuronID;
        this.x = x;
        this.y = y;
        this.axonLen = [];
        this.activations = 0;
        this.soma = (40 + random(0, 20)) * neuronSize;
        this.preSynLen = 15 * neuronSize;
        this.pot = 10; //initial membranepotential
        this.threshold = 30 + noise * random(-3, 3); //pot must exteed to fire AP
        this.axonAngle = [] // noise * random(0, 360); //0..360
        this.connectedTo = []; //should be an array
        // Stimulating or inhibiting neuron. false = inhibitory
        this.stimulating = true;
        this.sensoryNeuron = false;
        this.col = color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
    }

    growNewAxon() {
        //console.log("in growing method");
        //console.log(this.activations);
        // max 4 axons:
        if (this.activations > 50 && this.connectedTo.length < 4) {
            console.log("new axon growing");
            let newNeighbor;
            let d_shortest = width;
            let d_new = width;
            //Find NEXT neighbor: check every other neuron
            for (let i = 0; i < neurons.length; i++) {
                // only proceed if not dist to self (1->1):
                //console.log("1 " + i);
                if (i != this.neuronID) {
                    //console.log("2");
                    // only proceed if not already a 1->2 connection:
                    for (let k = 0; k < this.connectedTo.length; k++) {
                        //console.log("3. i= " + i + ", k= " + k + ", this.connectedTo[k]= " + this.connectedTo[k]);
                        // must not already be connected 1->2:
                        if (this.connectedTo[k] != i) {
                            //console.log("4");
                            //only proceed if no crosslinks (2->1):
                            let no2to1connection = true;
                            for (let j = 0; j < neurons[i].connectedTo.length; j++) {
                                // only proceed if NO 2-1 connections:
                                if (neurons[i].connectedTo[j] == this.neuronID) {
                                    no2to1connection = false;
                                }
                            }
                            //console.log(no2to1connection);
                            if (no2to1connection) {
                                //calc distance:    
                                d_new = dist(this.x, this.y, neurons[i].x, neurons[i].y);
                                // find new shortest distance:
                                if (d_new < d_shortest) {
                                    d_shortest = d_new;
                                    newNeighbor = i;
                                    //console.log(newNeighbor);
                                }
                            }
                        }
                    }
                }
            }
            //reset distances: 
            d_shortest = width;
            d_new = width;
            console.log("axon growing from " + this.neuronID + " to " + newNeighbor);
            this.connectedTo.push(newNeighbor);
            this.adjustOneAxonLength();
            this.turnToOneNeighbor();
            // reset activationCounter: 
            this.activations = 0;
        }

    }


    findTwoClosestNeighbors() {
        console.log("Finder to nærmeste naboer..");
        let newNeighbor = 0;
        let newNeighbor2 = 0;
        let d_shortest = width;
        let d_new = width;
        //every neuron:
        let noOfAxons = 1;
        for (let k = 0; k < noOfAxons; k++) {
            //this.connectedTo[k] = -1; // temp. value
            // find PRIMARY neighbor. j is every other neuron:
            for (let j = 0; j < neurons.length - 1; j++) {
                d_new = dist(this.x, this.y, neurons[j].x, neurons[j].y);
                // new shortest distance:
                if (d_new < d_shortest) {
                    d_shortest = d_new;
                    newNeighbor = j;
                    //console.log("nabo1: "+newNeighbor);
                }
            }
            //reset distances: 
            d_shortest = width;
            d_new = width;
            // Find SECONDARY neighbor:
            for (let j = 0; j < neurons.length - 1; j++) {
                d_new = dist(this.x, this.y, neurons[j].x, neurons[j].y);
                // new short distance and PRIM neighbor:
                if (d_new < d_shortest && j != newNeighbor) {
                    d_shortest = d_new;
                    newNeighbor2 = j;
                    //console.log("nabo2: "+newNeighbor);
                }
            }
            this.connectedTo[0] = newNeighbor; //from new neuron to neighbor
            neurons[newNeighbor2].connectedTo.push(this.neuronID); //from second neighbor to new neuron
            neurons[newNeighbor2].adjustOneAxonLength();
            neurons[newNeighbor2].turnToOneNeighbor();
            console.log("Jeg er no: " + this.neuronID + ". Nabo nr. " + k + " er " + this.connectedTo[k] + " med dist: " + int(d_shortest));
            console.log("Jeg er no: " + neurons[newNeighbor2].neuronID + ". Ny nabo er no " + neurons[newNeighbor2].connectedTo[neurons[newNeighbor2].connectedTo.length - 1]);
            // reset distance for next comparison:
            d_shortest = width;
            d_new = width;
        }
    }

    adjustOneAxonLength() {
        //console.log("in adjust One Axon lenght..");
        // for every connection:
        for (let j = 0; j < this.connectedTo.length; j++) {
            let no1connectedTo = this.connectedTo[j];
            let neighborX = neurons[no1connectedTo].x;
            let neighborY = neurons[no1connectedTo].y;
            //this.axonLen[j] = dist(this.x, this.y, neighborX, neighborY);
            stroke('grey');
            strokeWeight(10 * neuronSize);
            this.axonLen[j] = dist(this.x, this.y, neighborX, neighborY) - neurons[no1connectedTo].soma / 1.5;

        }
    }

    turnToOneNeighbor() {
        //console.log("Adjust axons for ONE neuron; direction and length..");
        // every neighbor:
        for (let j = 0; j < this.connectedTo.length; j++) {
            let no1connectedTo = this.connectedTo[j];
            let neighborX = neurons[no1connectedTo].x;
            let neighborY = neurons[no1connectedTo].y;
            let angleBetween;
            let fraction = (this.y - neighborY) / (this.x - neighborX);
            angleBetween = atan(fraction);
            // neighbor is behind neuron:
            if (neighborX < this.x) {
                angleBetween = angleBetween + 180
            }
            this.axonAngle[j] = angleBetween;
            //console.log("Jeg er: " + i + ", forb til: " + neurons[i].connectedTo[j] + " med vinkel: " + int(neurons[i].axonAngle[j]));
        }
    }

    drawOneNeuron() {
        // draw axon:
        let axonColor = this.col;
        axonColor.setAlpha(150);
        stroke(axonColor);
        strokeWeight(10 * neuronSize);
        // every axon:
        for (let i = 0; i < this.connectedTo.length; i++) {
            let axonVector = createVector(this.axonLen[i], 0);
            axonVector.rotate(this.axonAngle[i]);
            let preSynX = this.x + axonVector.x;
            let preSynY = this.y + axonVector.y;
            line(this.x, this.y, preSynX, preSynY);
            // pre-synaps buttom part:
            let preSynVector = axonVector.rotate(90).limit(this.preSynLen); //perpendicular vector
            let preSynXButtom = preSynX + preSynVector.x;
            let preSynYButtom = preSynY + preSynVector.y;
            line(preSynX, preSynY, preSynXButtom, preSynYButtom);
            // pre-synaps top part:
            //preSynVector = axonVector.rotate(0).limit(this.preSynLen); //perpendicular vector
            let preSynXTop = preSynX - preSynVector.x;
            let preSynYTop = preSynY - preSynVector.y;
            line(preSynX, preSynY, preSynXTop, preSynYTop);
        }
        //draw soma: 
        noStroke();
        let somaColor = this.col;
        somaColor.setAlpha(255);
        fill(this.col);
        circle(this.x, this.y, this.soma);
    }

    drawMembranePotential() {
        fill(color(255, 0, 0, 200));
        noStroke();
        rectMode(CENTER);
        if (this.pot < (this.soma - 5)) {
            //lower threshold => wider MP rect:
            rect(this.x, this.y, 10, this.pot);
        } else {
            rect(this.x, this.y, 10, this.soma - 5);
        }
    }

    drawThreshold() {
        //console.log("in drawthreshold");
        fill(color(0, 255, 0, 255));
        noStroke();
        rectMode(CENTER);
        if (this.threshold < (this.soma - 5)) {
            //lower threshold => wider MP rect:
            rect(this.x, this.y, 10, this.threshold);
        } else {
            rect(this.x, this.y, 10, this.soma - 5);
        }
    }

    writeWinner() {
        console.log("WINNER");
        this.col = color(255, 255, 0);
        this.drawOneNeuron();
        fill('WHITE');
        rectMode(CENTER);
        rect(this.x, this.y - 50, 200, 60);
        fill('black');
        textSize(20);
        textAlign(CENTER);
        text('DU VINDER,', this.x, this.y - 50);
        textSize(12);
        text('med ' + clickCounter + ' neuroner', this.x, this.y - 25);
        noLoop();
    }


    writeNeuronType() {
        fill('white');
        textSize(map(numberOfNeurons, 15, 80, 15, 10));
        textAlign(CENTER);
        let typeText;
        if (this.stimulating) { typeText = "stim"; } else { typeText = "inhib"; }
        text(typeText, this.x, this.y - this.soma / 4);
        if (this.sensoryNeuron) { fill('black'); typeText = "sense"; } else { typeText = ""; }
        text(typeText, this.x, this.y + this.soma / 3);
    }


    writeNeuronID() { //write ID
        fill('white');
        textSize(12);
        textAlign(RIGHT);
        let idText;
        idText = this.neuronID;
        if (ear) { idText = 'Ear'; }
        text(idText, this.x - 12, this.y + 5);
    }

    writeMembraneData() {
        fill('black');
        textSize(12);
        textAlign(LEFT);
        let textThreshold = int(scaleMP(this.threshold)) + " mV";
        let textPot = int(scaleMP(this.pot)) + " mV";
        if (debugging) {
            text(int(this.threshold), this.x + this.soma / 2, this.y);
            text(int(this.pot), this.x + this.soma / 2, this.y + 12);
        } else {
            text(textThreshold, this.x + this.soma / 2, this.y);
            text(textPot, this.x + this.soma / 2, this.y + 12);
        }
    }

    updateThreshold() {
        //console.log(thresholdAvr);
        // threshold slowly increase to normal average (29):
        if (this.threshold <= thresholdAvr) {
            this.threshold += 0.01;
        } else { this.threshold -= 0.01; }
        //absolute limits:
        if (this.threshold > 35) { this.threshold = 35; }
        if (this.threshold < 25) { this.threshold = 25; }
        this.threshold = this.threshold + random(-0.1, 0.1) * noise;
    }

    updateMembranePot() {
        // all MP's over 2: decrease
        if (this.pot >= 2) { this.pot -= (exp(-0.6) + random(0, 2)); } //decrease number to decrease pot
        // MP upper limit
        if (this.pot > 40) { this.pot = 40; }
        // all MP's under 10: increase
        if (this.pot <= 10 + noise * random(0, 8)) {
            this.pot += noise * random(2, sensitivityRatio);
        }

        // synapse length slowly decrease to normal:
        if (this.preSynLen >= 10) { this.preSynLen -= 0.01; }
        if (this.pot > this.threshold) {
            this.fireNeuron();
        }
    }

    fireSensoryNeurons(n) {
        if (this.sensoryNeuron) {
            //stimulating neuron fire seldomly:
            if (this.stimulating) {
                let rand = noise * random(0, n); // n norm 1000
                if (rand > 995) {
                    this.pot += 5 * sensitivityRatio; //ratio 0..10
                }
            }
            // inhibitory neurons fire more often:
            if (!this.stimulating) {
                //console.log("inhib");
                let rand = noise * random(0, n); // n norm 1000
                if (rand > 800) {
                    this.pot += 5 * sensitivityRatio; //ratio 0..10
                }
            }
        }
    }

    fireNeuron() {
        // increase activation number:
        this.activations += 1;
        // AP:
        noStroke();
        fill('yellow');
        circle(this.x, this.y, this.soma); //yellow soma
        stroke('yellow');
        strokeWeight(10 * neuronSize);
        //if (writeNumbers) { this.writeMembraneData(); }
        // every axon:
        for (let j = 0; j < this.connectedTo.length; j++) {
            let axonColor = color(255, 255, 0); //yellow
            axonColor.setAlpha(180);
            stroke(axonColor);
            let axonVector = createVector(this.axonLen[j], 0);
            axonVector.rotate(this.axonAngle[j]);
            let preSynX = this.x + axonVector.x;
            let preSynY = this.y + axonVector.y;
            line(this.x, this.y, preSynX, preSynY);
            if (this.stimulating) { stroke(0, 255, 0, 180); /*green*/ } else { stroke(255, 0, 0, 180); /*red*/ }
            // pre-synaps buttom part:
            let preSynVector = axonVector.rotate(90).limit(this.preSynLen); //perpendicular vector
            let preSynXButtom = preSynX + preSynVector.x;
            let preSynYButtom = preSynY + preSynVector.y;
            line(preSynX, preSynY, preSynXButtom, preSynYButtom);
            // pre-synaps top part:
            let preSynXTop = preSynX - preSynVector.x;
            let preSynYTop = preSynY - preSynVector.y;
            line(preSynX, preSynY, preSynXTop, preSynYTop);
            //stimulating neuron:
            if (this.stimulating) {
                //only affect postsynapse if postsyn's MP<<threshold:
                if (neurons[this.connectedTo[j]].pot + 10 < neurons[this.connectedTo[j]].threshold) {
                    //increase post-neuron MP according på presynapse:
                    neurons[this.connectedTo[j]].pot += (10 + (this.preSynLen) * (random(0, 11) / 10));
                    //lower postsyn threshold a bit (increase sensitivity) until a limit:
                    if (neurons[this.connectedTo[j]].threshold > 20) {
                        neurons[this.connectedTo[j]].threshold -= 0.5;
                    }
                }
            }
            //inhibitory neuron:
            else {
                if (neurons[this.connectedTo[j]].pot > 10) {
                    neurons[this.connectedTo[j]].pot -= 10 + this.preSynLen / 2;
                }
            }
            //let post-synapse length grow until 25: 
            if (neurons[this.connectedTo[j]].preSynLen < 25) {
                neurons[this.connectedTo[j]].preSynLen += 0.1;
            }

        }
        // draw MP:
        this.pot += 10;
        this.drawMembranePotential();
        this.drawThreshold();
        // high membrane AP drops:
        if (this.pot > 15) {
            this.pot -= 10;
        }
    }
}



class NeuronType extends Neuron {
    constructor(x, y, stim) {
        super(x, y);
        this.stimulating = stim; // true for stimulating
    }
}

