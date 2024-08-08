const storageKey = "expenseTrackerData";

function saveData(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function loadData() {
  const data = localStorage.getItem(storageKey);
  return data ? JSON.parse(data) : { expenses: [] };
}
