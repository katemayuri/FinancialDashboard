# 💼 CSCI 6406 Financial Visualization Dashboard

This project presents a comprehensive **financial data visualization dashboard** built using [**D3.js v7**](https://d3js.org/) and styled with the [**Material Dashboard 3**](https://www.creative-tim.com/product/material-dashboard) theme. The dashboard features multiple D3-based interactive charts for analyzing hierarchical ledger data, transaction patterns, and creditor balances.

---

## 🚀 Getting Started

### ▶️ Running the Project Locally

1. **Clone or Download** this repository to your local machine.
2. Open the folder in **Visual Studio Code**.
3. Install the **Live Server Extension** in VS Code if not already installed.
4. Right-click on `index.html` and choose **"Open with Live Server"**.
5. The dashboard will launch in your default browser.

> ✅ Recommended Browsers:  
> - Google Chrome  
> - Microsoft Edge  

---

## 📁 Project Folder Structure

```text
project-root/
│
├── 📂 assets/                      # Material Dashboard theme files
│   ├── css/                       # Core CSS styles
│   ├── fonts/                     # Custom fonts used
│   ├── img/                       # Static image assets
│   ├── js/                        # Theme JavaScript files
│   └── scss/                      # SCSS source files for styling
│
├── 📂 custom/                     # All D3.js visualization JavaScript components
│   ├── bubblechart.js
│   ├── dendrogram.js
│   ├── drilldownTable.js
│   ├── stackedArea.js
│   ├── sunburst.js
│   └── treemap.js
│
├── 📂 data/                       # JSON data files powering the visualizations
│   ├── creditors.json
│   └── ledger_data.json
│
├── 📄 index.html                 # Main dashboard HTML integrating all charts
├── 📄 README.md                  # Project overview and setup instructions
└── 📄 LICENSE.md                 # License file from Creative Tim for dashboard theme

---

## 📊 D3 Visualization Components

| Chart Type         | Description |
|--------------------|-------------|
| **Sunburst Chart** | Visualizes hierarchical ledger categories and subledgers. |
| **Treemap**        | Proportional view of creditors using normalized balances. |
| **Bubble Chart**   | Shows creditor influence using logarithmic scaled circles. |
| **Stacked Area Chart** | Time-based trend of credit amounts across ledgers. |
| **Drilldown Table**| Interactive ledger-wise table with expandable bar chart views. |
| **Grouped Bar Chart** | Credit vs. debit comparison per ledger upon table interaction. |
| **Dendrogram**     | Expandable hierarchical ledger tree with zoom/pan features. |

---

## 🧩 Technologies Used

- 📊 **D3.js v7** for all visualizations  
- 🧱 **Material Dashboard 3 (HTML Edition)** for layout and styling  
- 🧭 **HTML + CSS + JS (Vanilla)** – No framework dependencies  
- 🌐 **Live Server** (VS Code) for development  
- 📁 **JSON files** as static data source

---

## 📜 License & Attribution

- Theme License: [Material Dashboard 3](https://www.creative-tim.com/product/material-dashboard) by [Creative Tim](https://www.creative-tim.com/)
- Visualization code: Open for educational and non-commercial use under the course **CSCI 6406 - Data Visualization**.

---

## 🙌 Acknowledgements

This dashboard was developed as a part of the **CSCI 6406: Data Visualization** course project at Dalhousie University.

---

> Feel free to contribute, raise issues, or fork the project for your own financial visualization experiments!

