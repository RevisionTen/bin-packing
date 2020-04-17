

interface SpaceInterface {
    x: number,
    y: number,
    width: number,
    height: number,
    area: number
}

interface BoxInterface {
    x: number,
    y: number,
    width: number,
    height: number,
    area: number
}

class Space implements SpaceInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    area: number;

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.area = width * height;
    }
}
class Box implements BoxInterface {
    x: number;
    y: number;
    width: number;
    height: number;
    area: number;

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.area = width * height;
    }
}

(window as any).spaces = [
    // Erster Space ist der Container.
    new Space(0, 0, 1360, 240)
] as Space[];

let pendingBoxes = [
    // Die Boxen die platziert werden müssen.
    new Box(60, 80),
    new Box(60, 80),
    new Box(60, 80),
    new Box(80, 120),
    new Box(80, 120),
    new Box(80, 130),
    new Box(80, 130),
    new Box(80, 130),
    new Box(80, 130),
    new Box(100, 120),
    new Box(140, 120),
    new Box(140, 120),
    new Box(500, 120),
    new Box(500, 120),
    //new Box(260, 220),
    new Box(260, 220)
] as Box[];

let completedBoxes = [] as Box[];

function rotateBox(box: Box): Box {
    let width = box.width;
    let height = box.height;

    box.height = width;
    box.width = height;

    return box;
}

// Methode die einen float zurückgibt der besagt wie gut die Box den Space ausnutzt.
// Gibt 0 zurück wenn die Box garnicht in den Space passt.
function getSpaceScore(box: Box, space: Space): number {
    if (null === space) {
        return 0;
    }
    if (box.width <= space.width && box.height <= space.height) {
        // Box fits.
    } else if (box.height <= space.width && box.width <= space.height) {
        // Box fits rotated.
        box = rotateBox(box);
    } else {
        // Box does not fit.
        return 0;
    }

    return box.area / space.area;
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

function mergeSpaces(originalSpaces: Space[]): Space[] {
    let mergedSpaces = [];
    let keptSpaces = [];

    // Gelöschte spaces entfernen.
    originalSpaces = originalSpaces.filter(notEmpty);

    // Spaces nach y koordinate sortieren.
    originalSpaces = originalSpaces.sort((a, b) => (a.y > b.y) ? 1 : -1);

    for (let spaceKey in originalSpaces) {
        let space = originalSpaces[spaceKey];
        let nextSpace = originalSpaces[parseInt(spaceKey) + 1];
        let nextNextSpace = originalSpaces[parseInt(spaceKey) + 2];

        if (space && nextSpace && space.y > 0) {
            let sameHeight = (space.y >= (nextSpace.y - 10)) && (space.y <= (nextSpace.y + 10));

            let adjacent = (space.x + space.width) === nextSpace.x;
            if (sameHeight && adjacent) {
                // Spaces sind auf gleicher höhe und nebeneinander
                let y = space.y > nextSpace.y ? space.y : nextSpace.y;
                let mergedSpace = new Space(space.x, y, (space.width + nextSpace.width), space.height);
                // Neuen verbundenen Space hinzufügen.
                mergedSpaces.push(mergedSpace);
                // Nächsten space löschen.
                originalSpaces[spaceKey] = null;
                originalSpaces[parseInt(spaceKey) + 1] = null;
            } else {
                keptSpaces.push(space);
            }
        } else if (space && nextNextSpace && space.y > 0) {
            let sameHeight = (space.y >= (nextNextSpace.y - 10)) && (space.y <= (nextNextSpace.y + 10));

            let adjacent = (space.x + space.width) === nextNextSpace.x;
            if (sameHeight && adjacent) {
                // Spaces sind auf gleicher höhe und nebeneinander
                let y = space.y > nextNextSpace.y ? space.y : nextNextSpace.y;
                let mergedSpace = new Space(space.x, y, (space.width + nextNextSpace.width), space.height);
                // Neuen verbundenen Space hinzufügen.
                mergedSpaces.push(mergedSpace);
                // Übernächsten space löschen.
                originalSpaces[spaceKey] = null;
                originalSpaces[parseInt(spaceKey) + 2] = null;
            } else {
                keptSpaces.push(space);
            }
        } else {
            keptSpaces.push(space);
        }
    }

    mergedSpaces.push(...keptSpaces);
    return mergedSpaces;
}

function placeBox(box: Box): Box|null {

    let spaceScores = [];

    for (let spaceKey in (window as any).spaces) {
        let currentSpace = (window as any).spaces[spaceKey];
        // Den score für diese Box/Space kombination ermitteln
        // damit wir später wissen welcher Space optimal für die Box ist.
        spaceScores[spaceKey] = getSpaceScore(box, currentSpace);
    }

    // Key von dem optimalen Space ermitteln (höchster Score).
    let bestSpaceKey = spaceScores.indexOf(Math.max(...spaceScores));
    let bestSpace = (window as any).spaces[bestSpaceKey];
    let score = spaceScores[bestSpaceKey];

    if (0 === score) {
        // Box konnte nicht platziert werden da kein Space groß genug ist.
        return null;
    }
    
    // Box übernimmt den x und y Wert des Space.
    box.x = bestSpace.x;
    box.y = bestSpace.y;

    // Jetzt müssen wir schauen was von dem Space übrig ist.
    if (score === 1) {
        // Nix ist von dem Space übrig. 100% genutzt.
        // Es werden keine neuen Lücken erzeugt.
    } else {
        // Neue Rest-Spaces ermitteln.
        if (box.height < bestSpace.height) {
            // Box ist flacher als der Space.
            // Unten entsteht eine Lücke.
            let x = bestSpace.x; // X entspricht dem x des Space da die Box immer Links Oben im Space platziert wird.
            let y = bestSpace.y + box.height; // y ist der y-Wert des Space + der Höhe die die Box wegnimmt.
            let width = box.width; // Die Lücke ist nur so breit wie die Box.
            let height = bestSpace.height - box.height; // Die Resthöhe ergibt sich auf der Höhe des Space minus der Höhe der Box.
            let newSpace = new Space(x, y, width, height);
            // Neuen Space zur Liste der Spaces hinzufügen.
            (window as any).spaces.push(newSpace);
        }
        if (box.width < bestSpace.width) {
            // Box ist schmaler als der Space.
            // Rechts von der Box entsteht eine Lücke bis nach Unten.
            let x = bestSpace.x + box.width;
            let y = bestSpace.y;
            let width = bestSpace.width - box.width;
            let height = bestSpace.height;
            let newSpace = new Space(x, y, width, height);
            // Neuen Space zur Liste der Spaces hinzufügen.
            (window as any).spaces.push(newSpace);
        }
    }

    // Original space löschen.
    (window as any).spaces[bestSpaceKey] = null;

    // Benachbarte spaces zusammenführen.
    (window as any).spaces = mergeSpaces((window as any).spaces);

    // Fertige box zurückgeben.
    return box;
}

// Sort pending boxes by size.
// Biggest first.
pendingBoxes = pendingBoxes.sort((a, b) => (a.area > b.area) ? 1 : -1);
pendingBoxes = pendingBoxes.reverse();

for (let boxIndex in pendingBoxes) {
    let currentBox = pendingBoxes[boxIndex];

    // Aktuelle Box plazieren.
    let completedBox = placeBox(currentBox);

    if (null === completedBox) {
        // Box konnte in keinen Space platziert werden.
    } else {
        // Zur Liste der ferig platzierten Boxen hinzufügen.
        completedBoxes[boxIndex] = completedBox;
        // Aus Liste der unplazierten Boxen entfernen.
        delete pendingBoxes[boxIndex];
    }
}

let canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
canvasElement.style.background = 'grey';
canvasElement.width = 1360;
canvasElement.height = 240;

let canvas = canvasElement.getContext('2d');
canvas.clearRect(0, 0, 1360, 240);

for (let boxKey in completedBoxes)
{
    let box = completedBoxes[boxKey];
    setTimeout(() => {
        canvas.beginPath();
        canvas.rect(box.x, box.y, box.width, box.height);
        canvas.lineWidth = 2;
        canvas.strokeStyle = '#000000';
        canvas.closePath();
        canvas.stroke();
        canvas.fillStyle = '#ffffff';
        canvas.fillRect(box.x, box.y, box.width, box.height);
        console.log('draw box '+boxKey, box);
    }, (boxKey as any) * 0);
}
