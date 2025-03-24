## 🛠️**Usage**
1. Add your dataset in JSON format to the data directory.
2. Launch the application and navigate to the frontpage.
3. Use the Upload JSON File section to upload your dataset.
4. Click "Load JSON File" to visualize your concept lattice.
5. Optionally, convert custom formats using the "Convert and Download" button if needed.

   ```
## 📂 Example dataset
Save the following as a JSON file (e.g., data/your-dataset.json):
```bash
{
  "nodes": [
    { "id": "Concept1","label": "Extent{A, B}\\nIntent{X}", "level": 1 },
    { "id": "Concept2", "label": "Extent{A, B}\\nIntent{X}" , "level": 2 }
  ],
  "links": [
    { "source": "Concept1", "target": "Concept2" }
  ]
}

ℹ️ Make sure your JSON structure includes both nodes and links. Each node should have an id, label, and level.
```

