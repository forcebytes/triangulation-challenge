# Polygon Triangulation

## Description

This is my attempt with the coding challenge to complete no more than 2 triangles in a triangulated polygon. The solution I came up with goes like this:

- Pick a triangle in the polygon
- On each vertex of the given triangle, count how many triangles will be potentially completed if the vertex is colored
- If the sum of these potentially completed triangles is greater than the required number of completed trianges (in this case 2), find another triangle and repeat earlier steps. However, if this count is less than the requried number, complete the given triangle and 
 - Repeat earlier steps until only two triangles are completed

## Resources

For research, I used the following resources:
- https://en.wikipedia.org/wiki/Polygon_triangulation
- https://cs.gmu.edu/~jmlien/teaching/cs499-GC/uploads/Main/note02.pdf
- https://sites.cs.ucsb.edu/~suri/cs235/Triangulation.pdf
- https://mathworld.wolfram.com/DelaunayTriangulation.html
- https://www.mathworks.com/help/matlab/math/delaunay-triangulation.html?s_tid=srchtitle

For implementation, I used Mapbox's Delaunator library (https://github.com/mapbox/delaunator) for development.

## Time

15 hours. 4 hours was spent on research and the remaining time was spent on coding and developing the solution

## Improvements

Because the delaunator library is written using javascript, the solution was done using javascript. Since all the data structures are not strongly typed, having arrays and nested to represent vertices and triangles. This makes readability and organization of the code a little difficult. For improvement, I would use typescript and create an interface to work with the library. This would also include building out objects (e.g. - a triangle and vertex class) which then can be used to replace the various arrays and nested arrays.

## Installation and Execution

Simply clone the repository and run index.html on a browser.