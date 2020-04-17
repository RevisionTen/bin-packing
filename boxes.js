var Space = /** @class */ (function () {
    function Space(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.area = width * height;
    }
    return Space;
}());
var Box = /** @class */ (function () {
    function Box(width, height) {
        this.width = width;
        this.height = height;
        this.area = width * height;
    }
    return Box;
}());
window.spaces = [
    // Erster Space ist der Container.
    new Space(0, 0, 1360, 240)
];
var pendingBoxes = [
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
];
var completedBoxes = [];
function rotateBox(box) {
    var width = box.width;
    var height = box.height;
    box.height = width;
    box.width = height;
    return box;
}
// Methode die einen float zurückgibt der besagt wie gut die Box den Space ausnutzt.
// Gibt 0 zurück wenn die Box garnicht in den Space passt.
function getSpaceScore(box, space) {
    if (null === space) {
        return 0;
    }
    if (box.width <= space.width && box.height <= space.height) {
        // Box fits.
    }
    else if (box.height <= space.width && box.width <= space.height) {
        // Box fits rotated.
        box = rotateBox(box);
    }
    else {
        // Box does not fit.
        return 0;
    }
    return box.area / space.area;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function mergeSpaces(originalSpaces) {
    var mergedSpaces = [];
    var keptSpaces = [];
    // Gelöschte spaces entfernen.
    originalSpaces = originalSpaces.filter(notEmpty);
    // Spaces nach y koordinate sortieren.
    originalSpaces = originalSpaces.sort(function (a, b) { return (a.y > b.y) ? 1 : -1; });
    for (var spaceKey in originalSpaces) {
        var space = originalSpaces[spaceKey];
        var nextSpace = originalSpaces[parseInt(spaceKey) + 1];
        var nextNextSpace = originalSpaces[parseInt(spaceKey) + 2];
        if (space && nextSpace && space.y > 0) {
            var sameHeight = (space.y >= (nextSpace.y - 10)) && (space.y <= (nextSpace.y + 10));
            var adjacent = (space.x + space.width) === nextSpace.x;
            if (sameHeight && adjacent) {
                // Spaces sind auf gleicher höhe und nebeneinander
                var y = space.y > nextSpace.y ? space.y : nextSpace.y;
                var mergedSpace = new Space(space.x, y, (space.width + nextSpace.width), space.height);
                // Neuen verbundenen Space hinzufügen.
                mergedSpaces.push(mergedSpace);
                // Nächsten space löschen.
                originalSpaces[spaceKey] = null;
                originalSpaces[parseInt(spaceKey) + 1] = null;
            }
            else {
                keptSpaces.push(space);
            }
        }
        else if (space && nextNextSpace && space.y > 0) {
            var sameHeight = (space.y >= (nextNextSpace.y - 10)) && (space.y <= (nextNextSpace.y + 10));
            var adjacent = (space.x + space.width) === nextNextSpace.x;
            if (sameHeight && adjacent) {
                // Spaces sind auf gleicher höhe und nebeneinander
                var y = space.y > nextNextSpace.y ? space.y : nextNextSpace.y;
                var mergedSpace = new Space(space.x, y, (space.width + nextNextSpace.width), space.height);
                // Neuen verbundenen Space hinzufügen.
                mergedSpaces.push(mergedSpace);
                // Übernächsten space löschen.
                originalSpaces[spaceKey] = null;
                originalSpaces[parseInt(spaceKey) + 2] = null;
            }
            else {
                keptSpaces.push(space);
            }
        }
        else {
            keptSpaces.push(space);
        }
    }
    mergedSpaces.push.apply(mergedSpaces, keptSpaces);
    return mergedSpaces;
}
function placeBox(box) {
    var spaceScores = [];
    for (var spaceKey in window.spaces) {
        var currentSpace = window.spaces[spaceKey];
        // Den score für diese Box/Space kombination ermitteln
        // damit wir später wissen welcher Space optimal für die Box ist.
        spaceScores[spaceKey] = getSpaceScore(box, currentSpace);
    }
    // Key von dem optimalen Space ermitteln (höchster Score).
    var bestSpaceKey = spaceScores.indexOf(Math.max.apply(Math, spaceScores));
    var bestSpace = window.spaces[bestSpaceKey];
    var score = spaceScores[bestSpaceKey];
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
    }
    else {
        // Neue Rest-Spaces ermitteln.
        if (box.height < bestSpace.height) {
            // Box ist flacher als der Space.
            // Unten entsteht eine Lücke.
            var x = bestSpace.x; // X entspricht dem x des Space da die Box immer Links Oben im Space platziert wird.
            var y = bestSpace.y + box.height; // y ist der y-Wert des Space + der Höhe die die Box wegnimmt.
            var width = box.width; // Die Lücke ist nur so breit wie die Box.
            var height = bestSpace.height - box.height; // Die Resthöhe ergibt sich auf der Höhe des Space minus der Höhe der Box.
            var newSpace = new Space(x, y, width, height);
            // Neuen Space zur Liste der Spaces hinzufügen.
            window.spaces.push(newSpace);
        }
        if (box.width < bestSpace.width) {
            // Box ist schmaler als der Space.
            // Rechts von der Box entsteht eine Lücke bis nach Unten.
            var x = bestSpace.x + box.width;
            var y = bestSpace.y;
            var width = bestSpace.width - box.width;
            var height = bestSpace.height;
            var newSpace = new Space(x, y, width, height);
            // Neuen Space zur Liste der Spaces hinzufügen.
            window.spaces.push(newSpace);
        }
    }
    // Original space löschen.
    window.spaces[bestSpaceKey] = null;
    // Benachbarte spaces zusammenführen.
    window.spaces = mergeSpaces(window.spaces);
    // Fertige box zurückgeben.
    return box;
}
// Sort pending boxes by size.
// Biggest first.
pendingBoxes = pendingBoxes.sort(function (a, b) { return (a.area > b.area) ? 1 : -1; });
pendingBoxes = pendingBoxes.reverse();
for (var boxIndex in pendingBoxes) {
    var currentBox = pendingBoxes[boxIndex];
    // Aktuelle Box plazieren.
    var completedBox = placeBox(currentBox);
    if (null === completedBox) {
        // Box konnte in keinen Space platziert werden.
    }
    else {
        // Zur Liste der ferig platzierten Boxen hinzufügen.
        completedBoxes[boxIndex] = completedBox;
        // Aus Liste der unplazierten Boxen entfernen.
        delete pendingBoxes[boxIndex];
    }
}
var canvasElement = document.getElementById('canvas');
canvasElement.style.background = 'grey';
canvasElement.width = 1360;
canvasElement.height = 240;
var canvas = canvasElement.getContext('2d');
canvas.clearRect(0, 0, 1360, 240);
var _loop_1 = function (boxKey) {
    var box = completedBoxes[boxKey];
    setTimeout(function () {
        canvas.beginPath();
        canvas.rect(box.x, box.y, box.width, box.height);
        canvas.lineWidth = 2;
        canvas.strokeStyle = '#000000';
        canvas.closePath();
        canvas.stroke();
        console.log('draw box ' + boxKey, box);
    }, boxKey * 0);
};
for (var boxKey in completedBoxes) {
    _loop_1(boxKey);
}
