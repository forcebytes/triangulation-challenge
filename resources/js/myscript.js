const TRIANGLES_TO_COMPLETE = 2;
const VERTEX_COLORS = ['red', 'blue', 'yellow'];
// initializations
var points = [];
var delaunay = Delaunator.from(points);
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var padding = 5;
var w = 1024;
var ratio = 1;
var minX = Infinity;
var minY = Infinity;
var maxX = -Infinity;
var maxY = -Infinity;
var h = 1024;

ctx.lineJoin = 'round';
ctx.lineCap = 'round';

generateAndDraw();

function generateAndDraw() {
  var warning = document.getElementById('no-triangles');
  warning.style.display = 'none';
  
  var amount = +document.getElementById('vertexAmount').value;
  
  // generate new points and run delaunay
  generatePoints(amount);
  delaunay = Delaunator.from(points);

  // reset canvas and draw
  ctx.clearRect(0, 0, w, h);
  configureCanvas();

  draw();
}

function configureCanvas() {
  for (var i = 0; i < points.length; i++) {
    var x = points[i][0];
    var y = points[i][1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  h = (w - 2 * padding) * (maxY - minY) / (maxX - minX) + 2 * padding;

  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  canvas.width = w;
  canvas.height = h;

  if (window.devicePixelRatio >= 2) {
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);
  }

  ratio = (w - 2 * padding) / Math.max(maxX - minX, maxY - minY);
}

function getX(i) {
  return padding + ratio * (points[i][0] - minX);
}
function getY(i) {
  return padding + ratio * (points[i][1] - minY);
}

function generatePoints(amount) {
  points = [];
  // generate coordinates
  // x: 0 - 400, y: 0 - 250
  for (var i = 0; i < amount; i++) {
    points.push([Math.random() * 400, Math.random() * 250]);
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h);

  var triangles = delaunay.triangles;

  // Draw triangles
  ctx.beginPath();
  for (let i = 0; i < triangles.length; i += 3) {
    var p0 = triangles[i];
    var p1 = triangles[i + 1];
    var p2 = triangles[i + 2];
    ctx.moveTo(getX(p0), getY(p0));
    ctx.lineTo(getX(p1), getY(p1));
    ctx.lineTo(getX(p2), getY(p2));
    ctx.closePath();
  }
  ctx.strokeStyle = 'lightgray';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Draw hull
  ctx.beginPath();
  for (const i of delaunay.hull) {
    ctx.lineTo(getX(i), getY(i));
  }
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'green';
  ctx.stroke();

  // Draw vertices
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();

    ctx.arc(getX(i), getY(i), 3, 0, 2 * Math.PI);
    ctx.closePath();

    // Determine if the vertex is on the hull and style accordingly
    if (isVertexOnHull(i)) {
      var colorIndex = Math.floor(Math.random() * VERTEX_COLORS.length);
      ctx.strokeStyle = VERTEX_COLORS[colorIndex];
      ctx.fillStyle = VERTEX_COLORS[colorIndex];
      
    } else {
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = 'black';
    }

    ctx.fill();
    ctx.stroke();
  }

  completeTriangles();
}

// Complete triangle algorithm:
// Do the following until we reached the number of completed triangles (2 in this case)
// - get a triangle
// - for each vertex of the triangle, check how many completed triangles there will be if vertex is
//   filled out
// - if total number completed triangles <= amount of required completed triangles, color it
//    - if false, find another triangle

function completeTriangles() {
  const completedTriangles = []; // completed triangles have all vertices colored
  const triangles = groupDelaunayTriangles();
  let i = 0;

  // Check for triangles where all vertices are on the hull. These are completed triangles
  for (const triangle of triangles) {
    if (isVertexOnHull(triangle[0]) && isVertexOnHull(triangle[1]) && isVertexOnHull(triangle[2])) {
      completedTriangles.push(triangle);
    }
  }

  // loop through all the triangles to find 2 completed triangles
  while (i < triangles.length && completedTriangles.length < 2) {
    const triangle = triangles[i];

    // Determine how many triangles will be completed if current triangle is colored
    let trianglesCopy = triangles.slice(); // To prevent double counting, copy triangles array and remove current triangle
    trianglesCopy.splice(i, 1);
    const potentialTriangles = determineCompletedTriangles(triangle, completedTriangles, trianglesCopy);
    
    // complete (color) current and potential triangles if it does not exceed the number of triangles to complete (2)
    // do not re-add already completed triangles
    // the +1 in the if condition is to include the current triangle in the count
    if ((potentialTriangles.length + completedTriangles.length + 1)<= TRIANGLES_TO_COMPLETE && completedTriangles.indexOf(triangle) == -1) {
      completedTriangles.push(triangle);  
      // color vertices
      colorTriangle(triangle);

      // Add potential triangles to completed list
      for (const triangleToComplete of potentialTriangles) {
        if (completedTriangles.indexOf(triangleToComplete) == -1) {
          completedTriangles.push(triangleToComplete);
          colorTriangle(triangleToComplete);
        }
      }

      // Reset iteration to account for new colored vertices
      i = -1;
    }

    // Break out if we have the requried number of completed triangles
    if (completedTriangles.length == TRIANGLES_TO_COMPLETE) {
      break;
    }

    i++;
  }

  if (completedTriangles.length < TRIANGLES_TO_COMPLETE) {
    // With the given polygon and points inside, unable to find required completed triangles
    var warning = document.getElementById('no-triangles');
    warning.style.display = 'inline';
  }
}

// Determine how many triangles will be copleted with given triangle is completed
// For each vertex of given triangle, count how many completed triangles from coloring the vertex
// TODO: unit test
function determineCompletedTriangles(currentTriangle, completedTriangles, triangles) {
  const potentialTriangles = [];
  const completedVertices = completedTriangles.flat();

  // Get all neighboring triangles (triangles that share at least 1 vertex with current triangle)
  const neighbors = [];
  triangles.forEach(triangle => {
    if (currentTriangle.indexOf(triangle[0]) >= 0 || currentTriangle.indexOf(triangle[1]) >= 0
      || currentTriangle.indexOf(triangle[2]) >= 0) {
        neighbors.push(triangle);
    }
  });

  // for each neighbor check if all vertices are:
  // - on the hull;
  // - part of an already completed triangle; or
  // - part of current triangle
  // if any mentioned conditions hold true for all vertices, it is a potential triangle
  neighbors.forEach(triangle => {
    const potentialVertex1 = isPotentialCompletedVertex(triangle[0], completedVertices, currentTriangle);
    const potentialVertex2 = isPotentialCompletedVertex(triangle[1], completedVertices, currentTriangle);
    const potentialVertex3 = isPotentialCompletedVertex(triangle[2], completedVertices, currentTriangle);

    if (potentialVertex1 && potentialVertex2 && potentialVertex3) {
      potentialTriangles.push(triangle);
    }
  });

  return potentialTriangles;
}


// Helper functions

// Convert the flat Delaunay.triangles array to 
// an array of grouped indices
function groupDelaunayTriangles() {
  const triangles = [];
  const delaunayTriangles = delaunay.triangles;

  for (let i = 0; i < delaunayTriangles.length; i += 3) {
    triangles.push([
      delaunayTriangles[i],
      delaunayTriangles[i + 1],
      delaunayTriangles[i + 2]
    ]);
  }

  return triangles;
}

function colorTriangle(triangle) {
  // If a vertex is on the hull, it is colored already
  if (!isVertexOnHull(triangle[0])) {
    colorVertex(triangle[0]);
  }

  if (!isVertexOnHull(triangle[1])) {
    colorVertex(triangle[1]);
  }

  if (!isVertexOnHull(triangle[2])) {
    colorVertex(triangle[2]);
  }
}

function colorVertex(index) {
  ctx.beginPath();
  ctx.arc(getX(index), getY(index), 3, 0, 2 * Math.PI);
  ctx.closePath();
  var colorIndex = Math.floor(Math.random() * VERTEX_COLORS.length);
  ctx.strokeStyle = VERTEX_COLORS[colorIndex];
  ctx.fillStyle = VERTEX_COLORS[colorIndex];
  
  ctx.fill();
  ctx.stroke();
}

function isPotentialCompletedVertex(vertex, completedVertices, currentTriangle) {
  return (delaunay.hull.indexOf(vertex) >= 0 || completedVertices.indexOf(vertex) >= 0 
    || currentTriangle.indexOf(vertex) >= 0);
}

function isVertexOnHull(index) {
  if (delaunay.hull.indexOf(index) >= 0) {
    return true;
  }

  return false;
}