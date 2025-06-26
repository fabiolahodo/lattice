
# 🛠️**Examples**

This page showcases a set of example visualizations and use cases using `lattice.js`. These examples demonstrate different labeling modes, filtering, and layout strategies supported by the library.

## 📚 Example Overview

1. [Gender-Age Context](#-example-1-basic-lattice-gender-age-example)
2. [Building Regulations](#-example-2-building-regulations)
3. [Life in Water](#-example-3-life-in-water) 
3. [Linguistic Features from `concepts`](#-example-4-parsed-json-example-from-concepts-library)
4. [Zoo Dataset (Large Lattice)](#-example-5--zoo-dataset-large-concept-lattice)
   


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

---
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

The following visualizations are based on a formal context of building regulations. On the left, we see the default concept lattice. On the right, the filtering feature is demonstrated for the object **§15** and the attribute **roof**, highlighting relevant concepts. A tooltip is also shown for demonstration purposes.

In this view, nodes are color-coded based on filtering results:
- 🟠 **Orange**: match in both extent and intent  
- 🟢 **Green**: match in extent only  
- ⚫ **Grey**: match in intent only


| Default Lattice | Filtered by **§15** and "roof" |
|------------------|-------------------------------|
| ![Default](./screenshots/law-regulations-for-buildings.jpg) | ![Filtered](./screenshots/law-regulations-for-buildings-filter-(15-roof)-tooltip.png) |

---
## 🔹 Example 3: Life in Water

The following formal context relates to biological traits of animals and plants, including movement, habitat, and reproduction.

|              | needs water to live | lives in water | lives on land | needs chlorophyll | dicotyledon | monocotyledon | can move | has limbs | breast feeds |
|--------------|----------------------|----------------|----------------|--------------------|-------------|----------------|-----------|------------|----------------|
| fish leech   | x                    | x              |                |                    |             |                | x         |            |                |
| bream        | x                    | x              |                |                    |             |                | x         |            |                |
| frog         | x                    | x              | x              |                    |             |                | x         | x          |                |
| dog          | x                    |                | x              |                    |             |                | x         | x          | x              |
| water weeds  | x                    | x              |                | x                  |             |                |           |            |                |
| reed         | x                    | x              |                | x                  |             | x              |           |            |                |
| bean         | x                    |                |                | x                  | x           |                |           |            |                |
| corn         | x                    |                |                | x                  |             | x              |           |            |                |

---

Below is the concept lattice computed from the formal context above. A single tooltip is shown for demonstration purposes.
In this view, the selected node and the connected edges are colored red. 

  <div align="center">
  <img src="./screenshots/water-life.png" alt="Live in Water" width="550"/>
</div>

---
## 🔹 Example 4: Parsed JSON Example from `concepts` Library

This example is taken directly from the [concepts Python library documentation](https://concepts.readthedocs.io/en/stable/examples.html#example-json), demonstrating a formal context for linguistic agreement features (person, number, polarity).

The following table shows the original binary relation between personal pronouns and their grammatical features:

|      | +1 | -1 | +2 | -2 | +3 | -3 | +sg | +pl | -sg | -pl |
|------|----|----|----|----|----|-----|-----|-----|-----|-----|
| 1sg  | x  |    |    |    |    | x   | x   |     | x   |     |
| 1pl  | x  |    |    |    |    | x   |     | x   |     | x   |
| 2sg  |    | x  | x  |    |    |     | x   |     | x   |     |
| 2pl  |    | x  | x  |    |    |     |     | x   |     | x   |
| 3sg  |    |    |    | x  | x  |     | x   |     | x   |     |
| 3pl  |    |    |    | x  | x  |     |     | x   |     | x   |

---
The following concept lattice was automatically generated using our `lattice.js` parser, successfully converting the original `concepts` JSON format into our internal structure:

<div align="center">
  <img src="./screenshots/int.png" alt="Lattice for Parsed JSON" width="550"/>
</div>


---

✅ This confirms compatibility between `lattice.js` and external FCA tools like the `concepts` Python library.

---
## 🔹 Example 5: 🦓 Zoo Dataset: Large Concept Lattice

This example uses the [UCI Zoo dataset](https://archive.ics.uci.edu/dataset/111/zoo), which contains binary attributes for 80 animal species. The formal context was constructed by converting these attributes into a cross-table suitable for Formal Concept Analysis (FCA).

The generated concept lattice demonstrates the ability of `lattice.js` to handle large structures with multiple overlapping layers and a high density of concepts.

📊 **Dataset Statistics**
- **Total Concepts**: 214
- **Total Objects**: 80
- **Total Attributes**: 15

📷 **Visualization**

<div align="center">
  <img src="./screenshots/zoo-80x15.png" alt="Zoo concept lattice" width="850"/>
</div>

This example highlights the need for advanced features like reduced labeling, edge bundling, and zoom controls when visualizing dense lattices. It also shows that `lattice.js` remains responsive and readable even when scaled to over 200 concepts.

