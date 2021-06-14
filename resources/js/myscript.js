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

  completeTriangles1();
}

// Complete triangle algorithm:
// Do the following until we reached the number of completed triangles (2 in this case)
// - get a triangle
// - for each vertex of the triangle, check how many completed triangles there will be if vertex is
//   filled out
// - if total number completed triangles <= amount of required completed triangles, color it
//    - if false, find another triangle

function completeTriangles1() {
  const completedTriangles = []; // completed triangles have all vertices colored
  const triangles = groupDelaunayTriangles();
  let i = 0;

  while (i < triangles.length && completedTriangles.length < 2) {
    const triangle = triangles[i];

    // Determine how many triangles will be completed if current triangle is colored
    let trianglesCopy = triangles.slice(); // To prevent double counting, copy triangles array and remove current triangle
    trianglesCopy.splice(i, 1);
    const potentialTriangles = determineCompletedTriangles(triangles[i], completedTriangles, trianglesCopy);
    
    // complete current and potential triangles if it does not exceed the number of triangles to complete
    // the +1 in the if condition is to include the current triangle
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

      // With new completed triangles, reset iteration to account for new colored vertices
      i = -1;
    }

    // Break out if we have the requried number of completed triangles
    if (completedTriangles.length == TRIANGLES_TO_COMPLETE) {
      break;
    }

    i++;
  }

  if (completedTriangles.length < TRIANGLES_TO_COMPLETE) {
    var warning = document.getElementById('no-triangles');
    warning.style.display = 'inline';
  }
}

// Determine how many triangles will be copleted with given triangle is completed
// For each vertex of given triangle, count how many completed triangles from coloring the vertex
function determineCompletedTriangles(currentTriangle, completedTriangles, triangles) {
  const potentialTriangles = [];
  const completedVertices = completedTriangles.flat();

  for (const vertex of currentTriangle) {
    // Get all triangles that shares the vertex
    const candidates = [];
    triangles.forEach(triangle => {
      if (triangle.indexOf(vertex) >= 0) {
        candidates.push(triangle);
      }
    });

    // Of these candidates, keep triangles that are completed if vertex is colored
    for (const triangle of candidates) {
      let otherVertices = triangle.slice();
      otherVertices.splice(triangle.indexOf(vertex), 1)

      // if other vertices of the triangle are already colored, then coloring vertex will complete the triangle
      if ((completedVertices.indexOf(otherVertices[0]) >= 0 || delaunay.hull.indexOf(otherVertices[0]) >= 0) &&
        (completedVertices.indexOf(otherVertices[1]) >= 0 || delaunay.hull.indexOf(otherVertices[1]) >= 0)) {
        potentialTriangles.push(triangle);
      }
    }
    
  }

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

function isVertexOnHull(index) {
  if (delaunay.hull.indexOf(index) >= 0) {
    return true;
  }

  return false;
}