// Global data structure to hold cell formulas and values
let cellData = {};

// Keep track of the selected cell
let selectedCell = null;

// Called when a cell is clicked – highlight it and set formula bar value.
function selectCell(cell) {
  if (selectedCell) {
    selectedCell.classList.remove('selected');
  }
  selectedCell = cell;
  cell.classList.add('selected');
  document.getElementById('formulaInput').value = cellData[cell.id] && cellData[cell.id].formula ? cellData[cell.id].formula : cell.innerText;
}

// Called when a cell loses focus after edit.
function cellUpdated(cell) {
  let value = cell.innerText.trim();
  // If the cell starts with '=' assume it’s a formula.
  if (value.startsWith('=')) {
    // Store formula
    cellData[cell.id] = { formula: value, value: evaluateFormula(value.slice(1)) };
    cell.innerText = cellData[cell.id].value;
  } else {
    cellData[cell.id] = { formula: null, value: value };
  }
  recalcAll();
}

// Apply the formula entered in the formula bar to the selected cell.
function applyFormula() {
  if (selectedCell) {
    let formula = document.getElementById('formulaInput').value;
    selectedCell.innerText = formula;
    cellUpdated(selectedCell);
  }
}

// Evaluate simple formulas (supports SUM, AVERAGE, MAX, MIN, COUNT)
// This is a very basic parser. For example, =SUM(A1:A3)
function evaluateFormula(formula) {
  // Example: SUM(A1:A3)
  let functionMatch = formula.match(/^(\w+)\((.+)\)$/);
  if (!functionMatch) return "ERR";
  let func = functionMatch[1].toUpperCase();
  let range = functionMatch[2];

  // Get list of cell ids from the range (assumes simple A1:A3 style)
  let cells = parseRange(range);
  let values = cells.map(id => {
    let v = cellData[id] ? cellData[id].value : document.getElementById(id).innerText;
    return parseFloat(v) || 0;
  });
  
  switch(func) {
    case 'SUM':
      return values.reduce((a,b)=>a+b,0);
    case 'AVERAGE':
      return values.reduce((a,b)=>a+b,0) / values.length;
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
    case 'COUNT':
      return values.filter(v => !isNaN(v) && v !== 0).length;
    case 'TRIM':  // Data quality functions
      // Apply to first cell in range for demo purposes.
      return (document.getElementById(cells[0]).innerText || "").trim();
    case 'UPPER':
      return (document.getElementById(cells[0]).innerText || "").toUpperCase();
    case 'LOWER':
      return (document.getElementById(cells[0]).innerText || "").toLowerCase();
    default:
      return "FUNC_ERR";
  }
}

// Helper function to parse a range string like A1:A3 into an array of cell ids.
function parseRange(rangeStr) {
  let cells = [];
  // Check for a range indicated by colon e.g., A1:A3
  if (rangeStr.includes(':')) {
    let [start, end] = rangeStr.split(':');
    let startCol = start.charCodeAt(0);
    let startRow = parseInt(start.slice(1));
    let endCol = end.charCodeAt(0);
    let endRow = parseInt(end.slice(1));
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        cells.push(String.fromCharCode(c) + r);
      }
    }
  } else {
    cells.push(rangeStr);
  }
  return cells;
}

// Recalculate all formulas – a simple approach to update dependencies.
function recalcAll() {
  for (let cellId in cellData) {
    let cell = document.getElementById(cellId);
    if (cellData[cellId].formula) {
      // Re-evaluate formula.
      let newValue = evaluateFormula(cellData[cellId].formula.slice(1));
      cellData[cellId].value = newValue;
      cell.innerText = newValue;
    }
  }
}

// Toggle formatting (bold, italic) on the selected cell.
function toggleFormat(format) {
  if (!selectedCell) return;
  selectedCell.classList.toggle(format);
}

// Set font size for the selected cell.
function setFontSize(size) {
  if (!selectedCell) return;
  selectedCell.style.fontSize = size;
}

// Set font color for the selected cell.
function setFontColor(color) {
  if (!selectedCell) return;
  selectedCell.style.color = color;
}

// Add a new row at the end.
function addRow() {
  let table = document.getElementById('spreadsheet').getElementsByTagName('tbody')[0];
  let newRow = table.insertRow();
  let rowIndex = table.rows.length;
  // Add row header
  let th = document.createElement('th');
  th.innerText = rowIndex;
  newRow.appendChild(th);
  // Add cells equal to current number of columns.
  let colCount = document.getElementById('spreadsheet').rows[0].cells.length - 1;
  for (let i = 0; i < colCount; i++) {
    let cell = newRow.insertCell();
    let cellId = String.fromCharCode(65 + i) + rowIndex;
    cell.id = cellId;
    cell.contentEditable = "true";
    cell.setAttribute('onclick', "selectCell(this)");
    cell.setAttribute('onblur', "cellUpdated(this)");
  }
}

// Add a new column at the end.
function addColumn() {
  let table = document.getElementById('spreadsheet');
  let colCount = table.rows[0].cells.length;
  let newColChar = String.fromCharCode(65 + colCount - 1);
  // Add header for new column.
  let th = document.createElement('th');
  th.innerText = newColChar;
  table.rows[0].appendChild(th);
  // Add a cell in each row.
  for (let r = 1; r < table.rows.length; r++) {
    let cell = table.rows[r].insertCell();
    let cellId = newColChar + r;
    cell.id = cellId;
    cell.contentEditable = "true";
    cell.setAttribute('onclick', "selectCell(this)");
    cell.setAttribute('onblur', "cellUpdated(this)");
  }
}

// Apply data quality functions on the currently selected cell.
function applyDataQuality(func) {
  if (!selectedCell) return;
  let value = selectedCell.innerText;
  switch(func) {
    case 'trim':
      selectedCell.innerText = value.trim();
      break;
    case 'upper':
      selectedCell.innerText = value.toUpperCase();
      break;
    case 'lower':
      selectedCell.innerText = value.toLowerCase();
      break;
  }
  cellUpdated(selectedCell);
}

// Remove duplicate rows based on the content of all cells.
// (Simple implementation: scans table and removes any row with identical text content)
function removeDuplicates() {
  let table = document.getElementById('spreadsheet').getElementsByTagName('tbody')[0];
  let seen = {};
  for (let i = table.rows.length - 1; i >= 0; i--) {
    let rowText = table.rows[i].innerText;
    if (seen[rowText]) {
      table.deleteRow(i);
    } else {
      seen[rowText] = true;
    }
  }
}

// Find and replace function across the entire spreadsheet.
function findAndReplace() {
  let findText = prompt("Enter text to find:");
  if (findText === null) return;
  let replaceText = prompt("Enter replacement text:");
  let cells = document.querySelectorAll("#spreadsheet td");
  cells.forEach(cell => {
    if (cell.innerText.indexOf(findText) !== -1) {
      cell.innerText = cell.innerText.split(findText).join(replaceText);
      cellUpdated(cell);
    }
  });
}
