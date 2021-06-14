# Polygon Triangulation

## Description

This is my attempt with the coding challenge to complete no more than 2 triangles in a triangulated polygon. With a given polygon that has been triangulated, the solution I came up with follows:

1) Pick a triangle in the polygon
2) On each vertex (corner) of the given triangle, count how many triangles will be potentially be completed if the vertex is colored. Get the total number of potentially completed triangles
3) If the total number of these potentially completed triangles is greater than the required number of completed trianges (in this case 2), find another triangle and repeat steps 1 and 2. However, if this count is less than or equal to the requried number, complete the given triangle and any potentially completed triangles discovered. Keep track of how many triangles that have been completed so far.
4) Repeat steps 1-3 until only two triangles are completed

## Resources

For research, I used the following resources:
- https://en.wikipedia.org/wiki/Polygon_triangulation
- https://cs.gmu.edu/~jmlien/teaching/cs499-GC/uploads/Main/note02.pdf
- https://sites.cs.ucsb.edu/~suri/cs235/Triangulation.pdf
- https://mathworld.wolfram.com/DelaunayTriangulation.html
- https://www.mathworks.com/help/matlab/math/delaunay-triangulation.html?s_tid=srchtitle

For implementation, I used Mapbox's Delaunator library (https://github.com/mapbox/delaunator) for development.

## Time

18 hours. 4 hours was spent on research and the remaining time was spent on coding and developing the solution

## Improvements

Because the delaunator library is written using javascript, the solution was done using javascript. Since all the data structures are not strongly typed, having arrays and nested to represent vertices and triangles. This makes readability and organization of the code a little difficult. For improvement, I would use typescript and create an interface to work with the library. This would also include building out objects (e.g. - a triangle and vertex class) which then can be used to replace the various arrays and nested arrays and creating functions to convert the nested arrays into proper object arrays.

## Installation and Execution

Simply clone the repository and open index.html on a browser.
