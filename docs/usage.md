## 🛠️**Usage**
1. Add your dataset in JSON format to the data directory.
2. Update the `<script>` tag in `index.html` to point to your dataset:
   ```bash
      <script type="module" src="dist/bundle.js" data-dataset="data/your-dataset.json"></script>

   ```
## 📂 Example dataset
Save the following as a JSON file (e.g., data/your-dataset.json):
```bash
{
  "nodes": [
    { "id": "Concept1", "level": 1 },
    { "id": "Concept2", "level": 2 }
  ],
  "links": [
    { "source": "Concept1", "target": "Concept2" }
  ]
}
```

