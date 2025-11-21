// 1. SELEKSI DOM
const balanceEl = document.getElementById('total-balance');
const targetValueEl = document.getElementById('target-value');
const progressBar = document.getElementById('progress-bar');
const targetStatusEl = document.getElementById('target-status');
const listEl = document.getElementById('list');
const form = document.getElementById('form-transaksi');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const editTargetBtn = document.getElementById('edit-target-btn');
const imageInput = document.getElementById('image-upload'); 

// Elemen Kesehatan Keuangan
const healthScoreEl = document.getElementById('health-score');
const scoreCircleEl = document.getElementById('score-circle');
const healthStatusText = document.getElementById('health-status-text');
const comparisonText = document.getElementById('comparison-text');
const dailyProjectionEl = document.getElementById('daily-projection');
const healthAdviceEl = document.getElementById('health-advice');
const scrollBtn = document.getElementById("scrollToTopBtn"); 

// 2. STATE MANAGEMENT (Data LocalStorage)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let savingsTarget = JSON.parse(localStorage.getItem('savingsTarget')) || 1000000;

// 3. HELPER: Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// 4. HELPER: Generate ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// 5. HELPER: Konversi File menjadi Base64 (Teks)
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            return resolve(null);
        }
        // Batasan ukuran file (500 KB) untuk LocalStorage
        if (file.size > 500000) { 
            alert('Ukuran file terlalu besar (maks 500 KB). Bukti tidak disimpan.');
            return resolve(null);
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 6. FUNGSI UTAMA: Analisa Kesehatan Keuangan
function analyzeHealth(currentBalance) {
    const now = new Date();
    const currentMonth = now.getMonth(); 
    const currentYear = now.getFullYear();

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let pastExpenses = {};
    
    transactions.forEach(t => {
        const tDate = t.date ? new Date(t.date) : new Date();
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        const key = `${tMonth}-${tYear}`;

        if (tMonth === currentMonth && tYear === currentYear) {
            if (t.type === 'pemasukan') thisMonthIncome += t.amount;
            if (t.type === 'pengeluaran') thisMonthExpense += t.amount;
        } else {
            if (t.type === 'pengeluaran') {
                if (!pastExpenses[key]) pastExpenses[key] = 0;
                pastExpenses[key] += t.amount;
            }
        }
    });

    let score = 0;
    if (thisMonthIncome > 0) {
        score = Math.round((currentBalance / thisMonthIncome) * 100);
    }
    if (currentBalance <= 0 && thisMonthIncome > 0) score = 0;
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    healthScoreEl.innerText = score;

    // Warna & Status Berdasarkan Skor
    if (score >= 50) {
        scoreCircleEl.style.borderColor = '#4CAF50'; 
        scoreCircleEl.style.color = '#4CAF50';
        healthStatusText.innerText = "Keuangan Sehat! 👍";
    } else if (score >= 20) {
        scoreCircleEl.style.borderColor = '#f39c12'; 
        scoreCircleEl.style.color = '#f39c12';
        healthStatusText.innerText = "Perlu Berhemat ⚠️";
    } else {
        scoreCircleEl.style.borderColor = '#e74c3c'; 
        scoreCircleEl.style.color = '#e74c3c';
        healthStatusText.innerText = "Kritis! 🚨";
    }

    const pastKeys = Object.keys(pastExpenses);
    const last3Months = pastKeys.slice(-3);
    
    let avgExpense = 0;
    if (last3Months.length > 0) {
        const totalPast = last3Months.reduce((acc, key) => acc + pastExpenses[key], 0);
        avgExpense = totalPast / last3Months.length;
    }

    if (avgExpense === 0) {
        comparisonText.innerText = "Data baru";
        comparisonText.style.color = "#888";
    } else {
        const diff = thisMonthExpense - avgExpense;
        const percent = Math.round((diff / avgExpense) * 100);

        if (diff > 0) {
            comparisonText.innerText = `Naik ${percent}% 🔴`;
            comparisonText.style.color = '#e74c3c';
        } else {
            comparisonText.innerText = `Turun ${Math.abs(percent)}% 🟢`;
            comparisonText.style.color = '#4CAF50';
        }
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayDate = now.getDate();
    const remainingDays = daysInMonth - todayDate;

    if (currentBalance <= 0) {
        dailyProjectionEl.innerText = "Rp 0";
        healthAdviceEl.innerText = "Saldo habis! Stop pengeluaran.";
    } else if (remainingDays <= 0) {
        dailyProjectionEl.innerText = "Akhir Bulan";
        healthAdviceEl.innerText = "Waktunya gajian?";
    } else {
        const safeDaily = currentBalance / remainingDays;
        dailyProjectionEl.innerText = formatRupiah(safeDaily);
        healthAdviceEl.innerText = `Agar cukup, batasi jajan ${formatRupiah(safeDaily)} per hari.`;
    }
}

// 7. FUNGSI: UPDATE UI UTAMA
function updateUI() {
    const amounts = transactions.map(transaction => 
        transaction.type === 'pengeluaran' ? -transaction.amount : transaction.amount
    );
    const total = amounts.reduce((acc, item) => acc + item, 0);

    balanceEl.innerText = formatRupiah(total);
    targetValueEl.innerText = formatRupiah(savingsTarget);

    let percentage = 0;
    if (savingsTarget > 0 && total > 0) {
        percentage = (total / savingsTarget) * 100;
    }
    if (percentage > 100) percentage = 100;
    if (percentage < 0) percentage = 0;

    progressBar.style.width = `${percentage}%`;
    targetStatusEl.innerText = `${Math.round(percentage)}% Tercapai`;

    analyzeHealth(total);

    // Render List Transaksi
    listEl.innerHTML = '';
    transactions.forEach(transaction => {
        const sign = transaction.type === 'pengeluaran' ? '-' : '+';
        const itemClass = transaction.type === 'pengeluaran' ? 'minus' : 'plus';

        // Logika untuk Tombol Bukti Pembelian
        const imageIcon = transaction.image 
            ? `<button class="view-receipt-btn" onclick="viewReceipt('${transaction.image}')">🖼️ Bukti</button>` 
            : '';
        
        const item = document.createElement('li');
        item.classList.add(itemClass);
        item.innerHTML = `
            <div>
                ${transaction.text} 
                ${imageIcon}
            </div>
            <span>
                ${sign}${formatRupiah(transaction.amount)} 
                <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
            </span>
        `;
        listEl.appendChild(item);
    });

    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('savingsTarget', JSON.stringify(savingsTarget));
}

// 8. FUNGSI UTAMA: TAMBAH TRANSAKSI (ASYNC)
async function addTransaction(e) {
    e.preventDefault();

    if (textInput.value.trim() === '' || amountInput.value.trim() === '') {
        alert('Mohon isi keterangan dan jumlah');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;

    // Proses File Upload (wajib pakai await)
    const file = imageInput.files[0];
    const base64Image = await convertFileToBase64(file); 

    if (file && !base64Image) {
        // Jika file dipilih tapi gagal karena batasan ukuran, berhenti di sini
        return;
    }

    const transaction = {
        id: generateID(),
        text: textInput.value,
        amount: +amountInput.value,
        type: type,
        date: new Date().toISOString(),
        image: base64Image // Simpan data Base64
    };

    transactions.push(transaction);
    updateUI();

    textInput.value = '';
    amountInput.value = '';
    imageInput.value = ''; // Reset input file setelah berhasil
}

// 9. FUNGSI: HAPUS TRANSAKSI
function removeTransaction(id) {
    if(confirm('Yakin hapus catatan ini?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateUI();
    }
}

// 10. FUNGSI: EDIT TARGET
editTargetBtn.addEventListener('click', () => {
    const newTarget = prompt("Target tabungan baru (angka saja):", savingsTarget);
    if (newTarget && !isNaN(newTarget)) {
        savingsTarget = +newTarget;
        updateUI();
    }
});

// 11. FUNGSI BARU: Melihat Bukti Pembelian
window.viewReceipt = function(base64Data) {
    if (base64Data) {
        const newWindow = window.open();
        newWindow.document.write('<img src="' + base64Data + '" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">');
        newWindow.document.title = "Bukti Pembelian";
    } else {
        alert('Data bukti tidak valid.');
    }
}

// 12. FUNGSI BARU: Scroll to Top Logic
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
    // Tombol akan muncul jika scroll lebih dari 300px dari atas
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.style.display = "flex"; 
    } else {
        scrollBtn.style.display = "none";
    }
}

window.scrollToTop = function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' 
    });
}

// EVENT LISTENERS
form.addEventListener('submit', addTransaction);
window.removeTransaction = removeTransaction;

// Inisialisasi awal
updateUI();
