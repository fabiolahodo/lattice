
# 🛠️**Examples**

This page showcases a set of example visualizations and use cases using `lattice.js`. These examples demonstrate different labeling modes, filtering, and layout strategies supported by the library.

## 🔹 Example 1: Basic Lattice gender-age example

|        | Female | Juvenile | Adult | Male |
|--------|--------|----------|--------|------|
| Girl   | x      | x        |        |      |
| Woman  | x      |          | x      |      |
| Boy    |        | x        |        | x    |
| Man    |        |          | x      | x    |

Below are two concept lattices derived from the same formal context. The left shows full labeling, and the right shows reduced labeling.

| Full Labeling | Reduced Labeling |
|------------------|------------------|
| ![Default Labeling](./screenshots/gender-age-full-labeling.png) | ![Reduced Labeling](./screenshots/gender-age-reduced-labeling.png)|

## 🔹 Example 2: Building Regulations

|       | roof | stairs | stairwell | windows | chimney | cellar<br>floor | fire<br>door | foundation | front<br>door |
|-------|------|--------|-----------|---------|---------|------------------|--------------|------------|----------------|
| §15   | x    | x      | x         | x       | x       | x                |              | x          |                |
| §16   | x    |        |           |         | x       |                  |              |            |                |
| §17   | x    | x      | x         |         | x       |                  | x            |            |                |
| §18.1 | x    |        | x         | x       | x       | x                |              |            |                |
| §18.2 | x    | x      | x         | x       |         |                  |              |            | x              |
| §31   | x    |        |           |         |         |                  |              |            | x              |
| §32   |      | x      | x         | x       |         |                  |              |            |                |
| §33   |      | x      |           |         |         |                  |              |            |                |
| §36   |      |        |           | x       |         |                  |              |            |                |

The following visualizations are based on a formal context of building regulations. On the left, we see the default concept lattice. On the right, the filtering feature is demonstrated for the object **§15** and attribute **roof**, highlighting relevant concepts with tooltips enabled.

| Default Lattice | Filtered by "roof" |
|------------------|--------------------|
| ![Default](./screenshots/law-regulations-for-buildings.jpg) | ![Filtered](./screenshots/law-regulations-for-buildings-filter-(15-roof)-tooltip.png) |
