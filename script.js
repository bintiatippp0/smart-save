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

// 2. State Management (Mengambil data dari Local Storage)
// Jika tidak ada data, gunakan array kosong atau nilai default
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let savingsTarget = JSON.parse(localStorage.getItem('savingsTarget')) || 1000000; // Default target 1 juta

// 3. Fungsi Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// 4. Fungsi Update UI (Menghitung saldo, target, dan render list)
function updateUI() {
    // Hitung Total Saldo
    const amounts = transactions.map(transaction => 
        transaction.type === 'pengeluaran' ? -transaction.amount : transaction.amount
    );
    
    const total = amounts.reduce((acc, item) => acc + item, 0);

    // Update Saldo di HTML
    balanceEl.innerText = formatRupiah(total);
    
    // Update Target UI
    targetValueEl.innerText = formatRupiah(savingsTarget);
    
    // Hitung Progress Bar (Saldo / Target * 100)
    // Cegah pembagian dengan nol atau nilai negatif untuk progress bar
    let percentage = 0;
    if (savingsTarget > 0 && total > 0) {
        percentage = (total / savingsTarget) * 100;
    }
    if (percentage > 100) percentage = 100; // Maksimal 100%

    progressBar.style.width = `${percentage}%`;
    targetStatusEl.innerText = `${Math.round(percentage)}% Tercapai`;

    // Render List Transaksi
    listEl.innerHTML = '';
    
    transactions.forEach(transaction => {
        // Tentukan tanda plus atau minus dan kelas CSS
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

    // Simpan data terbaru ke Local Storage
    updateLocalStorage();
}

// 5. Fungsi Tambah Transaksi
function addTransaction(e) {
    e.preventDefault();

    if (textInput.value.trim() === '' || amountInput.value.trim() === '') {
        alert('Mohon isi keterangan dan jumlah');
        return;
    }

    // Ambil tipe transaksi dari radio button
    const type = document.querySelector('input[name="type"]:checked').value;

    const transaction = {
        id: generateID(),
        text: textInput.value,
        amount: +amountInput.value, // Tanda '+' mengubah string ke number
        type: type
    };

    transactions.push(transaction);

    updateUI();

    // Reset Form
    textInput.value = '';
    amountInput.value = '';
}

// 6. Fungsi Hapus Transaksi
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateUI();
}

// 7. Fungsi Edit Target Tabungan
editTargetBtn.addEventListener('click', () => {
    const newTarget = prompt("Masukkan target tabungan baru (hanya angka):", savingsTarget);
    
    if (newTarget !== null && newTarget.trim() !== "" && !isNaN(newTarget)) {
        savingsTarget = +newTarget;
        updateUI();
    }
});

// 8. Helper: Generate Random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// 9. Helper: Update Local Storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('savingsTarget', JSON.stringify(savingsTarget));
}

// 10. Event Listeners
form.addEventListener('submit', addTransaction);

// 11. Inisialisasi saat halaman dimuat
updateUI();

// Expose removeTransaction ke window scope agar bisa diakses oleh onclick di HTML
window.removeTransaction = removeTransaction;
