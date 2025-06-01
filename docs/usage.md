# 📘**Usage Instructions**

This guide explains how to use `lattice.js` to visualize concept lattices from your own data, either by uploading JSON files directly or by converting datasets generated using the Python `concepts` library.

---

##  🧩 Input Format
The tool accepts a concept lattice in JSON format containing:

```json
{
  "nodes": [
    { "id": "Concept1","label": "Extent{A, B}\\nIntent{X}", "level": 1 },
    { "id": "Concept2", "label": "Extent{A, B}\\nIntent{X}" , "level": 2 }
  ],
  "links": [
    { "source": "Concept1", "target": "Concept2" }
  ]
}
```
ℹ️ Make sure your JSON structure includes both nodes and links.Each node must include:
- `id`: Unique identifier of the concept.
- `label`: String that includes extent and intent, separated by `\n`.
- `level`: Integer value used for vertical layout in the lattice.

---
## 📂 Uploading Your Dataset

Save your lattice data in JSON format using the structure shown above.

- Place the file in the `data` folder or select it from your desktop during upload.
- Start the application locally (see **Testing** section in `README.md`).
- Navigate to the interface at `examples/frontpage` or the root page.
- Use the **“Upload JSON File”** button to load your dataset.
- Click **“Load JSON File”** to render the graph.

---
## 🔄 Converting from Python `concepts` Library

If you're using the Python `concepts` package to compute your concept lattice, you can convert it to the required JSON format using the **"Convert and Download"** button if needed. Once converted, you can upload and visualize your dataset using `lattice.js`.


---
## 🧪 Features Available During Use

- **Interactive Dragging**: Manually move nodes for better readability.
- **Zoom & Pan**: Navigate large lattices using scroll or trackpad.
- **Labeling Modes**:
  - ID only (default)
  - Full (extent + intent)
  - Reduced (each object/attribute shown only once)
- **Tooltip Support**: Hover on nodes to see details like ID, extent, and intent.
- **Selected Node Details** – Clicking a node reveals its full concept information below the concept lattice.
- **Filtering** – Color-codes nodes based on whether their extent and/or intent matches user-defined criteria.
- **Export Options**:
  - `.json` for structure
  - `.png` image
  - `.csv` table
  - `.pdf` document
  - `.slf` (formal concept lattice format)




