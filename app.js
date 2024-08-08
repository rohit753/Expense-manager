document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const expenseForm = document.getElementById("expenseForm");
  const expenseList = document.getElementById("expenseList");
  const filterDate = document.getElementById("filterDate");
  const totalSpending = document
    .getElementById("totalSpending")
    .querySelector("p");
  const spendToday = document.getElementById("spendToday").querySelector("p");
  const spendSelectedDay = document
    .getElementById("spendSelectedDay")
    .querySelector("p");
  const periodicSpending = document.getElementById("periodicSpending");
  const ctx = document.getElementById("expenseChart").getContext("2d");
  let data = loadData();

  function renderExpenses(filterDate = null) {
    expenseList.innerHTML = "";
    const filteredExpenses = filterDate
      ? data.expenses.filter((expense) => expense.date === filterDate)
      : data.expenses;

    filteredExpenses.forEach((expense) => {
      const expenseItem = document.createElement("div");
      expenseItem.className = "expense-item";
      expenseItem.innerHTML = `<span>${expense.date}</span>
                                     <span>${expense.category}</span>
                                     <span>${expense.amount}</span>`;
      expenseList.appendChild(expenseItem);
    });
  }

  function renderAnalytics() {
    const today = new Date().toISOString().split("T")[0];
    const total = data.expenses.reduce(
      (acc, expense) => acc + expense.amount,
      0
    );
    const todayTotal = data.expenses
      .filter((expense) => expense.date === today)
      .reduce((acc, expense) => acc + expense.amount, 0);
    const selectedDateTotal = filterDate.value
      ? data.expenses
          .filter((expense) => expense.date === filterDate.value)
          .reduce((acc, expense) => acc + expense.amount, 0)
      : 0;
    const monthlyTotal = data.expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        return (
          expenseDate.getFullYear() === now.getFullYear() &&
          expenseDate.getMonth() === now.getMonth()
        );
      })
      .reduce((acc, expense) => acc + expense.amount, 0);
    const halfYearlyTotal = data.expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        return expenseDate > new Date(now.setMonth(now.getMonth() - 6));
      })
      .reduce((acc, expense) => acc + expense.amount, 0);
    const yearlyTotal = data.expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        return expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((acc, expense) => acc + expense.amount, 0);

    totalSpending.textContent = `$${total.toFixed(2)}`;
    spendToday.textContent = `$${todayTotal.toFixed(2)}`;
    spendSelectedDay.textContent = `$${selectedDateTotal.toFixed(2)}`;
    periodicSpending.innerHTML = `
            <h3>Periodic Spending</h3>
            <p>Monthly: $${monthlyTotal.toFixed(2)}</p>
            <p>Half-Yearly: $${halfYearlyTotal.toFixed(2)}</p>
            <p>Yearly: $${yearlyTotal.toFixed(2)}</p>
        `;
  }

  function getMonthlyData(monthOffset) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset + 1,
      0
    );

    let daysInMonth = new Array(end.getDate()).fill(0);
    data.expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= start && expenseDate <= end) {
        daysInMonth[expenseDate.getDate() - 1] += expense.amount;
      }
    });

    return daysInMonth;
  }

  function renderChart() {
    const labels = Array.from({ length: 31 }, (_, i) => i + 1); // Days of the month
    const datasets = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const monthOffset = i;
      const monthName = new Date(
        now.getFullYear(),
        now.getMonth() - monthOffset,
        1
      ).toLocaleString("default", { month: "short" });
      const daysData = getMonthlyData(monthOffset);

      datasets.push({
        label: `${monthName} ${
          now.getFullYear() - (now.getMonth() - monthOffset < 0 ? 1 : 0)
        }`,
        data: daysData,
        backgroundColor: `rgba(${(i * 40) % 255}, ${(i * 70) % 255}, ${
          (i * 100) % 255
        }, 0.5)`,
        borderColor: `rgba(${(i * 40) % 255}, ${(i * 70) % 255}, ${
          (i * 100) % 255
        }, 1)`,
        borderWidth: 1,
      });
    }

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `$${context.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Day of the Month",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Expense ($)",
            },
          },
        },
      },
    });
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newExpense = {
      date: document.getElementById("date").value,
      category: document.getElementById("category").value,
      amount: parseFloat(document.getElementById("amount").value),
    };
    data.expenses.push(newExpense);
    saveData(data);
    renderExpenses();
    renderAnalytics();
    renderChart();
    expenseForm.reset();
  });

  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  filterDate.addEventListener("change", (e) => {
    renderExpenses(e.target.value);
    renderAnalytics();
    renderChart();
  });

  // Initial rendering
  renderExpenses();
  renderAnalytics();
  renderChart();
});

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch((error) => {
      console.log("Service Worker registration failed:", error);
    });
}
