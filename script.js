// ============================================
// STATE
// We keep one source of truth: an array of
// attendance records. The table on screen is
// just a *rendering* of this array — never
// edit the DOM directly without updating this
// array first, or they'll get out of sync.
// ============================================
const STORAGE_KEY = 'attendanceRecords';

let records = loadRecords();

// ============================================
// PERSISTENCE
// localStorage only stores strings, so we
// JSON.stringify on save and JSON.parse on load.
// ============================================
function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    // If the stored data is ever corrupted, fail
    // safe with an empty list instead of crashing
    // the whole page.
    console.error('Failed to load attendance records:', err);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ============================================
// DOM REFERENCES
// Grab everything once, at the top, instead of
// re-querying the DOM every time we need it.
// ============================================
const form = document.getElementById('attendanceForm');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');
const studentIdError = document.getElementById('studentIdError');
const studentNameError = document.getElementById('studentNameError');
const formStatus = document.getElementById('formStatus');
const tableBody = document.getElementById('attendanceTableBody');
const countBadge = document.getElementById('countBadge');
const emptyState = document.getElementById('emptyState');

// ============================================
// VALIDATION
// Returns true/false AND writes the error message,
// so the calling code doesn't need to know *why*
// it failed, just whether it did.
// ============================================
function validate() {
  let isValid = true;

  const id = studentIdInput.value.trim();
  const name = studentNameInput.value.trim();

  studentIdError.textContent = '';
  studentNameError.textContent = '';

  if (id === '') {
    studentIdError.textContent = 'Student ID is required.';
    isValid = false;
  }

  if (name === '') {
    studentNameError.textContent = 'Name is required.';
    isValid = false;
  }

  // Prevent the same student checking in twice today.
  // Without this, a student could accidentally (or
  // deliberately) submit multiple rows for themselves.
  const alreadyCheckedIn = records.some(r => r.id === id);
  if (isValid && alreadyCheckedIn) {
    studentIdError.textContent = 'This ID has already checked in today.';
    isValid = false;
  }

  return isValid;
}

// ============================================
// RENDERING
// Rebuilds the entire table from `records`.
// For a small classroom list (dozens of rows),
// re-rendering everything on each change is
// simpler and safer than surgically patching
// the DOM — optimize only if this ever becomes
// a real performance problem.
// ============================================
function render() {
  tableBody.innerHTML = '';

  records.forEach((record, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="cell-id">${escapeHtml(record.id)}</td>
      <td>${escapeHtml(record.name)}</td>
      <td>${record.time}</td>
      <td><span class="stamp">PRESENT</span></td>
    `;
    tableBody.appendChild(row);
  });

  countBadge.textContent = `(${records.length})`;
  emptyState.style.display = records.length === 0 ? 'block' : 'none';
}

// Basic protection: if a student ever typed HTML/script
// characters into the name field, this stops it from
// being interpreted as real markup when rendered.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// EVENT HANDLING
// ============================================
form.addEventListener('submit', (event) => {
  event.preventDefault(); // stop the browser's default full-page reload

  if (!validate()) {
    formStatus.textContent = '';
    return;
  }

  const record = {
    id: studentIdInput.value.trim(),
    name: studentNameInput.value.trim(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  records.push(record);
  saveRecords();
  render();

  formStatus.textContent = `${record.name} marked present.`;
  form.reset();
  studentIdInput.focus(); // ready for the next student immediately
});

// ============================================
// INITIAL RENDER
// Show whatever was already saved from a
// previous session as soon as the page loads.
// ============================================
render();