/*
date: june 2022
by: Rasmus Kragh Wendelbo
using: p5 library by p5js.org
license: CC-BY-NC 4.0
topic: Simulation of neurons network
version: 1.9.6
features: 
- mouseclick for new axon
- inhibitory cells are red, stimulating are blue, sensory are yellow
- click on sensory neuron for AP.
- ear only (no eye) when 'ear' selected.
- synapses will grow when used.
- new axons will grow.
- danske tekster
- refractory period
- cells in refrac period are greyed
*/

let cvs;
let neurons = [];
let dyingNeurons = [];
let points = [];
let neuronSize = 1;
let numberOfNeurons = 60; //avr=50
let actualNumberOfNeurons;
let sliderSensitivityInitial = 100;
let sensitivityRatio = 5; //increase for more activity (sensitive nerons etc.)
let refractPeriod = 5;
let refracVisibility = 60; //increase for more visible
let speedInitial = 10;
let data = [];
let checkbox; let devCheckbox;
let noise = 1; // factor around 1
let branching = 50; // decrease for more neurons with 2 or 3 axons.
let stimulatingRatio = 3; // 1:num is inhib:stimulating neurons
let speed = 10;
let thresholdAvr = 27;
let mic;
let writeNumbers = false;
let ear = false;
let paused = false;
//let refracTime = 0;
let sel;
let noOptions = ['15', '40', '60', '80'];
let selLevel = noOptions[2]; // no of neurons at start.
let clickX; let clickY;
let infoBox;
let plot = false;
let message = "<h1>Model af biologisk neuralt netværk.</h1><h5>v.1.9.6. Ses bedst i 100% zoom.</h5>Hver nervecelle består af en cellekrop (soma) og en til flere udløbere (axon'er). En nervecelle kan enten være <i>stimulerende</i> (blålige), <i>hæmmende</i> (rødlige) eller en <i>sansecelle</i> (gullige).<br><br>I modellen har hver nervecelle en rød søjle for cellens <i>membranpotentiale</i> og en grøn søjle for <i>tærskelværdi</i>.<br><br><center><img src='neuron.jpg'></center><br>Sanseceller aktiveres af og til, men kan også aktiveres af <u>klik med musen</u>.<br><br>Nye axoner kan bl.a. dannes ved at <u>klikke på to nerveceller</u>, som er nær hinanden.";
let debugging = false;
/*debugging mode: inhibitory neurons: small. Normal: green. Senseing: purple */
//<I>Numre</I> viser <u>tærskelværdi</u> og <u>membranpotentiale</u> (sorte), samt hver nervecelles type og ID (hvid). Typen kan være <I>fremmende</I> (stim) eller <I>hæmmende</I> (inhib).

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
    Numberscheckbox = createCheckbox('Kvantitativ', writeNumbers);
    Numberscheckbox.position(5, height + 5);
    Numberscheckbox.changed(turnNumbersOn);
    devCheckbox = createCheckbox('Sanseindtryk', true);
    devCheckbox.position(5, height + 20);
    devCheckbox.changed(senses);
    //  s
    earCheckbox = createCheckbox('Øre', false);
    earCheckbox.position(distInGUI * 1 + 20, height + 5);
    earCheckbox.changed(turnEarOn);
    pausedCheckbox = createCheckbox('Pause', false);
    pausedCheckbox.position(distInGUI * 1 + 20, height + 20);
    pausedCheckbox.changed(turnPausedOn); //once mouse released
    // speed:
    sliderSpeed = createSlider(1, 30, speedInitial, 1); //min, max, start, step
    sliderSpeed.position(distInGUI * 2, height + 5);
    sliderSpeed.style('width', '80px');
    sliderSpeed.input(adjustSpeed); //instantaniously

    let txt2 = createDiv('Hastighed');
    txt2.style('font-size', '16px')
    txt2.position(distInGUI * 2, height + 25);
    // system sensitivity:
    sliderSensitivity = createSlider(10, 200, sliderSensitivityInitial, 1);
    sliderSensitivity.position(distInGUI * 3, height + 5);
    sliderSensitivity.style('width', '80px');
    sliderSensitivity.input(adjustSensitivity); //instantaniously
    let txt3 = createDiv('Følsomhed');
    txt3.style('font-size', '16px');
    txt3.position(distInGUI * 3, height + 25);
    // branching
    sliderBranching = createSlider(0, 100, branching, 5);
    sliderBranching.position(distInGUI * 4, height + 5);
    sliderBranching.style('width', '80px');
    sliderBranching.input(adjustBranching);
    let txt4 = createDiv('Forgreninger');
    txt4.style('font-size', '16px');
    txt4.position(distInGUI * 4, height + 25);
    // button:
    resetButton = createButton('RePlay');
    resetButton.position(distInGUI * 5, height + 5);
    resetButton.mouseClicked(rePlay);
    // number of neurons:
    sel = createSelect();
    sel.position(distInGUI * 6, height + 5);
    sel.option(noOptions[0]); sel.option(noOptions[1]); sel.option(noOptions[2]); sel.option(noOptions[3]);
    sel.selected(selLevel);
    sel.changed(newNumberOfNeurons);
    let txt = createDiv('Mus her for info');
    txt.style('font-size', '18px')
    txt.position(width - 200, height + 10);
    // button:
    /*gameButton = createButton('Game');
    gameButton.position(distInGUI * 7, height + 5);
    gameButton.mouseClicked(startGame);
*/
}


function initializeNeurons() {
    //console.log(numberOfNeurons + 1);
    neurons = [];
    neuronSize = 50 / int(selLevel);
    if (neuronSize > 1.3) { neuronSize = 1.3; }
    // make neurons:
    for (let m = 0; m < 20; m++) {
        for (let i = 0; i < int(selLevel); i++) {
            neurons.push(new Neuron(random(width), random(height)));
        }
        checkOnEdge(40);
        checkOverlap(70);
        // when sufficient neurons:
        if (neurons.length >= int(selLevel)) { m = 21; }
    }
    //first: incr for longer axons. Sec: decrease for more axons:
    findNeigbour(2, branching);
    turnToNeighborS();
    adjustAxonLength();
    assignNeuronIDs();
    neurons[0].stimulating = true;
    actualNumberOfNeurons = neurons.length;
    console.log("INITIAL Actu no of Neurons: " + actualNumberOfNeurons + ". Neurons array length: " + neurons.length);
    //console.log("Neurons: " + neurons);
}

function initializeInfoBox() {
    infoBox = createDiv(message);
    infoBox.style("width: 70%;");
    infoBox.style("height: 80%;");
    infoBox.style("padding: 10px;");
    //infoBox.style("f");
    infoBox.style("background-color: white");
    infoBox.style("z-index: -100");
    infoBox.position(200, 50);
}


function showNeurons() {
    background(230);
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

function senses() { }

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


// interactivity-------------------------------------------------------

function newNumberOfNeurons() { //chosen from slider
    points = []; // reset clicks
    selLevel = sel.value();
    numberOfNeurons = int(sel.value());
    //sel.selected(noOptions[selLevel]);
    // new set of neurons:
    neurons = [];
    initializeNeurons();
}


function mouseReleasedInCanvas() {
    let onNeuron=false;
    clickX = mouseX;
    clickY = mouseY;
    //console.log(clickX);
    for (let n of neurons) {
        let d = dist(clickX, clickY, n.x, n.y);
        if (d < n.soma) {
            onNeuron = true;
            if (n.sensoryNeuron) { // increase neuron MP:
                if (n.pot<n.threshold && (frameCount - n.refracTime) > sensitivityRatio * refractPeriod*2) {
                    //
                    n.pot = n.pot + 15; //may increase pot to over threshold
                }
            }
            if (!n.sensoryNeuron) { // not click on sensory neuron:
                //console.log(points);
                if (points.length==0) { //first clicked
                    n.col = color(255,0,0);
                    points.push(new Point(mouseX, mouseY, onNeuron));
                    points[0].ID = n.neuronID;
                }
                else { //one neuron already clicked:
                    if (points[0].ID == n.neuronID) { // same Neuron already clicked:
                        //console.log("330");
                        n.col = color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
                        points = [];
                    }
                    else {
                        //console.log(points); 
                        points.push(new Point(mouseX, mouseY, onNeuron));
                        points[points.length-1].ID = n.neuronID;
                        if (dist(points[0].x, points[0].y, points[points.length-1].x, points[points.length-1].y)<200) { //only draw new axon, if distance is short
                            drawNewAxon(); 
                            points = [];
                    }
                }
                }
                //recolor rest of neurons in points:
                }
            }
        }
    }
    //console.log(points[points.length - 1]);
    //checkForClickOnTwoNeurons();
    //console.log(points);
    


class Point {
    constructor(x, y, onNeuron) {
        this.x = x;
        this.y = y;
        this.onNeuron = onNeuron; //true if on a neuron
        this.ID;
    }
}

function checkForClickOnTwoNeurons() {
    //at least two clicks, two consequtive cells, not the same cell:
    if (points.length > 1 && points[points.length - 2].onNeuron && points[points.length - 1].onNeuron && points[points.length - 2].ID != points[points.length - 1].ID) {
        // too far from eachother:
        if (dist(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y)<200) { //only draw new axon, if short
        drawNewAxon();
        }
    }
}

function drawNewAxon() {
    console.log("in drawNewAxon");
        //make new connection:
        neurons[points[0].ID].connectedTo.push(points[points.length - 1].ID);
        turnToNeighbor();
        adjustAxonLength();
        //recolor neurons: 
        neurons[points[0].ID].col=color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
        //neurons[points[points.length - 1].ID].col=color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
        // restart clicks: 
        console.log("end of drawNewAxon");
    }


function turnToNeighbor() {
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


function turnNumbersOn() {
    if (Numberscheckbox.checked()) { writeNumbers = true; }
    else { writeNumbers = false; }
}

function startGame() {
    window.location.href = 'https://raskrawen.github.io/edu/bioNN/gameNN.html';
}

function turnEarOn() {
    if (earCheckbox.checked()) {
        ear = true;
        mic = new p5.AudioIn(); // start the Audio Input.
        mic.start();
        assignNeuronIDs();
        if (getAudioContext().state !== 'running') {
            getAudioContext().resume();
        }
    }
    else { ear = false; }
}

function turnPausedOn() {
    if (pausedCheckbox.checked()) {
        noLoop();
    }
    else { paused = false; loop(); }
}

function adjustSpeed() {
    speedInitial = sliderSpeed.value();
}
function adjustSensitivity() {
    // sliderSens.value  from 0 to 200. start = 100%, map to 45,15 interval.
    thresholdAvr = map(sliderSensitivity.value(), 0, 200, 45, 15);
    sensitivityRatio = sliderSensitivity.value() / 20; //avr = 5. 100/20=5. 1:5 inhib:stim is nm
    sliderSensitivityInitial = sliderSensitivity.value();
}

function adjustBranching() {
    // begin = 10% branching. 
    branching = sliderBranching.value();
}

function rePlay() {
    loop();
    ear = false; paused = false;
    console.log(numberOfNeurons);
    sel.selected(selLevel);
    removeElements(); //not the canvas
    points = [];
    neurons = [];
    setup();
}

function scaleMP(pot) { //calculates MP for display
    // MP = 1.33*pot -90
    return (1.33 * pot - 90)
}

function scaleNumber(n) { //calculates number from MP for the model
    return ((n + 90) / 1.33)
}

// running tasks ----------------------------------------------------------
function draw() {
    background(180);
    frameRate(sliderSpeed.value());
    //console.log("Actu no of Neurons: " + actualNumberOfNeurons + ". Neurons array length: " + neurons.length);
    // infobox in front or back:
    if (mouseX > width - 200 && mouseY > height) {
        infoBox.style("z-index: 100");
    } else {
        infoBox.style("z-index: -100");
    }

    if (ear) {
        let vol = mic.getLevel();
        neurons[0].pot = vol * 5000;
    }
    if (neurons[0].pot > 50) { neurons[0].pot = 50; }
    if (ear) {
        neurons[0].col = color('black');
    }
    else {
        neurons[0].col = color(170, 130, 190);
    }
    
    for (let n of neurons) {
        n.growNewAxon();
        n.drawOneNeuron();
        n.updateMembranePot();
        n.updateThreshold();
        n.drawThreshold();
        n.drawMembranePotential();
        //n.updateColor();
        if (devCheckbox.checked()) { n.fireSensoryNeurons(1000 * sensitivityRatio / 5); } //higher = more likely to fire
        if (writeNumbers) {
            n.writeMembraneData();
            n.writeNeuronID();
            n.writeNeuronType();
        }
        if ((frameCount - n.refracTime) > 250/sensitivityRatio) {
            n.inRefractionPeriod = false;
        }
    }
    if (writeNumbers && plot) {
        if (points.length>0) { drawPlot(points[0].ID); }
        else { drawPlot(1); }
    }
    if (points.length>0) { collectNeuronPots(points[0].ID); }
    else { collectNeuronPots(1); }
}

// --------------------end of DRAW------------

function collectNeuronPots(num) {
    splice(data, int(scaleMP(neurons[num].pot)), 0);
    if (data.length > 100) {
        data.pop();
    }
    //console.log(data);

}

function drawPlot(num) {
    let xAxisdispl = 100;
    let paddingFromBottom = 10;
    let xAxisLength = 300;
    let yAxisHeight = 200;
    stroke(10);
    strokeWeight(5);
    rectMode(CORNER);
    //background: 
    rect(width / 2 - xAxisdispl, height - paddingFromBottom, xAxisLength, -yAxisHeight-10);
    //y axis:
    line(width / 2 - xAxisdispl, height - paddingFromBottom, width / 2 - xAxisdispl, height - yAxisHeight);
    //x axis:
    line(width / 2 - xAxisdispl, height - paddingFromBottom, width / 2 + xAxisLength - xAxisdispl, height - paddingFromBottom);
    // threshold neuron:
    stroke(255, 0, 0);
    let yThreshold = map(scaleMP(neurons[num].threshold), -100, 30, height - paddingFromBottom, height - yAxisHeight);
    line(width / 2 - xAxisdispl+5, yThreshold, width / 2 + xAxisLength - xAxisdispl-5, yThreshold);
    //MP neuron[0]:
    stroke(10);
    for (let i = 0; i < data.length; i++) {
        let yValue = map(data[i], -100, 30, height - paddingFromBottom, height - yAxisHeight);
        let distanceBetweenDataPoints = xAxisLength / 100;
        circle(width / 2 + -xAxisdispl + xAxisLength - i * distanceBetweenDataPoints, yValue, 1);
    }
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
        //this.refractPeriod = sensitivityRatio //sensitivityRatio avr 5 on a 0 to 10 scale
        this.refracTime = -1000; //avoids refrac period on start
        this.inRefractionPeriod = false;
        this.threshold = thresholdAvr + noise * random(-3, 3); //pot must exteed to fire AP
        this.axonAngle = [] // noise * random(0, 360); //0..360
        this.connectedTo = []; //should be an array
        // Stimulating or inhibiting neuron. false = inhibitory
        let determineStimulating = random(0, stimulatingRatio * 10); //stimultingRation around 4.
        if (determineStimulating <= 5) { //increase number for more inhibitory cells
            this.stimulating = false; // false = inhibiting
            if (debugging) { this.soma = 25; }
        }
        else {
            this.stimulating = true;
        }
        // become sensory or normal neurons: (All sensory are stimul.)
        /*sensitivityRatio avr 5 on a 0 to 10 scale
        Decrease y for more sensory cells.*/
        if (random(0, 40) < sensitivityRatio && this.stimulating) {
            // sensory cell:
            this.sensoryNeuron = true; //mostly yellow
            this.col = color(150 + random(0, 55), 120 + random(0, 50), random(0, 50));
            if (debugging) { this.col = color(255, 0, 205); }
        }
        else {
            // normal stim cell:
            this.sensoryNeuron = false;
            this.col = color(25 + random(0, 50), 25 + random(0, 100), 150 + random(0, 155));
            if (debugging) { this.col = color(0, 255, 0); }
        }
        //inhibitory cells:
        if (!this.stimulating) {
            this.col = this.col = color(100 + random(0, 100), 25 + random(0, 100), 25 + random(0, 100));
        }
        this.refracColor = this.col;
        this.refracColor.setAlpha(5);
    }

    growNewAxon() {
        //sliderSensitivity between 10 and 200, begins at 100
        // Grow new axon after 10-20 activations. Max 4 axons:
        //console.log(1000/sliderSensitivity.value());
        if (this.activations > random(1000/sliderSensitivity.value(),1000/sliderSensitivity.value()+10) && this.connectedTo.length < 4) {
            console.log("new axon growing");
            let newNeighbor;
            let d_shortest = width;
            let d_new = width;
            //Find NEXT neighbor: check every other neuron
            for (let i = 0; i < neurons.length; i++) {
                //console.log("1 " + i);
                // only proceed if not dist to self (1->1):
                if (i != this.neuronID) {
                    //console.log("2");
                    // only proceed if not already a 1->2 connection:
                    for (let k = 0; k < this.connectedTo.length; k++) {
                        if (this.connectedTo[k] != i) {
                            //console.log("3");
                            //only proceed if no crosslinks (2->1):
                            let no2to1connection = true;
                            for (let j = 0; j < neurons[i].connectedTo.length; j++) {
                                if (neurons[i].connectedTo[j] == this.neuronID) {
                                    no2to1connection = false; //2->1 connection!
                                }
                            }
                            //console.log(no2to1connection);
                            if (no2to1connection) { //they are not connected
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
                    newNeighdrawOneNeuronbor2 = j;
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
        if (this.inRefractionPeriod) {
            axonColor = this.refracColor;
            axonColor.setAlpha(refracVisibility);
        }
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
        if (this.inRefractionPeriod) {
            somaColor = this.refracColor;
            somaColor.setAlpha(refracVisibility+100);
        }
        fill(somaColor);
        circle(this.x, this.y, this.soma);
    }

    drawMembranePotential() {
        fill(color(255, 0, 0, 200));
        noStroke();
        rectMode(CENTER);
        if (this.pot < (this.soma - 5)) {
            //lower threshold => wider MP rect:
            rect(this.x, this.y, 10 * 40 / neurons.length, this.pot);
        } else {
            rect(this.x, this.y, 10 * 40 / neurons.length, this.soma - 10);
        }
    }

    drawThreshold() {
        //console.log("in drawthreshold");
        fill(color(0, 255, 0, 255));
        noStroke();
        rectMode(CENTER);
        if (this.threshold < (this.soma - 5)) {
            //lower threshold => wider MP rect:
            rect(this.x, this.y, 10 * 40 / neurons.length, this.threshold);
        } else {
            rect(this.x, this.y, 10 * 40 / neurons.length, this.soma - 5);
        }
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

    writeActivations() {
        fill('white');
        textSize(12);
        textAlign(LEFT);
        let idText;
        idText = this.activations;
        text(idText, this.x + 12, this.y + 5);

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
        if (scaleMP(this.pot)>0) {
            textPot = " " + int(scaleMP(this.pot)) + " mV";
        }
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
        if (this.threshold < 20) { this.threshold = 20; }
        this.threshold = this.threshold + random(-0.1, 0.1) * noise;
    }

    updateMembranePot() {
        // all MP's over 2: decrease
        if (this.pot >= 10) { this.pot -= exp(this.pot/50) + random(-3,3); } //decrease number to decrease pot
        // MP upper limit
        if (scaleMP(this.pot) > 40) { this.pot = 100; }
        // MP lower limit: 
        if (scaleMP(this.pot) < -100) { this.pot = -10}
        // all MP's under 10: increase
        if (this.pot <= 10 + noise * random(0, 8)) {
            this.pot += random(0,1);
        }

        // synapse length slowly decrease to normal:
        if (this.preSynLen >= 10) { this.preSynLen -= 0.01; }
        if (this.pot > this.threshold) {
            this.fireNeuron();
        }
        //All neurons very seldomly fires: 
        if (devCheckbox.checked()) {
            if (random(0, 1000) < 1 && (frameCount - this.refracTime) > sensitivityRatio * refractPeriod) { this.pot += 40 + sensitivityRatio; }
        }
    }

    fireSensoryNeurons(n) {
        if (this.sensoryNeuron) {
            let rand = noise * random(0, n); // n norm 1000
            if (rand > 995 && this.pot<this.threshold && (frameCount - this.refracTime) > sensitivityRatio * refractPeriod*2) {
                this.pot += 10 * sensitivityRatio; //ratio 0..10
            }
        }
    }

    fireNeuron() {
        if (writeNumbers) { this.writeMembraneData(); }
        //only fire if not in refractory period:
        //console.log(250/sensitivityRatio);
        if ((frameCount - this.refracTime) > 250/sensitivityRatio) {
            // increase activation number:
            this.activations += 1;
            console.log(this.activations);
            this.inRefractionPeriod = true;
            // AP:
            this.pot = scaleNumber(40);
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
                    //if (neurons[this.connectedTo[j]].pot +5 < neurons[this.connectedTo[j]].threshold) {
                        //increase post-neuron MP from sensory cell according på presynapse, if postneuron MP<threshold:
                        if (this.sensoryNeuron && frameCount - neurons[this.connectedTo[j]].refracTime > 250/sensitivityRatio) { neurons[this.connectedTo[j]].pot += (40 + (this.preSynLen) * (random(0, 11) / 10));
                        }
                        if (!this.sensoryNeuron && frameCount - neurons[this.connectedTo[j]].refracTime> 250/sensitivityRatio) { //increase post-neuron MP from neuron according på presynapse:

                            neurons[this.connectedTo[j]].pot += ( 5 + (this.preSynLen) * (sensitivityRatio/5));
                        }
                        //lower postsyn threshold a bit (increase sensitivity) until a limit:
                        if (neurons[this.connectedTo[j]].threshold > 20) {
                            neurons[this.connectedTo[j]].threshold -= 0.5;
                        }
                    //}
                }
                //inhibitory neuron:
                else {
                    if (neurons[this.connectedTo[j]].pot > 10) {
                        neurons[this.connectedTo[j]].pot -= 20 + this.preSynLen;
                    }
                }
                //let post-synapse length grow until 25:
                if (neurons[this.connectedTo[j]].preSynLen < 25) {
                    neurons[this.connectedTo[j]].preSynLen += 0.5;
                }
            }
            // draw MP:
            this.drawMembranePotential();
            this.drawThreshold();
            //when fired give new refrac time:
            this.refracTime = frameCount;
        }
    } //end of fireNeuron
}

