let neurons = [];
let dyingNeurons = [];
let points = [];
let neuronSize = 1;
let numberOfNeurons = 40; //avr=50
let sensitivityRatio = 1; //increase for more activity (sensitive nerons etc.)
let development = false;
let writeNumbers = false;
let checkbox; let devCheckbox;
let noise = 1; // factor around 1
let branching = 6; //decrease for more neurons with 2 or 3 axons.
let stimulatingRatio = 5; // 1:num is inhib:stimulating neurons
let speed = 10;
let mic;
let ear = false;
let eye = false;
let pixelSum;
let capture;
let sel;
let infoBox;
let seeNeuronType = false;
let message = "<h1>Model af neuralt netværk.</h1><h3>I hjernen findes nerveceller, som er forbundet og signalerer til hinanden, i et netværk.<br> <I>Numbers</I> viser membranpotentiale og tærskelværdi (sorte), samt hver nervecelles ID<br><I>Development</I> viser en udvikling i fosterets hjerne.<br>Two cells represent ears og eyes, respectively. May be activated by aprpriate.</br>";

function preload() { //prevent crash, if camera is blocked in browser.
    capture = loadImage('Billede1.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight - 50);
    console.log("Startet");
    //noise = randomGaussian(1.1, 0.1);
    drawGUI();
    angleMode(DEGREES);
    initializeNeurons();
    mic = new p5.AudioIn(); // start the Audio Input.
    mic.start();
    let capture = createCapture(VIDEO); //start video capture
    capture.hide();
    capture.size(34, 24);
    infoBox = createDiv(message);
    infoBox.style("width: 600px;");
    infoBox.style("height: 400px;");
    infoBox.style("padding: 10px;");
    infoBox.style("background-color: white");
    infoBox.style("z-index: -100");
    infoBox.position(200, 100);
}

function drawGUI() {
    let distInGUI = 100;
    Numberscheckbox = createCheckbox('Numbers', false);
    Numberscheckbox.position(5, height + 5);
    Numberscheckbox.changed(turnNumbersOn);
    devCheckbox = createCheckbox('Development', false);
    devCheckbox.position(5, height + 20);
    devCheckbox.changed(turnDevOff);
    //  s
    earCheckbox = createCheckbox('Ear', false);
    earCheckbox.position(distInGUI * 1 + 20, height + 5);
    earCheckbox.changed(turnEarOn);
    eyeCheckbox = createCheckbox('Eye', false);
    eyeCheckbox.position(distInGUI * 1 + 20, height + 20);
    eyeCheckbox.changed(turnEyeOn);
    // speed:
    sliderSpeed = createSlider(1, 30, 10, 1); //min, max, start, step
    sliderSpeed.position(distInGUI * 2, height + 5);
    sliderSpeed.style('width', '80px');
    let txt2 = createDiv('Speed');
    txt2.style('font-size', '18px')
    txt2.position(distInGUI * 2, height + 25);
    // system sensitivity:
    sliderActivity = createSlider(1, 100, 50, 5);
    sliderActivity.position(distInGUI * 3, height + 5);
    sliderActivity.style('width', '80px');
    sliderActivity.input(adjustActivity);
    let txt3 = createDiv('Sensitivity');
    txt3.style('font-size', '18px');
    txt3.position(distInGUI * 3, height + 25);
    // branching
    sliderBranching = createSlider(0, 100, 10, 5);
    sliderBranching.position(distInGUI * 4, height + 5);
    sliderBranching.style('width', '80px');
    sliderBranching.input(adjustBranching);
    let txt4 = createDiv('Branching');
    txt4.style('font-size', '18px');
    txt4.position(distInGUI * 4, height + 25);

    // number of neurons:
    sel = createSelect();
    sel.position(distInGUI * 5, height + 5);
    sel.option('40'); sel.option('15'); sel.option('60'); sel.option('80');
    sel.changed(newNumberOfNeurons);
    // button:
    resetButton = createButton('Reset all');
    resetButton.position(distInGUI * 6, height + 5);
    resetButton.mousePressed(reset);

    let txt = createDiv('Mouse here for info');
    txt.style('font-size', '18px')
    txt.position(width - 200, height + 10);
}


function initializeNeurons() {
    //console.log(numberOfNeurons + 1);
    neurons = [];
    neuronSize = 50 / numberOfNeurons;
    if (neuronSize > 1.3) { neuronSize = 1.3; }
    while (neurons.length < numberOfNeurons) {
        for (let i = 0; i < numberOfNeurons; i++) {
            neurons.push(new Neuron(random(width), random(height)));
        }
        checkOnEdge(40);
        checkOverlap(70);
    }
    //first: incr for longer axons. Sec: decrease for more axons:
    findNeigbour(2, branching);
    turnToNeighbor();
    adjustAxonLength();
    assignNeuronIDs();
    console.log("Neurons: " + neurons);
}

function newNumberOfNeurons() {
    points = []; // reset clicks
    numberOfNeurons = int(sel.value());
    console.log(numberOfNeurons + 1);
    if (numberOfNeurons > 80) { numberOfNeurons = 80; }
    // new set of neurons:
    neurons = [];
    initializeNeurons();
}

function showNeurons() {
    background(220);
    for (let n of neurons) {
        // draw axon:
        n.drawNeuron();
    }
}

function checkOnEdge(n) {
    let EdgeLimit = n;
    for (let i = 0; i < neurons.length; i++) {
        if (neurons[i].x > width - EdgeLimit || neurons[i].x < EdgeLimit || neurons[i].y > height - EdgeLimit || neurons[i].y < EdgeLimit) {
            neurons.splice(i, 1); // removes neuron on edge
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
                neurons.splice(j, 1); //
                checkOverlap(n);
            }
        }
    }
    console.log("Fjerner overlappende neuroner. Antal neuroner: " + neurons.length);
}

function findNeigbour(n, m) {
    let branchingNum = m;
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

function adjustAxonLength() {
    //every neuron:
    for (let i = 0; i < neurons.length; i++) {
        // every neigbour:
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
    if (ear) { neurons[0].neuronID = 'Ear'; } else { neurons[0].neuronID = 0; }
    if (eye) { neurons[1].neuronID = 'Eye'; } else { neurons[1].neuronID = 1; }
}



// interactivity-------------------------------------------------------
function mousePressed() {
    console.log("mouse pressed");
    points.push(new Point(mouseX, mouseY));
    //console.log(points[points.length - 1]);
    for (let n of neurons) {
        n.checkForClickOnNeuron();
    }
    drawNewNeuron();
    drawNewAxon();
    console.log(points);
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.onNeuron = false; //true if on a neuron
        this.ID;
    }
}

function turnDevOff() {
    if (devCheckbox.checked()) { development = true; neurons = []; initializeNeurons(); }
    else { development = false; }
}

function turnNumbersOn() {
    if (Numberscheckbox.checked()) { writeNumbers = true; }
    else { writeNumbers = false; }
}

function turnEarOn() {
    if (earCheckbox.checked()) { ear = true; assignNeuronIDs(); }
    else { ear = false; }
}

function turnEyeOn() {
    if (eyeCheckbox.checked()) { console.log("eye = true"); eye = true; assignNeuronIDs(); }
    else { eye = false; }
}

function adjustActivity() {
    //is 1 from start. increase for more activity. 0.001 to 2
    sensitivityRatio = sliderActivity.value() / 50;
}

function adjustBranching() {
    // begin = 5. Increase for less branching (fewer axons)
    branching = sliderBranching.value();
}

function reset() {
    Numberscheckbox.remove(); earCheckbox.remove(); eyeCheckbox.remove();
    sliderSpeed.remove(); sliderActivity.remove(); sel.remove();
    resetButton.remove(); sliderBranching.remove();
    ear = false; eye = false; writeNumbers = false; numberOfNeurons = 40;
    point = [];
    neurons = [];
    setup();

}

function drawNewAxon() {
    //at least two clicks, two consequtive cells, not the same cell:
    if (points.length > 1 && points[points.length - 2].onNeuron && points[points.length - 1].onNeuron && points[points.length - 2].ID != points[points.length - 1].ID) {
        //make new connection:
        neurons[points[points.length - 2].ID].connectedTo[0] = points[points.length - 1].ID;
        turnToNeighbor();
        adjustAxonLength();
        // restart clicks: 
        points = [];
    }
}

function drawNewNeuron() {
    // more than two clicks, click-sequence is not a cell then a cell, click in window:
    if (points.length > 1 && !points[points.length - 2].onNeuron && points[points.length - 1].onNeuron && points[points.length - 2].y < windowHeight - 50) {
        neurons.push(new Neuron(points[points.length - 2].x, points[points.length - 2].y));
        // establish and draw new connection:
        neurons[neurons.length - 1].connectedTo[0] = points[points.length - 1].ID;
        assignNeuronIDs();
        turnToNeighbor();
        adjustAxonLength();
        //reset clicks: 
        points = [];
    }
}
/*
function keyPressed() {
    if (key == ' ') {
        console.log("spaced pressed");
        window.alert("Numbers viser neuronets membranpotentiale og tærskelværdi. \nVærdierne er også vist som højde og bredde af den røde klods.\nVærdi med hvid er nervecelle's ID. \n\nDevelopment viser udviklingen af et nervesystem \n\n Du kan tilføje nerveceller og ændre nogle af deres forbindelser. \n  ");// display textbox ?? 
    }
}*/

// running tasks ----------------------------------------------------------
function draw() {
    background(220);
    if (mouseX > width - 200 && mouseY > height) {
        infoBox.style("z-index: 100");
    } else {
        infoBox.style("z-index: -100");
    }

    frameRate(sliderSpeed.value());
    if (ear) {
        neurons[0].stimulating = true;
        let vol = mic.getLevel();
        neurons[0].pot = vol * 5000;
        if (neurons[0].pot > 50) { neurons[0].pot = 50; }
        neurons[0].col = color('black');
    }
    else {
        neurons[0].col = color(170, 130, 190);
        neurons[0].neuronID = 0;
    }

    if (eye) {
        console.log("in draw, in eye..");
        neurons[1].col = color('black');
        neurons[1].stimulating = true;
        pixelSum = 0;
        console.log("1");
        capture.loadPixels();
        console.log("2");
        for (let x = 0; x < capture.pixels.length; x += 1) {
            pixelSum += capture.pixels[x];
        }
        pixelSum = int(pixelSum / 100000);
        console.log("pixelSum: " + pixelSum);
        if (pixelSum > 6 && pixelSum < 15) {
            neurons[1].pot = neurons[1].threshold + 1;
            neurons[1].fireNeuron();
        } // bright light: 7-8
    }
    else {
        neurons[1].col = color(160, 140, 180);
        neurons[1].neuronID = 1;
    }
    for (let n of neurons) {
        n.drawNeuron();
        n.updateMembranePot();
        n.drawMembranePotential();
        n.fireSensoryNeurons(1000 * sensitivityRatio); //higher = more likely to fire
        if (writeNumbers) {
            n.writeMembraneData();
            n.writeNeuronID();
        }
    }
    // drawing and killing  dying neurons:
    if (development && dyingNeurons.length > 0) {
        for (let j = 0; j < dyingNeurons.length; j++) {
            console.log("Fjerner døde neuroner..");
            dyingNeurons[j].drawDyingNeuron();
            dyingNeurons[j].updateDyingNeurons();
            dyingNeurons[j].removeDeadNeuron(j);
        }
    }
}


function scaleMP(pot) {
    //        return (this.pot
    // y = 0,0075x^3 - 0,3333x2 + 4,5833x - 90
    return (1.33 * pot - 90)
    //return pot
}

// Neuron------------------------------------------------------------------
class Neuron {
    constructor(x, y) {
        this.neuronID;
        this.x = x;
        this.y = y;
        this.axonLen = [];
        this.soma = (40 + random(0, 20)) * neuronSize;
        this.preSynLen = 15 * neuronSize;
        this.pot = 10; //initial membranepotential
        this.threshold = 30 + noise * random(-3, 3); //pot must exteed to fire AP
        this.axonAngle = [] // noise * random(0, 360); //0..360
        this.connectedTo = []; //should be an array
        // Stimulating or inhibiting neuron. false = inhibitory
        let determineStimulating = int(random(0, stimulatingRatio)) * noise;
        if (determineStimulating <= 1) { //increase number for more stimulating cells
            this.stimulating = false; // false = inhibiting
            if (seeNeuronType) { this.soma = 25; }
        }
        else {
            this.stimulating = true;
        }
        // become sensory or normal neurons:
        let determineSensory = random(0, 10);
        if (determineSensory > 7 * sensitivityRatio && this.stimulating) {
            // sensory cell:
            this.sensoryNeuron = true;
            this.col = color(50 + random(0, 150), 50 + random(0, 150), 150 + random(20, 50)); //more yellow
            if (seeNeuronType) { this.col = color(255, 0, 255); }
        }
        else {
            // normal cell:
            this.sensoryNeuron = false;
            this.col = color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
            if (seeNeuronType) { this.col = color(0, 255, 0); }
        }
    }

    checkForClickOnNeuron = function () {
        console.log("Check for click on cell or not");
        let d = dist(points[points.length - 1].x, points[points.length - 1].y, this.x, this.y);
        // is current click on cell or not? 
        if (d < this.soma) {
            //console.log("klikket på celle!");
            points[points.length - 1].onNeuron = true; //set click to "on neuron"
            points[points.length - 1].ID = this.neuronID;
            console.log("last click on cell: " + this.neuronID + ", " + points[points.length - 1].onNeuron);
            this.pot = this.threshold + 5; //increase pot to over threshold
        }
    }

    drawNeuron() {
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
        fill('red');
        noStroke();
        rectMode(CENTER);
        if (this.pot < (this.soma - 5)) {
            //lower threshold => wider MP rect:
            rect(this.x, this.y, 10 * 30 / abs(this.threshold), this.pot);
        } else {
            rect(this.x, this.y, 10 * 30 / abs(this.threshold), this.soma - 5);
        }
    }

    writeNeuronID() { //write ID
        fill('white');
        textSize(12);
        text(this.neuronID, this.x - (this.soma / 2.1), this.y + 5);
    }

    writeMembraneData() {
        fill('black');
        textSize(12);
        text(int(scaleMP(this.threshold)), this.x + this.soma / 2, this.y);
        text(int(scaleMP(this.pot)), this.x + this.soma / 2, this.y + 12);
    }
    updateMembranePot() {
        // all MP's over 2: decrease
        if (this.pot >= 2) { this.pot -= (exp(-0.6) + random(0, 2)); } //decrease number to decrease pot
        // all MP's under 10: increase
        if (this.pot <= 10 + noise * random(0, 8)) {
            this.pot += noise * random(0, 4);
        }
        // threshold increase to normal (29):
        if (this.threshold < 29 + noise * random(-2, 2)) {
            this.threshold += 0.001;
        }
        // synapse length slowly decrease to normal:
        if (this.preSynLen >= 10) { this.preSynLen -= 0.01; }
        if (this.pot > this.threshold) {
            this.fireNeuron();
        }
    }
    fireSensoryNeurons(n) {
        if (this.sensoryNeuron) {
            let rand = noise * random(0, n);
            if (rand > 995) {
                this.pot += 30;
            }
        }
    }
    fireNeuron() {
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
                if (neurons[this.connectedTo[j]].pot + 5 < neurons[this.connectedTo[j]].threshold) {
                    //increase post-neuron MP according på presynapse:
                    neurons[this.connectedTo[j]].pot += (10 + (this.preSynLen) * (random(0, 11) / 10));
                    //lower postsyn threshold a bit (increase sensitivity):
                    if (neurons[this.connectedTo[j]].threshold > 20) {
                        neurons[this.connectedTo[j]].threshold -= 0.5;
                    }
                }
            }
            //inhibitory neuron:
            else {
                if (neurons[this.connectedTo[j]].pot > 10) {
                    neurons[this.connectedTo[j]].pot -= 5 + this.preSynLen / 2;
                }
            }
            //let post-synapse length grow until 30: CORRECT???
            if (neurons[this.connectedTo[j]].preSynLen < 30) {
                neurons[this.connectedTo[j]].preSynLen += 0.1;
            }
        }
        // draw MP:
        this.pot += 10;
        this.drawMembranePotential();
        // high membrane AP drops:
        if (this.pot > 15) {
            this.pot = this.pot - 10;
        }

    }
}

class DyingNeuron extends Neuron {
    constructor(x, y) {
        super(x, y);
        this.axonLen[0] = random(30, 200);
        this.somaAlpha = 190 + random(-50, 50);
        this.lifeTime = random(0, 100);
        this.col = color(25 + random(0, 100), 25 + random(0, 100), 100 + random(0, 155));
        this.axonAngle[0] = random(0, 360);
        //console.log(dyingNeurons.length);
    }

    drawDyingNeuron() {
        noStroke();
        //soma: 
        this.col.setAlpha(this.somaAlpha);
        fill(this.col);
        circle(this.x, this.y, this.soma);
        //axon:
        stroke(this.col);
        strokeWeight(10 * neuronSize);
        let axonVector = createVector(this.axonLen[0], 0);
        axonVector.rotate(this.axonAngle[0]);
        let preSynX = this.x + axonVector.x;
        let preSynY = this.y + axonVector.y;
        line(this.x, this.y, preSynX, preSynY);
    }

    updateDyingNeurons() {
        this.somaAlpha -= (1 * this.lifeTime);
        this.soma -= 0.1;
        if (this.axonLen[0] > 0) {
            this.axonLen[0] -= 0.5;
        }
    }

    removeDeadNeuron(n) {
        if (this.somaAlpha < 0 || this.soma < 1) {
            dyingNeurons.splice(n, 1);
        }
    }
}




