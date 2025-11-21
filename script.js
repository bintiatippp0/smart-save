// 1. Seleksi Elemen DOM
const balanceEl = document.getElementById('total-balance');
const targetValueEl = document.getElementById('target-value');
const progressBar = document.getElementById('progress-bar');
const targetStatusEl = document.getElementById('target-status');
const listEl = document.getElementById('list');
const form = document.getElementById('form-transaksi');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const editTargetBtn = document.getElementById('edit-target-btn');

// Elemen Baru untuk Kesehatan Keuangan
const healthScoreEl = document.getElementById('health-score');
const healthCircle = document.getElementById('health-score-circle');
const expenseCompareEl = document.getElementById('expense-comparison');
const dailyProjEl = document.getElementById('daily-projection');
const healthAdviceEl = document.getElementById('health-advice');

// 2. State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let savingsTarget = JSON.parse(localStorage.getItem('savingsTarget')) || 1000000;

// 3. Fungsi Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// 4. LOGIKA BARU: Analisa Kesehatan Keuangan
function analyzeHealth(totalBalance, totalIncome, totalExpense) {
    // A. Hitung Skor (0 - 100)
    // Logika: Jika saldo > 50% dari pemasukan = Bagus. Jika saldo minus = 0.
    let score = 0;
    if (totalIncome > 0) {
        const savingRatio = (totalBalance / totalIncome) * 100;
        // Skor maksimal 100, minimal 0
        score = Math.min(100, Math.max(0, Math.round(savingRatio))); 
    }
    
    // Update UI Skor
    healthScoreEl.innerText = score;
    
    // Warna Lingkaran Berdasarkan Skor
    if (score >= 70) healthCircle.style.background = "#4CAF50"; // Hijau
    else if (score >= 40) healthCircle.style.background = "#f39c12"; // Orange
    else healthCircle.style.background = "#e74c3c"; // Merah

    // B. Perbandingan Pengeluaran (Vs Batas Ideal 50% Pemasukan)
    // Karena belum ada data 3 bulan, kita bandingkan dengan "Ideal"
    const idealExpense = totalIncome * 0.5; 
    let compareText = "";
    
    if (totalExpense > totalIncome) {
        compareText = "Boros! > Pemasukan";
        expenseCompareEl.style.color = "#e74c3c";
    } else if (totalExpense > idealExpense) {
        compareText = "Waspada (Tinggi)";
        expenseCompareEl.style.color = "#f39c12";
    } else {
        compareText = "Hemat (Aman)";
        expenseCompareEl.style.color = "#4CAF50";
    }
    expenseCompareEl.innerText = compareText;

    // C. Proyeksi Akhir Bulan (Sisa Uang Aman per Hari)
    const date = new Date();
    const day = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - day;

    if (remainingDays > 0 && totalBalance > 0) {
        const dailySafe = totalBalance / remainingDays;
        dailyProjEl.innerText = formatRupiah(dailySafe);
        healthAdviceEl.innerText = `Kamu bisa jajan ${formatRupiah(dailySafe)} per hari sampai akhir bulan.`;
    } else if (totalBalance <= 0) {
        dailyProjEl.innerText = "Rp 0";
        healthAdviceEl.innerText = "Saldo habis! Stop pengeluaran tambahan.";
    } else {
        dailyProjEl.innerText = "-";
        healthAdviceEl.innerText = "Akhir bulan! Waktunya gajian?";
    }
}

// 5. Fungsi Update UI
function updateUI() {
    const amounts = transactions.map(transaction => 
        transaction.type === 'pengeluaran' ? -transaction.amount : transaction.amount
    );
    
    const total = amounts.reduce((acc, item) => acc + item, 0);

    // Hitung Total Pemasukan & Pengeluaran Terpisah untuk Analisa
    const totalIncome = transactions
        .filter(t => t.type === 'pemasukan')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const totalExpense = transactions
        .filter(t => t.type === 'pengeluaran')
        .reduce((acc, t) => acc + t.amount, 0);

    // Update Elemen Balance
    balanceEl.innerText = formatRupiah(total);
    targetValueEl.innerText = formatRupiah(savingsTarget);
    
    // Progress Bar
    let percentage = 0;
    if (savingsTarget > 0 && total > 0) {
        percentage = (total / savingsTarget) * 100;
    }
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    progressBar.style.width = `${percentage}%`;
    targetStatusEl.innerText = `${Math.round(percentage)}% Tercapai`;

    // JALANKAN ANALISA KESEHATAN
    analyzeHealth(total, totalIncome, totalExpense);

    // Render List
    listEl.innerHTML = '';
    transactions.forEach(transaction => {
        const sign = transaction.type === 'pengeluaran' ? '-' : '+';
        const itemClass = transaction.type === 'pengeluaran' ? 'minus' : 'plus';
        const item = document.createElement('li');
        item.classList.add(itemClass);
        
        item.innerHTML = `
            ${transaction.text} 
            <span>${sign}${formatRupiah(transaction.amount)} 
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button></span>
        `;
        listEl.appendChild(item);
    });

    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('savingsTarget', JSON.stringify(savingsTarget));
}

// 6. Tambah Transaksi
function addTransaction(e) {
    e.preventDefault();
    if (textInput.value.trim() === '' || amountInput.value.trim() === '') return;

    const type = document.querySelector('input[name="type"]:checked').value;

    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        text: textInput.value,
        amount: +amountInput.value,
        type: type
    };

    transactions.push(transaction);
    updateUI();
    textInput.value = '';
    amountInput.value = '';
}

// 7. Hapus Transaksi
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateUI();
}

// 8. Edit Target
editTargetBtn.addEventListener('click', () => {
    const newTarget = prompt("Masukkan target baru:", savingsTarget);
    if (newTarget && !isNaN(newTarget)) {
        savingsTarget = +newTarget;
        updateUI();
    }
});

form.addEventListener('submit', addTransaction);
window.removeTransaction = removeTransaction;
updateUI();
