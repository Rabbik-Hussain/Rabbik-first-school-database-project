// ==========================================
// 1. FIREBASE & GLOBAL VARIABLES SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyOnly_ForPreview",
    authDomain: "learningschool-demo.firebaseapp.com",
    databaseURL: "https://learningschool-demo-default-rtdb.firebaseio.com",
    projectId: "learningschool-demo"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentSession = localStorage.getItem('LS_CURRENT_SESSION') || '2026';
let currentSelectedClass = 'প্লে';
let currentGeneratedItems = []; 
let editingOldReceiptSerial = null;

const defaultFeeStructure = {
    'প্লে': { admission: 1000, monthly: 500, exam: 200 },
    'নার্সারি': { admission: 1000, monthly: 500, exam: 200 },
    'ওয়ান': { admission: 1200, monthly: 600, exam: 250 },
    'টু': { admission: 1200, monthly: 600, exam: 250 },
    'থ্রি': { admission: 1500, monthly: 700, exam: 300 },
    'ফোর': { admission: 1500, monthly: 700, exam: 300 },
    'ফাইভ': { admission: 1800, monthly: 800, exam: 350 }
};

const defaultData = {
    'প্লে': [
        { roll: 1, name: 'আরিফ আহমেদ', admission: 0, jan: 500, feb: 500, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, exam1: 0, exam2: 0, finalExam: 0, prevDue: 200 },
        { roll: 2, name: 'সুমাইয়া আক্তার', admission: 1000, jan: 500, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, exam1: 0, exam2: 0, finalExam: 0, prevDue: 0 }
    ],
    'নার্সারি': [], 'ওয়ান': [], 'টু': [], 'থ্রি': [], 'ফোর': [], 'ফাইভ': []
};

const defaultReceiptCounters = {
    'প্লে': 1, 'নার্সারি': 1, 'ওয়ান': 1, 'টু': 1, 'থ্রি': 1, 'ফোর': 1, 'ফাইভ': 1
};

let sampleData = JSON.parse(localStorage.getItem(`LS_SCHOOL_DATA_${currentSession}`)) || defaultData;
let feeStructure = JSON.parse(localStorage.getItem(`LS_FEE_STRUCTURE_${currentSession}`)) || defaultFeeStructure;
let receiptCounters = JSON.parse(localStorage.getItem(`LS_RECEIPT_COUNTERS_${currentSession}`)) || defaultReceiptCounters;
let savedReceipts = JSON.parse(localStorage.getItem('LS_SAVED_RECEIPTS')) || [];

function updateSessionUI() {
    const sesDisplay = document.getElementById('currentSessionDisplay');
    if(sesDisplay) sesDisplay.innerText = currentSession;
}
updateSessionUI();

function saveAndSyncData() {
    localStorage.setItem('LS_CURRENT_SESSION', currentSession);
    localStorage.setItem(`LS_SCHOOL_DATA_${currentSession}`, JSON.stringify(sampleData));
    localStorage.setItem(`LS_FEE_STRUCTURE_${currentSession}`, JSON.stringify(feeStructure));
    localStorage.setItem(`LS_RECEIPT_COUNTERS_${currentSession}`, JSON.stringify(receiptCounters));
    localStorage.setItem('LS_SAVED_RECEIPTS', JSON.stringify(savedReceipts));
    try {
        database.ref(`sessions/${currentSession}/schoolData`).set(sampleData);
        database.ref(`sessions/${currentSession}/feeStructure`).set(feeStructure);
        database.ref(`sessions/${currentSession}/receiptCounters`).set(receiptCounters);
        database.ref('savedReceipts').set(savedReceipts);
    } catch(e) {}
}

function loadSessionData(sessionYear) {
    currentSession = sessionYear.toString();
    updateSessionUI();
    
    const blankStructure = { 'প্লে': [], 'নার্সারি': [], 'ওয়ান': [], 'টু': [], 'থ্রি': [], 'ফোর': [], 'ফাইভ': [] };
    sampleData = JSON.parse(localStorage.getItem(`LS_SCHOOL_DATA_${currentSession}`)) || blankStructure;
    feeStructure = JSON.parse(localStorage.getItem(`LS_FEE_STRUCTURE_${currentSession}`)) || defaultFeeStructure;
    receiptCounters = JSON.parse(localStorage.getItem(`LS_RECEIPT_COUNTERS_${currentSession}`)) || defaultReceiptCounters;
    
    saveAndSyncData();
}

// =====================================================
// TODAY'S ACCOUNT — RECEIPT DAILY DATA
// =====================================================

// =====================================================
// TODAY'S ACCOUNT — RECEIPT DAILY DATA
// FULL MONTH VIEW
// =====================================================

function buildTodayAccountTable() {

    const tableBody =
        document.getElementById('todayAccountTableBody');

    if (!tableBody) return;

    const classes = [
        'প্লে',
        'নার্সারি',
        'ওয়ান',
        'টু',
        'থ্রি',
        'ফোর',
        'ফাইভ'
    ];

    // -------------------------------------------------
    // Current session-এর Receipt
    // -------------------------------------------------
    const sessionReceipts = savedReceipts.filter(receipt =>
        String(receipt.session) === String(currentSession)
    );


    // =====================================================
// TODAY'S ACCOUNT — SAVED VOUCHER DATA
// =====================================================

const savedVouchers =
    JSON.parse(
        localStorage.getItem('LS_SAVED_VOUCHERS')
    ) || [];

    console.log('SAVED VOUCHERS:', savedVouchers);
    console.log('CURRENT SESSION:', currentSession);

const voucherDailyData = {};

function normalizeSessionYear(value) {

    const banglaDigits = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9'
    };

    return String(value || '')
        .replace(/[০-৯]/g, digit => banglaDigits[digit])
        .match(/\d{4}/)?.[0] || '';
}

const currentSessionYear =
    normalizeSessionYear(currentSession);

savedVouchers.forEach(voucher => {

    const voucherSession =
        normalizeSessionYear(voucher.session);

    const voucherDate =
        String(voucher.date || '').trim();

    const voucherAmount =
        Number(voucher.total) || 0;

    if (
        voucherSession !== currentSessionYear ||
        !voucherDate ||
        voucherAmount <= 0
    ) {
        return;
    }

    if (!voucherDailyData[voucherDate]) {
        voucherDailyData[voucherDate] = 0;
    }

    voucherDailyData[voucherDate] += voucherAmount;
});

    // -------------------------------------------------
    // Receipt data:
    // Date → Class → Amount
    // -------------------------------------------------
    const dailyData = {};

    sessionReceipts.forEach(receipt => {

        const date =
            String(receipt.date || '').trim();

        const className =
            String(receipt.className || '').trim();

        const amount =
            Number(receipt.total) || 0;

        if (!date || !classes.includes(className)) {
            return;
        }

        if (!dailyData[date]) {

            dailyData[date] = {};

            classes.forEach(classItem => {
                dailyData[date][classItem] = 0;
            });
        }

        dailyData[date][className] += amount;
    });

    // -------------------------------------------------
    // Current date / month
    // -------------------------------------------------
    const now = new Date();

    const selectedDateInput =
        document.getElementById('todayAccountSearchDate');

    let referenceDate = now;

    if (selectedDateInput && selectedDateInput.value) {

        const tempDate =
            new Date(`${selectedDateInput.value}T00:00:00`);

        if (!isNaN(tempDate.getTime())) {
            referenceDate = tempDate;
        }
    }

    const year =
        referenceDate.getFullYear();

    const month =
        referenceDate.getMonth();

    // -------------------------------------------------
    // Month title
    // -------------------------------------------------
    const banglaMonths = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর'
    ];

    const monthTitle =
        document.getElementById('todayAccountMonthTitle');

    if (monthTitle) {

        monthTitle.textContent =
            `${banglaMonths[month]} ${year}`;
    }

    // -------------------------------------------------
    // Number converter
    // -------------------------------------------------
    function toBanglaNumber(value) {

        const map = {
            '0': '০',
            '1': '১',
            '2': '২',
            '3': '৩',
            '4': '৪',
            '5': '৫',
            '6': '৬',
            '7': '৭',
            '8': '৮',
            '9': '৯'
        };

        return String(value).replace(
            /[0-9]/g,
            digit => map[digit]
        );
    }

    // -------------------------------------------------
    // Bangla weekdays
    // -------------------------------------------------
    const banglaDays = [
        'রবিবার',
        'সোমবার',
        'মঙ্গলবার',
        'বুধবার',
        'বৃহস্পতিবার',
        'শুক্রবার',
        'শনিবার'
    ];

    // -------------------------------------------------
    // Number of days in current month
    // -------------------------------------------------
    const daysInMonth =
        new Date(year, month + 1, 0).getDate();

    let rowsHtml = '';

    // -------------------------------------------------
    // Generate every day
    // -------------------------------------------------
    for (let day = 1; day <= daysInMonth; day++) {

        const dayString =
            String(day).padStart(2, '0');

        const monthString =
            String(month + 1).padStart(2, '0');

        const dateKey =
            `${year}-${monthString}-${dayString}`;

        const dateObj =
            new Date(`${dateKey}T00:00:00`);

        const dayName =
            banglaDays[dateObj.getDay()];

        // ---------------------------------------------
        // Class amounts
        // ---------------------------------------------
        const classData =
            dailyData[dateKey] || {};

        const voucherAmount =
             Number(voucherDailyData[dateKey]) || 0;

        let totalAmount = 0;

        classes.forEach(className => {

            totalAmount +=
                Number(classData[className]) || 0;
        });

        // ---------------------------------------------
        // Class cells
        // ---------------------------------------------
        const classCells =
            classes.map(className => {

                const amount =
                    Number(classData[className]) || 0;

                return `
                    <td
                        class="border border-gray-200 px-3 py-3 text-center font-bold text-gray-800"
                    >
                        ${
                            amount > 0
                                ? toBanglaNumber(amount) + '/-'
                                : '—'
                        }
                    </td>
                `;

            }).join('');

        // ---------------------------------------------
        // Complete row
        // ---------------------------------------------
        rowsHtml += `
            <tr
                data-account-date="${dateKey}"
                class="hover:bg-gray-50 transition"
            >

                <td
                    class="border border-gray-200 px-3 py-3 text-center font-bold sticky left-0 bg-white z-[5]"
                >
                    ${toBanglaNumber(dayString)}
                    -
                    ${toBanglaNumber(monthString)}
                    -
                    ${toBanglaNumber(year)}
                </td>

                <td
                    class="border border-gray-200 px-3 py-3 text-center font-semibold sticky left-[82px] bg-white z-[5]"
                >
                    ${dayName}
                </td>

                ${classCells}

                <!-- মোট জমা -->
                <td
                    class="border border-gray-200 px-3 py-3 text-center font-black text-emerald-700 bg-emerald-50"
                >
                    ${
                        totalAmount > 0
                            ? toBanglaNumber(totalAmount) + '/-'
                            : '—'
                    }
                </td>

                <!-- Voucher -->
                <td
                    class="border border-gray-200 px-3 py-3 text-center font-bold text-red-700 bg-red-50"
                >
                    ${
                        voucherAmount > 0
                            ? toBanglaNumber(voucherAmount) + '/-'
                            : '—'
                    }
                </td>

                <!-- Net জমা -->
                <td
                    class="border border-gray-200 px-3 py-3 text-center font-black text-indigo-700 bg-indigo-50"
                >
                    ${
                        (totalAmount - voucherAmount) > 0
                            ? toBanglaNumber(
                                totalAmount - voucherAmount
                              ) + '/-'
                            : '—'
                    }
                </td>

            </tr>
        `;
    }

    tableBody.innerHTML = rowsHtml;

    applyReceiptEditTrackingToTodayAccount();
}

// =====================================================
// TODAY'S ACCOUNT — RECEIPT EDIT TRACKING
// =====================================================

function applyReceiptEditTrackingToTodayAccount() {

    const tableBody =
        document.getElementById(
            'todayAccountTableBody'
        );

    if (!tableBody) return;

    const banglaClasses = [
        'প্লে',
        'নার্সারি',
        'ওয়ান',
        'টু',
        'থ্রি',
        'ফোর',
        'ফাইভ'
    ];

    // -----------------------------------------------
    // আগের Tracking display থাকলে আগে সরিয়ে দাও
    // -----------------------------------------------
    tableBody
        .querySelectorAll('.receipt-edit-tracking')
        .forEach(element => element.remove());

    // -----------------------------------------------
    // Current Session-এর edited receipts
    // -----------------------------------------------
    const sessionReceipts =
        savedReceipts.filter(receipt => {

            const receiptSession =
                normalizeSessionYear(
                    receipt.session
                );

            return (
                receiptSession ===
                normalizeSessionYear(currentSession)
            );
        });

    // -----------------------------------------------
    // Date + Class অনুযায়ী Edit Difference জমা
    // -----------------------------------------------
    const editTracking = {};

    sessionReceipts.forEach(receipt => {

        if (!receipt.editInfo) return;

        const date =
            String(receipt.date || '').trim();

        const className =
            String(receipt.className || '').trim();

        const difference =
            Number(
                receipt.editInfo.difference
            ) || 0;

        const editDate =
            String(
                receipt.editInfo.editDate || ''
            ).trim();

        if (
            !date ||
            !banglaClasses.includes(className) ||
            !editDate ||
            difference === 0
        ) {
            return;
        }

        if (!editTracking[date]) {
            editTracking[date] = {};
        }

        if (!editTracking[date][className]) {
            editTracking[date][className] = {
                difference: 0,
                editDates: []
            };
        }

        editTracking[date][className].difference +=
            difference;

        if (
            !editTracking[date][className].editDates
                .includes(editDate)
        ) {
            editTracking[date][className].editDates.push(
                editDate
            );
        }
    });

    // -----------------------------------------------
    // Table-এর প্রতিটি দিনের Row-তে Tracking দেখাও
    // -----------------------------------------------
    tableBody
        .querySelectorAll('tr[data-account-date]')
        .forEach(row => {

            const date =
                row.getAttribute(
                    'data-account-date'
                );

            const dateTracking =
                editTracking[date];

            if (!dateTracking) return;

            const cells =
                row.querySelectorAll('td');

            banglaClasses.forEach(
                (className, classIndex) => {

                    const tracking =
                        dateTracking[className];

                    if (!tracking) return;

                    // Date + Day = প্রথম ২টি column
                    // তাই class cell শুরু হচ্ছে index 2 থেকে
                    const cell =
                        cells[classIndex + 2];

                    if (!cell) return;

                    const difference =
                        tracking.difference;

                    const sign =
                        difference > 0
                            ? '+'
                            : '';

                    const banglaAmount =
                        toBanglaNumber(
                            Math.abs(difference)
                        );

                    const editDates =
                        tracking.editDates.join(', ');

                    const trackingElement =
                        document.createElement('div');

                    trackingElement.className =
                        'receipt-edit-tracking text-red-600 text-[11px] font-black mt-1 leading-tight';

                    trackingElement.textContent =
                        `Edit: ${sign}${difference < 0 ? '-' : ''}৳${banglaAmount} | ${editDates}`;

                    cell.appendChild(
                        trackingElement
                    );
                }
            );
        });
}

// =====================================================
// TODAY'S ACCOUNT — SEARCH BY DATE
// =====================================================

function searchTodayAccountDate() {

    const dateInput =
        document.getElementById('todayAccountSearchDate');

    if (!dateInput || !dateInput.value) {
        alert('অনুগ্রহ করে একটি তারিখ নির্বাচন করুন।');
        return;
    }

    const selectedDate =
        new Date(`${dateInput.value}T00:00:00`);

    if (isNaN(selectedDate.getTime())) {
        alert('সঠিক তারিখ নির্বাচন করুন।');
        return;
    }

    // Current session-ই ব্যবহার হবে
    const sessionInput =
        document.getElementById('todayAccountSearchSession');

    if (sessionInput) {
        sessionInput.value = currentSession;
    }

    // নির্বাচিত তারিখ অনুযায়ী পুরো মাসের table তৈরি
    buildTodayAccountTable();

    // Search status
    const statusElement =
        document.getElementById('todayAccountSearchStatus');

    if (statusElement) {

        const banglaMonths = [
            'জানুয়ারি',
            'ফেব্রুয়ারি',
            'মার্চ',
            'এপ্রিল',
            'মে',
            'জুন',
            'জুলাই',
            'আগস্ট',
            'সেপ্টেম্বর',
            'অক্টোবর',
            'নভেম্বর',
            'ডিসেম্বর'
        ];

        const year =
            selectedDate.getFullYear();

        const month =
            selectedDate.getMonth();

        const day =
            selectedDate.getDate();

        const banglaNumber = value => {

            const map = {
                '0': '০',
                '1': '১',
                '2': '২',
                '3': '৩',
                '4': '৪',
                '5': '৫',
                '6': '৬',
                '7': '৭',
                '8': '৮',
                '9': '৯'
            };

            return String(value).replace(
                /[0-9]/g,
                digit => map[digit]
            );
        };

        statusElement.textContent =
            `নির্বাচিত: ${banglaNumber(day)} ${banglaMonths[month]} ${banglaNumber(year)}`;

        statusElement.classList.remove('hidden');
    }

    // নির্বাচিত দিনের row খুঁজে বের করা
    const targetRow =
        document.querySelector(
            `tr[data-account-date="${dateInput.value}"]`
        );

    if (targetRow) {

        targetRow.classList.add(
            'bg-yellow-100'
        );

        targetRow.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function switchSession() {
    const val = document.getElementById('inputSearchSession').value.trim();
    if(!val) {
        alert('অনুগ্রহ করে সঠিক সেশন বা বছর লিখুন। (যেমন: 2025)');
        return;
    }
    loadSessionData(val);
    alert(`সাফল্যের সাথে সেশন ${currentSession}-এর ডাটাবেজে সুইচ করা হয়েছে!`);
    showSection('dashboard');
}

function createNewSessionPrompt() {
    const nextYear = parseInt(currentSession) + 1;
    const confirmCreate = confirm(`আপনি কি নতুন ${nextYear} সেশন চালু করতে চান?\n\nএটি বর্তমান ${currentSession} সেশনের সকল তথ্য ডাটাবেজে অক্ষত রেখে নতুন বছর তৈরি করবে।`);
    if (confirmCreate) {
        currentSession = nextYear.toString();
        updateSessionUI();
        
        sampleData = { 'প্লে': [], 'নার্সারি': [], 'ওয়ান': [], 'টু': [], 'থ্রি': [], 'ফোর': [], 'ফাইভ': [] };
        feeStructure = defaultFeeStructure;
        receiptCounters = defaultReceiptCounters;

        saveAndSyncData();
        alert(`অভিনন্দন! নতুন সেশন ${currentSession} সফলভাবে চালুর জন্য প্রস্তুত।`);
        showSection('dashboard');
    }
}

function getReceiptSerialForClass(clsName) {
    const count = receiptCounters[clsName] || 1;
    const formattedCount = count < 10 ? '০' + count : count.toString();
    return `${clsName}-${formattedCount}`;
}

function loadClassFeeConfig() {
    const sel = document.getElementById('cfgClassSelect');
    if(!sel) return;
    const cls = sel.value;
    const cfg = feeStructure[cls] || { admission: 0, monthly: 0, exam: 0 };
    document.getElementById('cfgAdmissionFee').value = cfg.admission || 0;
    document.getElementById('cfgMonthlyFee').value = cfg.monthly || 0;
    document.getElementById('cfgExamFee').value = cfg.exam || 0;
}

function saveClassFeeConfig() {
    const cls = document.getElementById('cfgClassSelect').value;
    feeStructure[cls] = {
        admission: parseFloat(document.getElementById('cfgAdmissionFee').value) || 0,
        monthly: parseFloat(document.getElementById('cfgMonthlyFee').value) || 0,
        exam: parseFloat(document.getElementById('cfgExamFee').value) || 0
    };
    saveAndSyncData();
    alert(`শ্রেণি: ${cls}-এর ফি ইনফরমেশন সফলভাবে আপডেট করা হয়েছে!`);
}


// ==========================================
// LANGUAGE SYSTEM
// ==========================================

const languageTranslations = {
    bn: {
        languageButton: 'English',

        // Navbar
        schoolName: 'লার্নিং স্কুল',
        home: 'হোম',
        information: 'ইনফরমেশন',
        cashCount: 'ক্যাশ কাউন্ট',
        logout: 'লগ আউট',

        // Home
        homePortalTitle: 'লার্নিং স্কুল ডিজিটাল পোর্টাল',
        homePortalDescription: 'সকল প্রকার মাসিক ফি, রসিদ প্রদান ও বকেয়া হিসাব নিয়ন্ত্রণের জন্য "ক্যাশ কাউন্ট" বাটনে চাপ দিন।',
        goToAccounts: 'হিসাব সেকশনে যান',
        todayAccountTitle: '📊 আজকের হিসাব',
        todayAccountDescription: 'প্রতিদিনের শ্রেণিভিত্তিক জমা, প্রতিষ্ঠানের খরচ এবং অবশিষ্ট হিসাব দেখুন।',
        findAccountMonth: '🔍 হিসাবের মাসটি খুঁজুন',
        viewTodayAccount: '📊 আজকের হিসাব দেখুন',

        sessionSelectChange: '🔍 সেশন নির্বাচন / পরিবর্তন',
        sessionSelectDescription: 'পুরাতন বা সংরক্ষিত কোনো সেশনের ডাটা দেখতে এখানে সাল লিখুন।',
        whichSession: 'কোন সেশনে যেতে চান:',
        findAndGoSession: 'খুঁজুন ও সেশনে যান',

        addNewSessionTitle: 'নতুন বছরের জন্য সেশন যুক্ত করুন',
        addNewSessionDescription: 'পূর্ববর্তী বছরের সকল স্টুডেন্টদের বকেয়া ফি স্বয়ংক্রিয়ভাবে ট্রান্সফার করে এবং প্রমোশন সেটআপ করতে নতুন সেশন ওপেন করুন। আগের সমস্ত ডাটা ডাটাবেজে নিরাপদ থাকবে।',
        addNewSessionButton: '➕ নতুন সেশন যুক্ত করি',

        classFeeTitle: '⚙️ ক্লাস ফি ইনফরমেশন যোগ / এডিট করুন (অ্যাড ইনফরমেশন)',
        editSupportActive: 'এডিট সাপোর্ট সক্রিয়',
        classFeeDescription: 'যেকোনো ক্লাসের ভর্তি/সেশন ফি, মাসিক বেতন এবং পরীক্ষা ফি এখানে নির্ধারণ করুন। এই তথ্যগুলো অটোমেটিক ডাটাবেজ টেবিলে যুক্ত হবে।',
        classLabel: 'শ্রেণি:',
        admissionSessionFeeLabel: 'ভর্তি / সেশন ফি (টাকা):',
        monthlyFeeLabel: 'মাসিক বেতন (টাকা):',
        examFeeLabel: 'পরীক্ষা ফি (প্রতি পরীক্ষা):',
        saveFeeButton: 'ওকে (সংরক্ষণ করুন)',

        // Cash Count
        selectClassTitle: 'শ্রেণি নির্বাচন করুন',
        viewStudentTable: 'শিক্ষার্থী হিসাব টেবিল দেখতে ক্লিক করুন',

        createReceiptTitle: 'রশীদ তৈরি করুন (রশীদ)',
        searchOldReceipt: '🔍 পুরাতন রশীদ খুঁজুন',
        receiptDescription: 'টাকা জমা নিয়ে শিক্ষার্থী ও অফিস কপি জেনারেট করুন।',
        selectReceiptClass: 'শ্রেণি সিলেক্ট করুন:',
        goToReceiptForm: 'রশীদ ফর্মে যান',

        monthlyBillTitle: 'প্রতি মাসের হিসাব দিন (বকেয়া বিল)',
        monthlyBillDescription: 'মাসের শেষে বকেয়া তালিকা তৈরি করে প্রিন্ট বা হোয়াটসঅ্যাপে শেয়ার করুন।',
        giveMonthlyAccount: 'প্রত্যেকের মাসের হিসাব দিন',
        searchOldVoucher: '🔍 পুরাতন বাউচার খুঁজুন',
        institutionPaymentVoucher: 'প্রতিষ্ঠানের পেমেন্ট ভাউচার',
        institutionPaymentVoucherDescription: 'প্রতিষ্ঠানের বিভিন্ন অর্থ প্রদান ও খরচের জন্য পেমেন্ট ভাউচার তৈরি করুন।',
        createVoucherButton: '🧾 ভাউচার তৈরি করুন',
            },

    en: {
        languageButton: 'বাংলা',

        // Navbar
        schoolName: 'Learning School',
        home: 'Home',
        information: 'Information',
        cashCount: 'Cash Count',
        logout: 'Logout',

        // Home
        homePortalTitle: 'Learning School Digital Portal',
        homePortalDescription: 'Click the "Cash Count" button to manage monthly fees, issue receipts, and control outstanding balances.',
        goToAccounts: 'Go to Accounts',
        todayAccountTitle: '📊 Today\'s Account',
        todayAccountDescription: 'View daily class-wise collections, institutional expenses, and remaining balance.',
        findAccountMonth: '🔍 Find Account Month',
        viewTodayAccount: '📊 View Today\'s Account',

        sessionSelectChange: '🔍 Select / Change Session',
        sessionSelectDescription: 'Enter a year here to view data from an old or saved session.',
        whichSession: 'Which session do you want to open:',
        findAndGoSession: 'Search & Go to Session',

        addNewSessionTitle: 'Add a Session for the New Year',
        addNewSessionDescription: 'Open a new session to automatically transfer outstanding fees from the previous year and set up student promotion. All previous data will remain safely stored in the database.',
        addNewSessionButton: '➕ Add New Session',

        classFeeTitle: '⚙️ Add / Edit Class Fee Information',
        editSupportActive: 'Edit Support Active',
        classFeeDescription: 'Set admission/session fees, monthly tuition, and examination fees for any class here. This information will be automatically added to the database table.',
        classLabel: 'Class:',
        admissionSessionFeeLabel: 'Admission / Session Fee:',
        monthlyFeeLabel: 'Monthly Fee:',
        examFeeLabel: 'Exam Fee (per exam):',
        saveFeeButton: 'OK (Save)',

        // Cash Count
        selectClassTitle: 'Select Class',
        viewStudentTable: 'Click to view the student account table',

        createReceiptTitle: 'Create Receipt',
        searchOldReceipt: '🔍 Search Old Receipts',
        receiptDescription: 'Collect payment and generate student and office copies.',
        selectReceiptClass: 'Select Class:',
        goToReceiptForm: 'Go to Receipt Form',

        monthlyBillTitle: 'Monthly Account (Outstanding Bill)',
        monthlyBillDescription: 'Create the outstanding list at the end of the month and print or share it on WhatsApp.',
        giveMonthlyAccount: 'Give Monthly Account',
        searchOldVoucher: '🔍 Search Old Vouchers',
        institutionPaymentVoucher: 'Institution Payment Voucher',
        institutionPaymentVoucherDescription: 'Create payment vouchers for various institutional payments and expenses.',
        createVoucherButton: '🧾 Create Voucher',
    }
};



const classDisplayNames = {
    bn: {
        'প্লে': 'প্লে',
        'নার্সারি': 'নার্সারি',
        'ওয়ান': 'ওয়ান',
        'টু': 'টু',
        'থ্রি': 'থ্রি',
        'ফোর': 'ফোর',
        'ফাইভ': 'ফাইভ'
    },

    en: {
        'প্লে': 'Play',
        'নার্সারি': 'Nursery',
        'ওয়ান': 'One',
        'টু': 'Two',
        'থ্রি': 'Three',
        'ফোর': 'Four',
        'ফাইভ': 'Five'
    }
};


let currentLanguage =
    localStorage.getItem('LS_LANGUAGE') || 'bn';


function toggleLanguage() {

    currentLanguage =
        currentLanguage === 'bn' ? 'en' : 'bn';

    localStorage.setItem(
        'LS_LANGUAGE',
        currentLanguage
    );

    applyLanguage();
}


function applyLanguage() {

    const t =
        languageTranslations[currentLanguage];

    // ==========================================
    // Navbar
    // ==========================================

    const languageButton =
        document.getElementById('languageToggleBtn');

    if (languageButton) {
        languageButton.textContent =
            t.languageButton;
    }

    const schoolName =
        document.querySelector(
            'nav .text-xl.font-bold.tracking-wide'
        );

    if (schoolName) {
        schoolName.textContent =
            t.schoolName;
    }

    const homeButton =
        document.querySelector(
            'nav button[onclick="showSection(\'home\')"]'
        );

    const informationButton =
        document.querySelector(
            'nav button[onclick="showSection(\'info\')"]'
        );

    const cashCountButton =
        document.querySelector(
            'nav button[onclick="showSection(\'dashboard\')"]'
        );

    const logoutButton =
        document.querySelector(
            'nav button[onclick="logoutFromDashboard()"]'
        );

    if (homeButton) {
        homeButton.textContent = t.home;
    }

    if (informationButton) {
        informationButton.textContent = t.information;
    }

    if (cashCountButton) {
        cashCountButton.textContent = t.cashCount;
    }

    if (logoutButton) {
        logoutButton.textContent = t.logout;
    }


    // ==========================================
    // Safe UI Translation
    // ==========================================
    // শুধুমাত্র data-i18n থাকা UI element-গুলো
    // পরিবর্তন হবে।
    // Database / user-entered data স্পর্শ হবে না।

    document
        .querySelectorAll('[data-i18n]')
        .forEach(element => {

            const key =
                element.getAttribute('data-i18n');

            if (!key || !t[key]) {
                return;
            }

            element.textContent = t[key];
        });


        document
    .querySelectorAll('[data-class-card]')
    .forEach(element => {

        const classValue =
            element.getAttribute('data-class-card');

        const displayName =
            classDisplayNames[currentLanguage][classValue];

        if (!displayName) {
            return;
        }

        if (currentLanguage === 'en') {
            element.textContent =
                `Class: ${displayName}`;
        } else {
            element.textContent =
                `শ্রেণি: ${displayName}`;
        }
    });

}


document.addEventListener(
    'DOMContentLoaded',
    function () {
        applyLanguage();
    }
);


function showSection(secId) {
    [
        'home',
        'info',
        'dashboard',
        'classtable',
        'receiptform',
        'receiptpreview',
        'monthlybill',
        'billpreview'
    ].forEach(s => {
        const el = document.getElementById('sec-' + s);
        if (el) el.classList.add('hidden');
    });

    // Hide Today's Account internal view when changing main sections
    const todayAccountView = document.getElementById('todayAccountView');
    if (todayAccountView) {
        todayAccountView.classList.add('hidden');
    }

    const targetEl = document.getElementById('sec-' + secId);
    if (targetEl) targetEl.classList.remove('hidden');

    if (secId === 'home') {
        loadClassFeeConfig();
    } else if (secId === 'info') {
        renderInformationTeachers();
    } else if (secId === 'receiptpreview') {
        populateReceiptSignatureDropdowns();
    } else if (secId === 'billpreview') {
        populateBillHeadTeacherDropdown();
    }
}


// ===============================
// TODAY'S ACCOUNT — OPEN / CLOSE
// ===============================

function openTodayAccount() {
    const homeSection = document.getElementById('sec-home');
    const todayAccountView = document.getElementById('todayAccountView');

    if (!homeSection || !todayAccountView) return;

    // Make sure Home section is visible
    homeSection.classList.remove('hidden');

    // Hide normal Home content
    document.querySelectorAll('#sec-home > *:not(#todayAccountView)').forEach(element => {
        element.classList.add('hidden');
    });

    // Show Today's Account report
    todayAccountView.classList.remove('hidden');

    // Load current session
    const sessionElement = document.getElementById('todayAccountSession');
    const searchSessionElement = document.getElementById('todayAccountSearchSession');

    if (sessionElement) {
        sessionElement.textContent = currentSession;
    }

    if (searchSessionElement) {
        searchSessionElement.value = currentSession;
    }

    // Clear previous search status
    const statusElement = document.getElementById('todayAccountSearchStatus');

    if (statusElement) {
        statusElement.textContent = '';
        statusElement.classList.add('hidden');
    }

    // Start with current date
    const dateInput = document.getElementById('todayAccountSearchDate');

    if (dateInput && !dateInput.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        dateInput.value = `${year}-${month}-${day}`;
    }

    // Temporary empty table.
    // Actual database calculation will be added in the next step.
    const tableBody = document.getElementById('todayAccountTableBody');

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="12"
                    class="border px-4 py-8 text-center text-gray-500 font-semibold"
                >
                    আজকের হিসাবের ডাটা লোড হচ্ছে...
                </td>
            </tr>
        `;
    }

    buildTodayAccountTable();
}


function closeTodayAccount() {
    const homeSection = document.getElementById('sec-home');
    const todayAccountView = document.getElementById('todayAccountView');

    if (!homeSection || !todayAccountView) return;

    // Hide report
    todayAccountView.classList.add('hidden');

    // Show normal Home content again
    document.querySelectorAll('#sec-home > *:not(#todayAccountView)').forEach(element => {
        element.classList.remove('hidden');
    });
}

// =====================================================
// TODAY'S ACCOUNT — PRINT
// =====================================================

function printTodayAccount() {

    const report =
        document.getElementById('todayAccountView');

    if (!report) {
        alert('আজকের হিসাব রিপোর্ট পাওয়া যায়নি!');
        return;
    }

    const printWindow =
        window.open('', '_blank');

    if (!printWindow) {
        alert('Print window খোলা যাচ্ছে না। Browser popup অনুমতি দিন।');
        return;
    }

    const reportClone =
        report.cloneNode(true);

    // Action buttons বাদ
    reportClone
        .querySelectorAll(
            'button'
        )
        .forEach(button => {

            const text =
                button.innerText.trim();

            if (
                text.includes('প্রিন্ট') ||
                text.includes('PDF') ||
                text.includes('ফিরে যান') ||
                text.includes('হিসাব খুঁজুন')
            ) {
                button.remove();
            }
        });

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">

            <title>আজকের হিসাব রিপোর্ট</title>

            <style>

                @page {
                    size: A4 landscape;
                    margin: 10mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 0;
                    font-family:
                        Arial,
                        "Noto Sans Bengali",
                        sans-serif;
                    background: white;
                    color: #111827;
                }

                #todayAccountView {
                    display: block !important;
                    width: 100% !important;
                }

                table {
                    width: 100% !important;
                    min-width: 0 !important;
                    border-collapse: collapse !important;
                    font-size: 10px !important;
                }

                th,
                td {
                    border: 1px solid #9ca3af !important;
                    padding: 5px 4px !important;
                    text-align: center;
                    vertical-align: middle;
                }

                thead {
                    display: table-header-group;
                }

                tr {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                th {
                    font-weight: 700;
                    background: #e5e7eb !important;
                }

                .sticky {
                    position: static !important;
                }

                .receipt-edit-tracking {
                    color: #dc2626 !important;
                    font-size: 9px !important;
                }

                @media print {

                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                }

            </style>
        </head>

        <body>

            ${reportClone.outerHTML}

            <script>
                window.onload = function () {
                    setTimeout(function () {
                        window.print();
                    }, 500);
                };

                window.onafterprint = function () {
                    window.close();
                };
            <\/script>

        </body>
        </html>
    `);

    printWindow.document.close();
}


function printReceipt() {
    const receipt = document.getElementById('printableReceipt');

    if (!receipt) {
        alert('রশীদের প্রিভিউ পাওয়া যায়নি।');
        return;
    }

    // Script বাদ দিয়ে শুধু তৈরি হয়ে যাওয়া receipt content নেওয়া হবে
    const receiptClone = receipt.cloneNode(true);

    receiptClone.querySelectorAll('script').forEach(script => {
        script.remove();
    });

    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
        alert('Print window খোলা যায়নি।');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <title>রশীদ প্রিন্ট</title>

            <script src="https://cdn.tailwindcss.com"></script>

            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: white;
                }

                .no-print {
                    display: none !important;
                }

                @media print {
                    body {
                        padding: 0;
                    }
                }
            </style>
        </head>

        <body>
            ${receiptClone.outerHTML}

            <script>
                window.onload = function () {
                    setTimeout(function () {
                        window.print();
                    }, 500);
                };

                window.onafterprint = function () {
                    window.close();
                };
            <\/script>
        </body>
        </html>
    `);

    printWindow.document.close();
}


// =====================================================
// TODAY'S ACCOUNT — PDF
// =====================================================

function downloadTodayAccountPDF() {

const report =  
    document.getElementById(  
        'todayAccountView'  
    );  

if (!report) {  

    alert(  
        'আজকের হিসাব রিপোর্ট পাওয়া যায়নি!'  
    );  

    return;  
}  

if (  
    typeof html2pdf === 'undefined'  
) {  

    alert(  
        'PDF system পাওয়া যাচ্ছে না। পেজটি আবার Reload করুন।'  
    );  

    return;  
}  

const reportClone =  
    report.cloneNode(true);  

reportClone  
    .querySelectorAll('button')  
    .forEach(button => {  

        button.remove();  

    });  

const pdfContainer =  
    document.createElement('div');  

/*  
   গুরুত্বপূর্ণ:  
   আর -100000px ব্যবহার করা হচ্ছে না।  
   Renderer-এর দৃশ্যমান viewport-এর মধ্যেই  
   temporary PDF container রাখা হচ্ছে।  
*/  

pdfContainer.style.position = 'fixed';  
pdfContainer.style.left = '0';  
pdfContainer.style.top = '0';  
pdfContainer.style.width = '1120px';  
pdfContainer.style.background = '#ffffff';  
pdfContainer.style.color = '#111827';  
pdfContainer.style.zIndex = '2147483647';  
pdfContainer.style.padding = '10px';  
pdfContainer.style.margin = '0';  

pdfContainer.style.fontFamily =  
    'Arial, "Noto Sans Bengali", sans-serif';  

reportClone.style.display = 'block';  
reportClone.style.width = '100%';  
reportClone.style.minWidth = '0';  
reportClone.style.background = '#ffffff';  

reportClone  
    .querySelectorAll('.sticky')  
    .forEach(element => {  

        element.style.position = 'static';  

    });  

reportClone  
    .querySelectorAll('table')  
    .forEach(table => {  

        table.style.width = '100%';  
        table.style.minWidth = '0';  
        table.style.borderCollapse =  
            'collapse';  

    });  

reportClone  
    .querySelectorAll('th, td')  
    .forEach(cell => {  

        cell.style.border =  
            '1px solid #9ca3af';  

        cell.style.padding =  
            '4px 3px';  

        cell.style.textAlign =  
            'center';  

        cell.style.verticalAlign =  
            'middle';  

    });  

reportClone  
    .querySelectorAll('tr')  
    .forEach(row => {  

        row.style.breakInside =  
            'avoid';  

        row.style.pageBreakInside =  
            'avoid';  

    });  

reportClone  
    .querySelectorAll(  
        '.receipt-edit-tracking'  
    )  
    .forEach(element => {  

        element.style.color =  
            '#dc2626';  

        element.style.fontSize =  
            '8px';  

    });  

pdfContainer.appendChild(  
    reportClone  
);  

document.body.appendChild(  
    pdfContainer  
);  

const session =  
    String(  
        currentSession || 'Session'  
    ).replace(  
        /[^\dA-Za-z-]/g,  
        ''  
    );  

const monthTitle =  
    document.getElementById(  
        'todayAccountMonthTitle'  
    )?.innerText  
    ?.trim()  
    || 'হিসাব';  

const safeMonthTitle =  
    monthTitle.replace(  
        /[\\/:*?"<>|]/g,  
        '-'  
    );  

const filename =  
    `Learning-School-Todays-Account-${session}-${safeMonthTitle}.pdf`;  

const opt = {  

    margin: [  
        8,  
        8,  
        8,  
        8  
    ],  

    filename: filename,  

    image: {  
        type: 'jpeg',  
        quality: 0.98  
    },  

    html2canvas: {  

        scale: 2,  

        useCORS: true,  

        backgroundColor: '#ffffff',  

        scrollX: 0,  

        scrollY: 0,  

        windowWidth: 1120  

    },  

    jsPDF: {  

        unit: 'mm',  

        format: 'a4',  

        orientation: 'landscape'  

    },  

    pagebreak: {  

        mode: [  
            'css',  
            'legacy'  
        ],  

        avoid: [  
            'tr'  
        ]  

    }  

};  

html2pdf()  
    .set(opt)  
    .from(pdfContainer)  
    .save()  
    .then(() => {  

        document.body.removeChild(  
            pdfContainer  
        );  

    })  
    .catch(error => {  

        console.error(  
            'Today Account PDF Error:',  
            error  
        );  

        if (  
            document.body.contains(  
                pdfContainer  
            )  
        ) {  

            document.body.removeChild(  
                pdfContainer  
            );  

        }  

        alert(  
            'আজকের হিসাব PDF তৈরি করতে সমস্যা হয়েছে।'  
        );  

    });

}




// ==========================================
// 2. REGISTERED TEACHERS DATA HELPER
// ==========================================
// Supports both:
// 1. New format: ["teacherId1", "teacherId2"]
// 2. Old format: [{ teacherId: "...", ... }, { teacherId: "...", ... }]
function getRegisteredTeachers() {
    const raw = localStorage.getItem('LS_REGISTERED_TEACHERS');
    if (!raw) return [];

    try {
        const list = JSON.parse(raw);

        if (!Array.isArray(list)) return [];

        return list.map(item => {
            // New format: only Teacher ID is stored in the list
            if (typeof item === 'string') {
                const stored = localStorage.getItem(item);

                if (!stored) return null;

                try {
                    return JSON.parse(stored);
                } catch (error) {
                    console.error('Teacher data parse error:', error);
                    return null;
                }
            }

            // Old format: complete teacher object is stored in the list
            if (item && item.teacherId) {
                const stored = localStorage.getItem(item.teacherId);

                // Prefer the complete data stored under Teacher ID
                if (stored) {
                    try {
                        return JSON.parse(stored);
                    } catch (error) {
                        console.error('Teacher data parse error:', error);
                    }
                }

                // Backward compatibility
                return item;
            }

            return null;
        }).filter(Boolean);

    } catch (error) {
        console.error('Registered teachers list error:', error);
        return [];
    }
}

/* =========================================================
   UPDATE–01: STUDENT ID SYSTEM
   Auto Generate + Unique Check
   ========================================================= */

function getAllStudentIds() {
    const ids = new Set();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key || !key.startsWith('LS_SCHOOL_DATA_')) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));

            if (!data || typeof data !== 'object') continue;

            Object.keys(data).forEach(className => {

                if (!Array.isArray(data[className])) return;

                data[className].forEach(student => {

                    if (student && student.studentId) {
                        ids.add(String(student.studentId).trim());
                    }

                });
            });

        } catch (error) {
            console.error('Student ID scan error:', error);
        }
    }

    return ids;
}


function generateStudentId() {
    const existingIds = getAllStudentIds();

    let number = 1;

    while (
        existingIds.has(
            `STU-${String(number).padStart(4, '0')}`
        )
    ) {
        number++;
    }

    return `STU-${String(number).padStart(4, '0')}`;
}


function isStudentIdUnique(studentId, excludeStudent = null) {
    const id = String(studentId || '').trim();

    if (!id) return false;

    let isUnique = true;

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (!key || !key.startsWith('LS_SCHOOL_DATA_')) continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));

            if (!data || typeof data !== 'object') continue;

            Object.keys(data).forEach(className => {

                if (!Array.isArray(data[className])) return;

                data[className].forEach(student => {

                    if (!student || !student.studentId) return;

                    if (
                        String(student.studentId).trim() === id &&
                        student !== excludeStudent
                    ) {
                        isUnique = false;
                    }

                });
            });

        } catch (error) {
            console.error(
                'Student ID uniqueness check error:',
                error
            );
        }
    }

    return isUnique;
}


// ==========================================
// 3. INFORMATION PAGE: TEACHERS CARDS RENDER
// ==========================================
function renderInformationTeachers() {
    const container = document.getElementById('teachersInformationContainer');

    if (!container) return;

    container.innerHTML = '';

    const teachers = getRegisteredTeachers();

    if (teachers.length === 0) {
        container.innerHTML = `
            <p class="text-center text-gray-500 text-sm">
                কোনো শিক্ষক নিবন্ধিত নেই।
            </p>
        `;
        return;
    }

    teachers.forEach(t => {

        let desigText = '';

        if (t.designation === 'head_teacher') {
            desigText = 'প্রধান শিক্ষক (Head Teacher)';
        } else if (t.designation === 'assistant_teacher') {
            desigText = 'সহকারী শিক্ষক (Assistant Teacher)';
        } else if (t.designation === 'class_teacher') {
            desigText = `শ্রেণি শিক্ষক (Class Teacher) (${t.className || ''})`;
        } else {
            desigText = t.designation || '';
        }

        const card = document.createElement('div');

        card.className =
            "w-full bg-white border border-gray-300 rounded-xl shadow-md p-5 flex flex-col md:flex-row items-center gap-6";

        card.innerHTML = `
            <div class="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">

                <img
                    src="${t.profilePic || 'https://via.placeholder.com/100'}"
                    alt="Profile"
                    style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;"
                    class="border-2 border-blue-900 shadow"
                >

            </div>

            <div class="w-full md:w-2/3 flex flex-col justify-center space-y-2">

                <div class="space-y-1">

                    <h3 class="text-lg font-bold text-blue-900">
                        ${t.firstName || ''} ${t.lastName || ''}
                    </h3>

                    <p class="text-xs text-gray-600">
                        <strong>Teacher ID:</strong> ${t.teacherId || ''}
                    </p>

                    <p class="text-xs text-gray-700">
                        <strong>পদবি:</strong> ${desigText}
                    </p>

                </div>

                <hr class="border-gray-200 my-1">

                <div>

                    <p class="text-[11px] text-gray-500 mb-1 font-bold">
                        সিগনেচার:
                    </p>

                    <img
                        src="${t.signature || ''}"
                        alt="Signature"
                        style="height: 20px; width: 50px; object-fit: contain;"
                        class="border border-gray-200 bg-gray-50 p-0.5"
                    >

                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


// ==========================================
// REMOVE TEACHER MODAL
// ==========================================

function openRemoveTeacherModal() {
    const modal = document.getElementById('removeTeacherModal');

    if (!modal) return;

    modal.classList.remove('hidden');

    const teacherIdInput =
        document.getElementById('removeTeacherId');

    const passwordInput =
        document.getElementById('removeTeacherPassword');

    if (teacherIdInput) {
        teacherIdInput.value = '';
        teacherIdInput.focus();
    }

    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.type = 'password';
    }
}


function closeRemoveTeacherModal() {
    const modal = document.getElementById('removeTeacherModal');

    if (!modal) return;

    modal.classList.add('hidden');

    const teacherIdInput =
        document.getElementById('removeTeacherId');

    const passwordInput =
        document.getElementById('removeTeacherPassword');

    if (teacherIdInput) {
        teacherIdInput.value = '';
    }

    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.type = 'password';
    }
}


// ==========================================
// REMOVE TEACHER ACCOUNT
// ==========================================

function removeTeacherAccount() {

    const teacherIdInput =
        document.getElementById('removeTeacherId');

    const passwordInput =
        document.getElementById('removeTeacherPassword');

    if (!teacherIdInput || !passwordInput) {
        alert('Teacher removal form পাওয়া যাচ্ছে না।');
        return;
    }

    const teacherId =
        teacherIdInput.value.trim();

    const password =
        passwordInput.value;

    if (!teacherId) {
        alert('অনুগ্রহ করে Teacher ID লিখুন।');
        teacherIdInput.focus();
        return;
    }

    if (!password) {
        alert('অনুগ্রহ করে Teacher Password লিখুন।');
        passwordInput.focus();
        return;
    }


    // ==========================================
    // 1. TEACHER ACCOUNT খোঁজা
    // ==========================================

    const storedTeacher =
        localStorage.getItem(teacherId);

    if (!storedTeacher) {
        alert('এই Teacher ID-এর কোনো account পাওয়া যায়নি।');
        return;
    }


    let teacherData;

    try {

        teacherData =
            JSON.parse(storedTeacher);

    } catch (error) {

        console.error(
            'Teacher data parse error:',
            error
        );

        alert(
            'Teacher data সঠিকভাবে পড়া যাচ্ছে না।'
        );

        return;
    }


    // ==========================================
    // 2. PASSWORD VERIFY
    // ==========================================

    if (
        teacherData.password !== password
    ) {

        alert(
            'Teacher ID অথবা Password সঠিক নয়। কোনো Teacher remove করা হয়নি।'
        );

        return;
    }


    // ==========================================
    // 3. REGISTERED TEACHER LIST থেকে ID বাদ
    // ==========================================

    let registeredIds = [];

    const rawRegisteredTeachers =
        localStorage.getItem(
            'LS_REGISTERED_TEACHERS'
        );

    if (rawRegisteredTeachers) {

        try {

            const parsedList =
                JSON.parse(
                    rawRegisteredTeachers
                );

            if (Array.isArray(parsedList)) {

                registeredIds =
                    parsedList
                        .map(item => {

                            if (
                                typeof item === 'string'
                            ) {
                                return item;
                            }

                            if (
                                item &&
                                typeof item === 'object' &&
                                item.teacherId
                            ) {
                                return item.teacherId;
                            }

                            return null;
                        })
                        .filter(Boolean);

            }

        } catch (error) {

            console.error(
                'Registered teacher list parse error:',
                error
            );

            alert(
                'Registered Teacher list সঠিকভাবে পড়া যাচ্ছে না। কোনো Teacher remove করা হয়নি।'
            );

            return;
        }
    }


    // ==========================================
    // 4. ID LIST থেকে TEACHER বাদ
    // ==========================================

    const updatedRegisteredIds =
        registeredIds.filter(
            id => id !== teacherId
        );


    // ==========================================
    // 5. TEACHER ACCOUNT DATA DELETE
    // ==========================================

    localStorage.removeItem(
        teacherId
    );


    // ==========================================
    // 6. UPDATED TEACHER ID LIST SAVE
    // ==========================================

    localStorage.setItem(
        'LS_REGISTERED_TEACHERS',
        JSON.stringify(
            updatedRegisteredIds
        )
    );


    // ==========================================
    // 7. CURRENT LOGIN SESSION CHECK
    // ==========================================

    const loggedInUserRaw =
        localStorage.getItem(
            'LS_LOGGED_IN_USER'
        );

    let loggedInUser = null;

    if (loggedInUserRaw) {

        try {

            loggedInUser =
                JSON.parse(
                    loggedInUserRaw
                );

        } catch (error) {

            console.error(
                'Logged-in teacher data parse error:',
                error
            );

        }
    }


    // যদি remove করা Teacher-ই বর্তমানে login করা থাকে,
    // তার login session-ও সম্পূর্ণভাবে remove হবে।

    if (
        loggedInUser &&
        loggedInUser.teacherId === teacherId
    ) {

        localStorage.removeItem(
            'LS_LOGGED_IN_USER'
        );

    }


    // ==========================================
    // 8. MODAL CLOSE
    // ==========================================

    closeRemoveTeacherModal();


    // ==========================================
    // 9. TEACHER INFORMATION REFRESH
    // ==========================================

    renderInformationTeachers();


    // ==========================================
    // 10. SUCCESS MESSAGE
    // ==========================================

    alert(
        `Teacher "${teacherId}" সফলভাবে Remove করা হয়েছে।`
    );


    // ==========================================
    // 11. CURRENT USER যদি নিজেই REMOVE হয়
    // ==========================================

    if (
        loggedInUser &&
        loggedInUser.teacherId === teacherId
    ) {

        window.location.href =
            'logging.html';

    }
}


// ==========================================
// 4. RECEIPT SIGNATURE DROPDOWN & SELECTOR
// ==========================================
function populateReceiptSignatureDropdowns() {
    const teachers = getRegisteredTeachers();

    ['office', 'student'].forEach(uniqueId => {
        const colSelect = document.getElementById(`collectorSelect_${uniqueId}`);
        const headSelect = document.getElementById(`headSelect_${uniqueId}`);

        if(colSelect) {
            colSelect.innerHTML = `<option value="">আদায়কারী সিলেক্ট করুন</option>`;
            teachers.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.teacherId;
                opt.textContent = `${t.firstName} ${t.lastName} (${t.teacherId})`;
                colSelect.appendChild(opt);
            });
        }

        if(headSelect) {
            headSelect.innerHTML = `<option value="">প্রধান শিক্ষক সিলেক্ট করুন</option>`;
            teachers.forEach(t => {
                if(t.designation === 'head_teacher') {
                    const opt = document.createElement('option');
                    opt.value = t.teacherId;
                    opt.textContent = `${t.firstName} ${t.lastName} (${t.teacherId})`;
                    headSelect.appendChild(opt);
                }
            });
        }

        const collectorApply = document.getElementById(`collectorApply_${uniqueId}`);
        const headApply = document.getElementById(`headApply_${uniqueId}`);
        const collectorControls = document.getElementById(`collectorControls_${uniqueId}`);
        const headControls = document.getElementById(`headControls_${uniqueId}`);
        const collectorSigImg = document.getElementById(`collectorSigImg_${uniqueId}`);
        const headSigImg = document.getElementById(`headSigImg_${uniqueId}`);

        if(collectorApply) collectorApply.classList.add('hidden');
        if(headApply) headApply.classList.add('hidden');

        if(collectorControls) collectorControls.classList.remove('hidden');
        if(headControls) headControls.classList.remove('hidden');

        if(collectorSigImg) {
            collectorSigImg.src = '';
            collectorSigImg.classList.add('hidden');
        }

        if(headSigImg) {
            headSigImg.src = '';
            headSigImg.classList.add('hidden');
        }
    });
}

// ==========================================
// RECEIPT SIGNATURE SELECT CHANGE
// ==========================================
function signatureSelectionChanged(uniqueId, type) {
    const selectEl = document.getElementById(`${type}Select_${uniqueId}`);
    const applyBtn = document.getElementById(`${type}Apply_${uniqueId}`);

    if(!selectEl || !applyBtn) return;

    if(selectEl.value) {
        applyBtn.classList.remove('hidden');
    } else {
        applyBtn.classList.add('hidden');
    }
}

// ==========================================
// APPLY RECEIPT SIGNATURE
// ==========================================
function applySignature(uniqueId, type) {
    const selectEl = document.getElementById(`${type}Select_${uniqueId}`);
    const imgEl = document.getElementById(`${type}SigImg_${uniqueId}`);
    const controlsEl = document.getElementById(`${type}Controls_${uniqueId}`);
    
    if(!selectEl || !imgEl) return;

    const selectedId = selectEl.value;

    if(!selectedId) {
        alert('অনুগ্রহ করে নাম সিলেক্ট করুন।');
        return;
    }

    const teachers = getRegisteredTeachers();
    const teacher = teachers.find(t => t.teacherId === selectedId);

    if(teacher && teacher.signature) {
        imgEl.src = teacher.signature;
        imgEl.classList.remove('hidden');

        if(controlsEl) {
            controlsEl.classList.add('hidden');
        }
    } else {
        alert('এই শিক্ষকের কোনো সিগনেচার পাওয়া যায়নি!');
        imgEl.classList.add('hidden');
    }
}

// ==========================================
// 5. STUDENT DUE CALCULATION
// ==========================================
function calculateStudentTotalUnpaid(st, cfg) {
    let due = 0;
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    
    let adPaid = st.admission || 0;
    if(adPaid < cfg.admission) due += (cfg.admission - adPaid);

    months.forEach(m => { 
        let mPaid = st[m] || 0;
        if(mPaid < cfg.monthly) due += (cfg.monthly - mPaid);
    });

    ['exam1','exam2','finalExam'].forEach(eKey => {
        let ePaid = st[eKey] || 0;
        if(ePaid < cfg.exam) due += (cfg.exam - ePaid);
    });

    due += (st.prevDue || 0);
    return due;
}

function getPreviousClass(currentClass) {
    const classes = ['প্লে', 'নার্সারি', 'ওয়ান', 'টু', 'থ্রি', 'ফোর', 'ফাইভ'];
    const idx = classes.indexOf(currentClass);
    if(idx > 0) return classes[idx - 1];
    return null;
}

function openClassTable(className) {
    currentSelectedClass = className;
    const titleEl = document.getElementById('currentClassTitle');
    if(titleEl) titleEl.innerText = 'শ্রেণি: ' + className + ' - শিক্ষার্থী ডাটাবেস (' + currentSession + ')';
    
    const cfg = feeStructure[className] || { admission: 0, monthly: 0, exam: 0 };
    const bannerEl = document.getElementById('classFeeBanner');
    if(bannerEl) {
        bannerEl.innerHTML = `
            <div>📌 <strong>নির্ধারিত ফি হিসাব:</strong></div>
            <div>ভর্তি/সেশন ফি: <span class="bg-white px-2 py-0.5 rounded text-blue-900 border font-black">${cfg.admission}/-</span></div>
            <div>মাসিক বেতন: <span class="bg-white px-2 py-0.5 rounded text-blue-900 border font-black">${cfg.monthly}/-</span></div>
            <div>পরীক্ষা ফি (প্রতি পরীক্ষা): <span class="bg-white px-2 py-0.5 rounded text-blue-900 border font-black">${cfg.exam}/-</span></div>
        `;
    }

    const prevClass = getPreviousClass(className);
    const prevSession = (parseInt(currentSession) - 1).toString();
    const prevSessionData = JSON.parse(localStorage.getItem(`LS_SCHOOL_DATA_${prevSession}`)) || {};
    const prevClassStudents = (prevClass && prevSessionData[prevClass]) ? prevSessionData[prevClass] : [];

    const currentClassStudents = sampleData[className] || [];
    const promoBox = document.getElementById('promotionBox');

    if (className !== 'প্লে' && prevClassStudents.length > 0 && currentClassStudents.length === 0 && promoBox) {
        promoBox.classList.remove('hidden');
        document.getElementById('prevClassLabel').innerText = `পূর্ববর্তী শ্রেণি: ${prevClass} (${prevSession})`;
        
        const promoContainer = document.getElementById('promotionStudentsContainer');
        promoContainer.innerHTML = '';

        prevClassStudents.forEach((st, idx) => {
            const row = document.createElement('div');
            row.className = "flex items-center justify-between border-b pb-2 text-xs";
            row.innerHTML = `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" checked value="${st.name}" data-prevroll="${st.roll}" class="promo-check w-4 h-4 text-blue-600">
                    <span class="font-bold text-gray-800">${st.name} (আগের রোল: ${st.roll})</span>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="font-bold text-gray-600">মেধা স্থান / নতুন রোল:</label>
                    <input type="number" value="${idx + 1}" data-student="${st.name}" class="promo-rank w-16 border p-1 rounded font-bold text-center text-blue-900">
                </div>
            `;
            promoContainer.appendChild(row);
        });
    } else if(promoBox) {
        promoBox.classList.add('hidden');
    }

    renderTable();
    showSection('classtable');
}

function submitPromotion() {
    const prevClass = getPreviousClass(currentSelectedClass);
    const prevSession = (parseInt(currentSession) - 1).toString();
    const prevSessionData = JSON.parse(localStorage.getItem(`LS_SCHOOL_DATA_${prevSession}`)) || {};
    const prevClassStudents = prevSessionData[prevClass] || [];
    const prevFeeCfg = (JSON.parse(localStorage.getItem(`LS_FEE_STRUCTURE_${prevSession}`)) || defaultFeeStructure)[prevClass] || { admission: 0, monthly: 0, exam: 0 };

    const checkBoxes = document.querySelectorAll('.promo-check:checked');
    if (checkBoxes.length === 0) {
        alert('অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
        return;
    }

    let promotedList = [];

    checkBoxes.forEach(cb => {
        const name = cb.value;
        const origStudent = prevClassStudents.find(s => s.name === name);
        const rankInput = document.querySelector(`.promo-rank[data-student="${name}"]`);
        const newRank = parseInt(rankInput.value) || 999;

        if (origStudent) {
            const totalPrevYearDue = calculateStudentTotalUnpaid(origStudent, prevFeeCfg);

            promotedList.push({
                roll: newRank,
                name: origStudent.name,

                // Student ID আগের সেশন থেকে একই থাকবে
                studentId: origStudent.studentId || generateStudentId(),

                admission: 0,
                jan: 0,
                feb: 0,
                mar: 0,
                apr: 0,
                may: 0,
                jun: 0,
                jul: 0,
                aug: 0,
                sep: 0,
                oct: 0,
                nov: 0,
                dec: 0,

                exam1: 0,
                exam2: 0,
                finalExam: 0,

                prevDue: totalPrevYearDue
            });
        }
    });

    promotedList.sort((a, b) => a.roll - b.roll);

    sampleData[currentSelectedClass] = promotedList;
    saveAndSyncData();

    document.getElementById('promotionBox').classList.add('hidden');
    renderTable();
    alert(`সফলভাবে ${promotedList.length} জন শিক্ষার্থী প্রমোশন পেয়ে শ্রেণি: ${currentSelectedClass}-এ যুক্ত হয়েছে!`);
}

function formatCellDisplay(paidVal, targetVal) {
    paidVal = paidVal || 0;
    if (paidVal === 0) return { html: 'Unpaid', class: 'bg-red-50 text-red-600' };
    
    let diff = targetVal - paidVal;
    if (diff > 0) {
        return { 
            html: `${paidVal}/- <span class="due-tag">(-${diff}/-)</span>`, 
            class: 'bg-green-50 text-green-800 font-bold' 
        };
    }
    return { html: `${paidVal}/-`, class: 'bg-green-100 text-green-800 font-bold' };
}

function renderTable() {
    const tbody = document.getElementById('studentTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const students = sampleData[currentSelectedClass] || [];
    const cfg = feeStructure[currentSelectedClass] || { admission: 0, monthly: 0, exam: 0 };

    students.forEach((st, index) => {
        const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        let currentDue = 0;
        
        let adPaid = st.admission || 0;
        if(adPaid < cfg.admission) currentDue += (cfg.admission - adPaid);

        months.forEach(m => { 
            let mPaid = st[m] || 0;
            if(mPaid < cfg.monthly) currentDue += (cfg.monthly - mPaid);
        });

        ['exam1','exam2','finalExam'].forEach(eKey => {
            let ePaid = st[eKey] || 0;
            if(ePaid < cfg.exam) currentDue += (cfg.exam - ePaid);
        });

        let tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50 text-center";

        let admissionDisp = formatCellDisplay(st.admission, cfg.admission);

        let monthCells = months.map(m => { 
            let disp = formatCellDisplay(st[m], cfg.monthly);
            return `<td onclick="alertCellStatus('${st.name}', '${m}', ${st[m] || 0})" class="p-1 border cursor-pointer ${disp.class}">${disp.html}</td>`;
        }).join('');

        let e1Disp = formatCellDisplay(st.exam1, cfg.exam);
        let e2Disp = formatCellDisplay(st.exam2, cfg.exam);
        let efDisp = formatCellDisplay(st.finalExam, cfg.exam);

        const studentId = st.studentId || '';

        tr.innerHTML = `
            <td class="p-2 border font-bold">${st.roll}</td>

            <td class="p-2 border font-bold text-left">${st.name}</td>

            <td class="p-1 border font-bold">
                <div class="flex flex-col items-center gap-1">
                    <span id="studentIdText_${index}">${studentId || 'ID নেই'}</span>

                    <button
                        onclick="editStudentId(${index})"
                        class="no-print bg-blue-700 hover:bg-blue-800 text-white px-2 py-0.5 rounded text-[10px] font-bold"
                    >
                        Edit
                    </button>
                </div>
            </td>

            <td class="p-1 border ${admissionDisp.class}">${admissionDisp.html}</td>

            ${monthCells}

            <td class="p-1 border ${e1Disp.class}">${e1Disp.html}</td>
            <td class="p-1 border ${e2Disp.class}">${e2Disp.html}</td>
            <td class="p-1 border ${efDisp.class}">${efDisp.html}</td>

            <td class="p-2 border font-bold text-red-600 bg-red-50">${currentDue}/-</td>

            <td class="p-2 border font-bold text-orange-600 bg-orange-50">${st.prevDue || 0}/-</td>
        `;

        tbody.appendChild(tr);
    });
}

function editStudentId(index) {
    const students = sampleData[currentSelectedClass] || [];
    const student = students[index];

    if(!student) {
        alert('শিক্ষার্থীর তথ্য পাওয়া যায়নি।');
        return;
    }

    const currentId = student.studentId || '';

    const newIdInput = prompt(
        `Student ID পরিবর্তন করুন:\n\nশিক্ষার্থী: ${student.name}\nবর্তমান ID: ${currentId || 'নেই'}\n\nনতুন Student ID লিখুন:`,
        currentId
    );

    // Cancel করলে কিছু পরিবর্তন হবে না
    if(newIdInput === null) {
        return;
    }

    const newId = newIdInput.trim();

    // ফাঁকা রাখলে automatic ID তৈরি হবে
    const finalId = newId || generateStudentId();

    // একই ID অন্য ছাত্র ব্যবহার করছে কিনা পরীক্ষা
    if(!isStudentIdUnique(finalId, student)) {
        alert(
            `Student ID "${finalId}" ইতিমধ্যে অন্য একজন শিক্ষার্থীর জন্য ব্যবহার করা হয়েছে।\n\nঅনুগ্রহ করে অন্য একটি ID দিন।`
        );
        return;
    }

    student.studentId = finalId;

    saveAndSyncData();
    renderTable();

    alert(`Student ID সফলভাবে আপডেট হয়েছে!\n\nনতুন ID: ${finalId}`);
}

function alertCellStatus(name, month, amount) {
    if(amount > 0) {
        alert(`${name}-এর ${month.toUpperCase()} মাসের জমা ফি: ${amount} টাকা।`);
    } else {
        alert(`${name}-এর ${month.toUpperCase()} মাসের ফি বকেয়া (Unpaid) রয়েছে!`);
    }
}

// ==========================================
// 6. RECEIPT FORM
// ==========================================
function openReceiptForm() {
    editingOldReceiptSerial = null;
    const paidBtn = document.getElementById('btnReceiptPaid');
    const updateBtn = document.getElementById('btnReceiptUpdate');
    if(paidBtn) paidBtn.classList.remove('hidden');
    if(updateBtn) updateBtn.classList.add('hidden');
    
    const selClass = document.getElementById('receiptClassSelect');
    if(selClass) {
        const selectedClass = selClass.value;
        document.getElementById('rClass').value = selectedClass;
        document.getElementById('rSerial').value = getReceiptSerialForClass(selectedClass);
    }
    showSection('receiptform');
}

function toggleSubSelects(selectEl) {
    const parent = selectEl.closest('.receipt-item-row');
    const monthTarget = parent.querySelector('.rMonthTarget');
    const examTarget = parent.querySelector('.rExamTarget');

    if(monthTarget) monthTarget.classList.add('hidden');
    if(examTarget) examTarget.classList.add('hidden');

    if (selectEl.value === 'মাসিক বেতন' && monthTarget) {
        monthTarget.classList.remove('hidden');
    } else if (selectEl.value === 'পরীক্ষা ফি' && examTarget) {
        examTarget.classList.remove('hidden');
    }
}

function addReceiptRow() {
    const container = document.getElementById('receiptItemsContainer');
    if(!container) return;
    const div = document.createElement('div');
    div.className = "flex space-x-2 items-center mt-2 receipt-item-row";
    div.innerHTML = `
        <div class="w-1/2 flex space-x-1">
            <select class="rItemType border p-2 rounded text-sm w-full" onchange="toggleSubSelects(this)">
                <option value="ভর্তি/সেশন">১। ভর্তি / সেশন</option>
                <option value="মাসিক বেতন">২। মাসিক বেতন</option>
                <option value="পরীক্ষা ফি">৩। পরীক্ষা ফি</option>
                <option value="বকেয়া">৪। বকেয়া</option>
                <option value="জরিমানা">৫। জরিমানা</option>
                <option value="আইডি কার্ড">৬। আইডি কার্ড/লেস</option>
                <option value="প্রসেস ফি">৭। প্রসেস ফি</option>
                <option value="খেলাধুলা">৮। খেলাধুলা/মিলাদ</option>
                <option value="বিবিধ">৯। বিবিধ</option>
            </select>
            <select class="rMonthTarget border p-2 rounded text-sm hidden w-full">
                <option value="auto">স্বয়ংক্রিয় (তারিখ অনুযায়ী)</option>
                <option value="jan">জানুয়ারি</option>
                <option value="feb">ফেব্রুয়ারি</option>
                <option value="mar">মার্চ</option>
                <option value="apr">এপ্রিল</option>
                <option value="may">মে</option>
                <option value="jun">জুন</option>
                <option value="jul">জুলাই</option>
                <option value="aug">আগস্ট</option>
                <option value="sep">সেপ্টেম্বর</option>
                <option value="oct">অক্টোবর</option>
                <option value="nov">নভেম্বর</option>
                <option value="dec">ডিসেম্বর</option>
            </select>
            <select class="rExamTarget border p-2 rounded text-sm hidden w-full">
                <option value="exam1">১ম মূল্যায়ন</option>
                <option value="exam2">২য় মূল্যায়ন</option>
                <option value="finalExam">বার্ষিক পরীক্ষা</option>
            </select>
        </div>
        <div class="w-1/2">
            <input type="number" placeholder="টাকা" required class="rItemAmount border p-2 rounded text-sm w-full">
        </div>
    `;
    container.appendChild(div);
}

function generateReceiptPreview(e) {
    if(e) e.preventDefault();

    const name = document.getElementById('rStudentName').value;
    const studentId = document.getElementById('rStudentId').value.trim();
    const roll = document.getElementById('rStudentRoll').value;
    const className = document.getElementById('rClass').value;
    const serial = document.getElementById('rSerial').value;
    const date = document.getElementById('rDate').value;

    // =========================================================
    // FEE LIMIT VALIDATION - FINAL SUBMIT PROTECTION
    // =========================================================
    const cfg = feeStructure[className] || {
        admission: 0,
        monthly: 0,
        exam: 0
    };

    const rows = document.querySelectorAll('.receipt-item-row');

    for (const row of rows) {

        const typeEl = row.querySelector('.rItemType');
        const amountEl = row.querySelector('.rItemAmount');

        const type = typeEl ? typeEl.value : '';
        const amount = parseFloat(amountEl.value) || 0;

        let maxFee = null;

        if (type === 'ভর্তি/সেশন') {
            maxFee = Number(cfg.admission) || 0;
        }
        else if (type === 'মাসিক বেতন') {
            maxFee = Number(cfg.monthly) || 0;
        }
        else if (type === 'পরীক্ষা ফি') {
            maxFee = Number(cfg.exam) || 0;
        }

        // শুধুমাত্র নির্ধারিত ৩ ধরনের Fee-এর জন্য limit
        if (maxFee !== null && amount > maxFee) {

            amountEl.classList.add('border-red-600', 'text-red-600');

            alert(
                `${amount}/- টাকা নির্ধারিত টাকার থেকে বেশি হতে পারবে না।`
            );

            amountEl.focus();
            return;
        }
    }

    // =========================================================
    // EXISTING RECEIPT GENERATION CODE
    // =========================================================

    document.querySelectorAll('.outName').forEach(
        el => el.innerText = name
    );

    document.querySelectorAll('.outStudentId').forEach(
        el => el.innerText = studentId || '—'
    );

    document.querySelectorAll('.outRoll').forEach(
        el => el.innerText = roll
    );

    document.querySelectorAll('.outClass').forEach(
        el => el.innerText = className
    );

    document.querySelectorAll('.outSerial').forEach(
        el => el.innerText = serial
    );

    document.querySelectorAll('.outDate').forEach(
        el => el.innerText = date
    );

    let total = 0;
    let rowsHtml = '';
    currentGeneratedItems = [];

    rows.forEach((row) => {

        let type = row.querySelector('.rItemType').value;

        let monthTarget =
            row.querySelector('.rMonthTarget')
                ? row.querySelector('.rMonthTarget').value
                : 'auto';

        let examTarget =
            row.querySelector('.rExamTarget')
                ? row.querySelector('.rExamTarget').value
                : 'exam1';

        let amt =
            parseFloat(row.querySelector('.rItemAmount').value) || 0;

        total += amt;

        currentGeneratedItems.push({
            type: type,
            monthTarget: monthTarget,
            examTarget: examTarget,
            amount: amt,
            date: date
        });

        let label = type;

        if (type === 'মাসিক বেতন' && monthTarget !== 'auto') {

            const monthMap = {
                jan:'জানুয়ারি',
                feb:'ফেব্রুয়ারি',
                mar:'মার্চ',
                apr:'এপ্রিল',
                may:'মে',
                jun:'জুন',
                jul:'জুলাই',
                aug:'আগস্ট',
                sep:'সেপ্টেম্বর',
                oct:'অক্টোবর',
                nov:'নভেম্বর',
                dec:'ডিসেম্বর'
            };

            label += ` (${monthMap[monthTarget] || ''})`;

        } else if (type === 'পরীক্ষা ফি') {

            const examMap = {
                exam1:'১ম মূল্যায়ন',
                exam2:'২য় মূল্যায়ন',
                finalExam:'বার্ষিক পরীক্ষা'
            };

            label += ` (${examMap[examTarget] || ''})`;
        }

        rowsHtml += `
            <tr>
                <td class="border border-red-800 p-1">${label}</td>
                <td class="border border-red-800 p-1 text-center">${amt}/-</td>
            </tr>
        `;
    });

    document.querySelectorAll('.outItemsBody').forEach(
        el => el.innerHTML = rowsHtml
    );

    document.querySelectorAll('.outTotalAmount').forEach(
        el => el.innerText = total + '/-'
    );

    const paidBtn = document.getElementById('btnReceiptPaid');
    const updateBtn = document.getElementById('btnReceiptUpdate');

    if(editingOldReceiptSerial) {

        if(paidBtn) paidBtn.classList.add('hidden');

        if(updateBtn) updateBtn.classList.remove('hidden');

    } else {

        if(paidBtn) paidBtn.classList.remove('hidden');

        if(updateBtn) updateBtn.classList.add('hidden');
    }

    showSection('receiptpreview');
}


// =========================================================
// FEE LIMIT VALIDATION
// Typing = শুধু লাল দেখাবে
// Blur/Click = Alert
// Submit = Final protection
// =========================================================

function getReceiptFeeLimit(type, className) {

    const cfg = feeStructure[className] || {
        admission: 0,
        monthly: 0,
        exam: 0
    };

    if (type === 'ভর্তি/সেশন') {
        return Number(cfg.admission) || 0;
    }

    if (type === 'মাসিক বেতন') {
        return Number(cfg.monthly) || 0;
    }

    if (type === 'পরীক্ষা ফি') {
        return Number(cfg.exam) || 0;
    }

    // অন্যান্য Fee-এর কোনো নতুন limit নেই
    return null;
}


function validateReceiptAmountInput(input, showAlert = false) {

    const row = input.closest('.receipt-item-row');

    if (!row) return true;

    const typeEl = row.querySelector('.rItemType');

    if (!typeEl) return true;

    const type = typeEl.value;

    const className =
        document.getElementById('rClass')?.value || '';

    const amount = parseFloat(input.value) || 0;

    const maxFee = getReceiptFeeLimit(type, className);

    // যেসব Fee-এর নতুন limit নেই
    if (maxFee === null) {

        input.classList.remove(
            'border-red-600',
            'text-red-600',
            'bg-red-50'
        );

        return true;
    }

    // নির্ধারিত টাকার বেশি
    if (amount > maxFee) {

        // Typing-এর সময় শুধু লাল
        input.classList.add(
            'border-red-600',
            'text-red-600',
            'bg-red-50'
        );

        // Click/Blur অথবা Submit-এর সময় Alert
        if (showAlert) {

            alert(
                `${input.value}/- টাকা নির্ধারিত টাকার থেকে বেশি হতে পারবে না।`
            );

            input.focus();
        }

        return false;
    }

    // ঠিক থাকলে আগের লাল রং সরবে
    input.classList.remove(
        'border-red-600',
        'text-red-600',
        'bg-red-50'
    );

    return true;
}


// =========================================================
// ১. TYPING-এর সময়
// শুধু লাল দেখাবে, Alert নয়
// =========================================================

document.addEventListener('input', function(e) {

    if (e.target.classList.contains('rItemAmount')) {

        validateReceiptAmountInput(
            e.target,
            false
        );
    }

});


// =========================================================
// ২. INPUT থেকে বের হলে
// Alert দেখাবে
// =========================================================

document.addEventListener('blur', function(e) {

    if (e.target.classList.contains('rItemAmount')) {

        validateReceiptAmountInput(
            e.target,
            true
        );
    }

}, true);


// =========================================================
// ৩. Fee Type পরিবর্তন করলে
// Amount আবার check হবে
// =========================================================

document.addEventListener('change', function(e) {

    if (e.target.classList.contains('rItemType')) {

        const row =
            e.target.closest('.receipt-item-row');

        if (!row) return;

        const amountInput =
            row.querySelector('.rItemAmount');

        if (amountInput) {

            validateReceiptAmountInput(
                amountInput,
                false
            );
        }
    }

});


function getMonthKeyFromDate(dateStr) {
    const monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    if (!dateStr) return monthKeys[new Date().getMonth()];
    const d = new Date(dateStr);
    return monthKeys[d.getMonth()];
}

function processItemsToDatabase(student, itemsList, className, isReverse = false) {
    const cfg = feeStructure[className] || { admission: 1000, monthly: 500, exam: 200 };
    const monthsList = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

    itemsList.forEach(item => {
        let amountToCredit = (item.amount || 0) * (isReverse ? -1 : 1);

        if (item.type === 'ভর্তি/সেশন') {
            let currentAd = student.admission || 0;
            let newAd = currentAd + amountToCredit;
            if (!isReverse) {
                if (newAd > cfg.admission) newAd = cfg.admission;
            }
            if (newAd < 0) newAd = 0;
            student.admission = newAd;
        }
        else if (item.type === 'মাসিক বেতন') {
            let startMonthIdx = 0;
            if (item.monthTarget && item.monthTarget !== 'auto') {
                startMonthIdx = monthsList.indexOf(item.monthTarget);
                if (startMonthIdx === -1) startMonthIdx = 0;
            } else {
                let key = getMonthKeyFromDate(item.date);
                startMonthIdx = monthsList.indexOf(key);
            }

            if (isReverse) {
                let remRev = Math.abs(item.amount || 0);
                for (let i = startMonthIdx; i < monthsList.length && remRev > 0; i++) {
                    let mKey = monthsList[i];
                    let currentPaid = student[mKey] || 0;
                    if (currentPaid >= remRev) {
                        student[mKey] = currentPaid - remRev;
                        remRev = 0;
                    } else {
                        remRev -= currentPaid;
                        student[mKey] = 0;
                    }
                }
            } else {
                for (let i = startMonthIdx; i < monthsList.length && amountToCredit > 0; i++) {
                    let mKey = monthsList[i];
                    let currentPaid = student[mKey] || 0;
                    let needed = cfg.monthly - currentPaid;

                    if (needed > 0) {
                        if (amountToCredit >= needed) {
                            student[mKey] = cfg.monthly;
                            amountToCredit -= needed;
                        } else {
                            student[mKey] = currentPaid + amountToCredit;
                            amountToCredit = 0;
                        }
                    }
                }
                if (amountToCredit > 0) {
                    student.dec = (student.dec || 0) + amountToCredit;
                }
            }
        } 
        else if (item.type === 'পরীক্ষা ফি') {
            let targetExam = item.examTarget || 'exam1';
            let currentExamPaid = student[targetExam] || 0;
            let newExamPaid = currentExamPaid + amountToCredit;
            if (!isReverse) {
                if (newExamPaid > cfg.exam) newExamPaid = cfg.exam;
            }
            if (newExamPaid < 0) newExamPaid = 0;
            student[targetExam] = newExamPaid;
        } 
        else if (item.type === 'বকেয়া') {
            if (isReverse) {
                student.prevDue = (student.prevDue || 0) + Math.abs(item.amount || 0);
            } else {
                if (student.prevDue >= amountToCredit) {
                    student.prevDue -= amountToCredit;
                } else {
                    student.prevDue = 0;
                }
            }
        }
    });
}

function markReceiptPaid() {
    const studentName = document.querySelector('#printableReceipt .outName').innerText.trim();

    const studentIdText = document.querySelector('#printableReceipt .outStudentId')
        ? document.querySelector('#printableReceipt .outStudentId').innerText.trim()
        : '';

    const className = document.querySelector('#printableReceipt .outClass').innerText.trim();
    const roll = document.querySelector('#printableReceipt .outRoll').innerText.trim();
    const serial = document.querySelector('#printableReceipt .outSerial').innerText.trim();
    const date = document.querySelector('#printableReceipt .outDate').innerText.trim();

    const totalAmountStr = document.querySelector('#printableReceipt .outTotalAmount')
        .innerText
        .replace('/-', '')
        .trim();

    const paidAmount = parseFloat(totalAmountStr) || 0;

    const studentId =
        studentIdText && studentIdText !== '—'
            ? studentIdText
            : '';

    if (sampleData[className]) {

        let student = null;

        // =====================================================
        // Student ID দেওয়া থাকলে শুধুমাত্র Student ID দিয়েই
        // exact student খোঁজা হবে
        // =====================================================
        if (studentId) {

            student = sampleData[className].find(
                s =>
                    String(s.studentId || '').trim() ===
                    String(studentId).trim()
            );

            // Student ID দেওয়া আছে কিন্তু match হয়নি
            // হলে Name/Roll দিয়ে অন্য student খোঁজা যাবে না
            if (!student) {
                alert(
                    `Student ID "${studentId}" এই শ্রেণির ডাটাবেজে পাওয়া যায়নি।\n\nনাম বা রোল দিয়ে অন্য কোনো শিক্ষার্থী নির্বাচন করা হবে না।`
                );
                return;
            }

        } else {

            // =================================================
            // Student ID না থাকলে পুরোনো Name/Roll system
            // ব্যবহার করা হবে
            // =================================================
            student = sampleData[className].find(
                s =>
                    s.name === studentName ||
                    String(s.roll) === String(roll)
            );

            if (!student) {
                alert(
                    "শিক্ষার্থীর নাম/রোল ডাটাবেসে পাওয়া যায়নি!"
                );
                return;
            }
        }

        // =====================================================
        // Exact student-এর payment database-এ যোগ হবে
        // =====================================================
        processItemsToDatabase(
            student,
            currentGeneratedItems,
            className,
            false
        );

        const itemsBodyHtml =
            document.querySelector('.outItemsBody').innerHTML;

        savedReceipts.push({
            serial: serial,
            name: studentName,
            studentId: student.studentId || studentId || '',
            roll: roll,
            className: className,
            session: currentSession,
            date: date,
            total: paidAmount,
            itemsHtml: itemsBodyHtml,
            itemsList: currentGeneratedItems
        });

        if (!receiptCounters[className]) {
            receiptCounters[className] = 1;
        }

        receiptCounters[className] += 1;

        saveAndSyncData();

        alert(
            `সফলভাবে ${paidAmount} টাকা জমা করা হয়েছে এবং ডাটাবেস আপডেট করা হয়েছে!`
        );

        openClassTable(className);
        return;
    }

    alert(
        "নির্বাচিত শ্রেণির ডাটাবেসে কোনো শিক্ষার্থী পাওয়া যায়নি!"
    );

    showSection('dashboard');
}

function updateEditedReceipt() {
    if (!editingOldReceiptSerial) return;

    const studentName = document.querySelector('#printableReceipt .outName').innerText.trim();

    const studentIdEl = document.querySelector('#printableReceipt .outStudentId');
    const studentId = studentIdEl
        ? studentIdEl.innerText.trim()
        : '';

    const className = document.querySelector('#printableReceipt .outClass').innerText.trim();
    const roll = document.querySelector('#printableReceipt .outRoll').innerText.trim();
    const date = document.querySelector('#printableReceipt .outDate').innerText.trim();

    const totalAmountStr = document
        .querySelector('#printableReceipt .outTotalAmount')
        .innerText
        .replace('/-', '')
        .trim();

    const totalAmount = parseFloat(totalAmountStr) || 0;

    const receiptIdx = savedReceipts.findIndex(
        r => r.serial === editingOldReceiptSerial
    );

    if (receiptIdx !== -1) {

        let oldReceipt = savedReceipts[receiptIdx];

        // =====================================================
        // পুরোনো Receipt-এর payment reverse
        // Student ID থাকলে শুধুমাত্র Student ID দিয়ে খোঁজা হবে
        // =====================================================
        if (sampleData[oldReceipt.className]) {

            let oldStudent = null;

            if (oldReceipt.studentId) {

                oldStudent = sampleData[oldReceipt.className].find(
                    s =>
                        String(s.studentId || '').trim() ===
                        String(oldReceipt.studentId).trim()
                );

                // পুরোনো Receipt-এ Student ID ছিল কিন্তু
                // সেই ID-এর student পাওয়া যায়নি
                if (!oldStudent) {
                    alert(
                        `পুরোনো Receipt-এর Student ID "${oldReceipt.studentId}" ডাটাবেজে পাওয়া যায়নি।\n\nPayment reverse করা হয়নি।`
                    );
                    return;
                }

            } else {

                // পুরোনো Receipt-এ Student ID না থাকলে
                // পুরোনো Roll system ব্যবহার হবে
                oldStudent = sampleData[oldReceipt.className].find(
                    s => String(s.roll) === String(oldReceipt.roll)
                );

                if (!oldStudent) {
                    alert(
                        "পুরোনো Receipt-এর শিক্ষার্থী ডাটাবেজে পাওয়া যায়নি।"
                    );
                    return;
                }
            }

            if (oldStudent && oldReceipt.itemsList) {

                processItemsToDatabase(
                    oldStudent,
                    oldReceipt.itemsList,
                    oldReceipt.className,
                    true
                );
            }
        }

        // =====================================================
        // নতুন Receipt-এর student খোঁজা
        // Student ID থাকলে শুধুমাত্র Student ID
        // =====================================================
        if (sampleData[className]) {

            let newStudent = null;

            if (studentId && studentId !== '—') {

                newStudent = sampleData[className].find(
                    s =>
                        String(s.studentId || '').trim() ===
                        String(studentId).trim()
                );

                // Student ID দেওয়া আছে কিন্তু পাওয়া যায়নি
                // Name/Roll দিয়ে অন্য student নেওয়া যাবে না
                if (!newStudent) {
                    alert(
                        `Student ID "${studentId}" এই শ্রেণির ডাটাবেজে পাওয়া যায়নি।\n\nনাম বা রোল দিয়ে অন্য কোনো শিক্ষার্থী নির্বাচন করা হবে না।`
                    );
                    return;
                }

            } else {

                // Student ID না থাকলে পুরোনো Roll/Name system
                newStudent = sampleData[className].find(
                    s =>
                        String(s.roll) === String(roll) ||
                        s.name === studentName
                );

                if (!newStudent) {
                    alert(
                        "শিক্ষার্থীর নাম/রোল ডাটাবেজে পাওয়া যায়নি!"
                    );
                    return;
                }
            }

            processItemsToDatabase(
                newStudent,
                currentGeneratedItems,
                className,
                false
            );
        }

        // =====================================================
// Updated Receipt Save + Edit Tracking
// =====================================================

// পুরোনো ও নতুন Receipt-এর মোট টাকার পার্থক্য
const oldTotalAmount =
    Number(oldReceipt.total) || 0;

const receiptEditDifference =
    totalAmount - oldTotalAmount;

// বর্তমান Edit-এর তারিখ
const now = new Date();

const editDay =
    String(now.getDate()).padStart(2, '0');

const editMonth =
    String(now.getMonth() + 1).padStart(2, '0');

const editYear =
    now.getFullYear();

const receiptEditDate =
    `${editDay}-${editMonth}-${editYear}`;

savedReceipts[receiptIdx] = {
    ...oldReceipt,

    serial: editingOldReceiptSerial,
    name: studentName,

    studentId:
        studentId && studentId !== '—'
            ? studentId
            : oldReceipt.studentId || '',

    roll: roll,
    className: className,
    date: date,
    total: totalAmount,

    itemsHtml:
        document.querySelector('.outItemsBody').innerHTML,

    itemsList: currentGeneratedItems,

    // =================================================
    // Receipt Edit Tracking
    // =================================================
    editInfo: {
        oldAmount: oldTotalAmount,
        newAmount: totalAmount,
        difference: receiptEditDifference,
        editDate: receiptEditDate
    }
};

        saveAndSyncData();

        alert(
            `রশীদ (${editingOldReceiptSerial}) সফলভাবে এডিট ও আপডেট করা হয়েছে!`
        );

        editingOldReceiptSerial = null;
        showSection('dashboard');

    } else {

        alert('পুরাতন রশীদটি ডাটাবেজে পাওয়া যায়নি!');
    }
}

function editReceiptForm() {
    showSection('receiptform');
}

// ==========================================
// RECEIPT PDF
// ==========================================
function downloadReceiptPDF() {

    const element =
        document.getElementById('printableReceipt');

    if (!element) return;

    const controls =
        element.querySelectorAll('.no-print');

    const oldDisplays = [];

    controls.forEach(control => {
        oldDisplays.push(control.style.display);
        control.style.display = 'none';
    });

    const pdfContainer =
        document.createElement('div');

    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '0';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '794px';
    pdfContainer.style.background = '#ffffff';
    pdfContainer.style.zIndex = '2147483647';
    pdfContainer.style.padding = '0';
    pdfContainer.style.margin = '0';

    const clone =
        element.cloneNode(true);

    clone.style.display = 'block';
    clone.style.width = '100%';
    clone.style.margin = '0';
    clone.style.background = '#ffffff';

    pdfContainer.appendChild(clone);
    document.body.appendChild(pdfContainer);

    const opt = {

        margin: 8,

        filename: 'Money_Receipt.pdf',

        image: {
            type: 'jpeg',
            quality: 0.98
        },

        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0
        },

        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },

        pagebreak: {
            mode: ['css', 'legacy'],
            avoid: ['tr']
        }

    };

    html2pdf()
        .set(opt)
        .from(pdfContainer)
        .save()
        .then(() => {

            document.body.removeChild(
                pdfContainer
            );

            controls.forEach((control, index) => {
                control.style.display =
                    oldDisplays[index];
            });

        })
        .catch(error => {

            console.error(
                'Receipt PDF Error:',
                error
            );

            if (
                document.body.contains(
                    pdfContainer
                )
            ) {
                document.body.removeChild(
                    pdfContainer
                );
            }

            controls.forEach((control, index) => {
                control.style.display =
                    oldDisplays[index];
            });

            alert(
                'PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
            );

        });
}

// ==========================================
// 7. MONTHLY BILL
// ==========================================
function triggerEndOfMonthAlert() {
    alert("চলতি মাসের বিল প্রস্তুত করার সময় হয়েছে!");
    loadBillStudents();
    showSection('monthlybill');
}

function loadBillStudents() {
    const sel = document.getElementById('billClassSelect');
    if(!sel) return;
    const selectedClass = sel.value;
    const container = document.getElementById('billStudentsList');
    if(!container) return;
    container.innerHTML = '';

    const students = sampleData[selectedClass] || [];
    students.forEach(st => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-gray-50 p-3 rounded border";
        div.innerHTML = `
            <div>
                <p class="font-bold text-sm">${st.name}</p>
                <p class="text-xs text-gray-500">রোল: ${st.roll} | শ্রেণি: ${selectedClass}</p>
            </div>
            <button onclick="generateBillPaper('${st.name}', '${selectedClass}', ${st.roll})" class="btn-primary text-xs">রেডি করুন</button>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// MONTHLY BILL HEAD TEACHER DROPDOWN
// ==========================================
function populateBillHeadTeacherDropdown() {
    const selectEl = document.getElementById('billHeadSelect');
    const applyBtn = document.getElementById('billHeadApply');
    const controlsEl = document.getElementById('billHeadControls');
    const imgEl = document.getElementById('billHeadSigImg');

    if(!selectEl) return;

    const teachers = getRegisteredTeachers();

    selectEl.innerHTML = `<option value="">প্রধান শিক্ষক সিলেক্ট করুন</option>`;

    teachers.forEach(t => {
        if(t.designation === 'head_teacher') {
            const opt = document.createElement('option');
            opt.value = t.teacherId;
            opt.textContent = `${t.firstName} ${t.lastName} (${t.teacherId})`;
            selectEl.appendChild(opt);
        }
    });

    if(applyBtn) applyBtn.classList.add('hidden');
    if(controlsEl) controlsEl.classList.remove('hidden');

    if(imgEl) {
        imgEl.src = '';
        imgEl.classList.add('hidden');
    }
}

// ==========================================
// MONTHLY BILL HEAD TEACHER SELECT CHANGE
// ==========================================
function billHeadSignatureSelectionChanged() {
    const selectEl = document.getElementById('billHeadSelect');
    const applyBtn = document.getElementById('billHeadApply');

    if(!selectEl || !applyBtn) return;

    if(selectEl.value) {
        applyBtn.classList.remove('hidden');
    } else {
        applyBtn.classList.add('hidden');
    }
}

// ==========================================
// APPLY MONTHLY BILL HEAD TEACHER SIGNATURE
// ==========================================
function applyBillHeadTeacherSignature() {
    const selectEl = document.getElementById('billHeadSelect');
    const imgEl = document.getElementById('billHeadSigImg');
    const controlsEl = document.getElementById('billHeadControls');

    if(!selectEl || !imgEl) return;

    const selectedId = selectEl.value;

    if(!selectedId) {
        alert('অনুগ্রহ করে প্রধান শিক্ষক সিলেক্ট করুন।');
        return;
    }

    const teachers = getRegisteredTeachers();

    // শুধুমাত্র Head Teacher
    const teacher = teachers.find(t =>
        t.teacherId === selectedId &&
        t.designation === 'head_teacher'
    );

    if(teacher && teacher.signature) {
        imgEl.src = teacher.signature;
        imgEl.classList.remove('hidden');

        // Signature বসানোর পর selection + OK পুরোপুরি hide
        if(controlsEl) {
            controlsEl.classList.add('hidden');
        }
    } else {
        alert('এই প্রধান শিক্ষকের কোনো সিগনেচার পাওয়া যায়নি!');
        imgEl.classList.add('hidden');
    }
}

function generateBillPaper(name, className, roll) {
    document.getElementById('bStudentName').innerText = name;
    document.getElementById('bClass').innerText = className;
    document.getElementById('bDate').innerText = new Date().toLocaleDateString('bn-BD');

    const cfg = feeStructure[className] || { admission: 1000, monthly: 500, exam: 200 };
    const students = sampleData[className] || [];
    const st = students.find(s => s.roll == roll || s.name === name) || {};

    const monthsList = [
        { key: 'jan', name: 'জানু' }, { key: 'feb', name: 'ফেব্রু' }, { key: 'mar', name: 'মার্চ' },
        { key: 'apr', name: 'এপ্রিল' }, { key: 'may', name: 'মে' }, { key: 'jun', name: 'জুন' },
        { key: 'jul', name: 'জুলাই' }, { key: 'aug', name: 'আগস্ট' }, { key: 'sep', name: 'সেপ্টে' },
        { key: 'oct', name: 'অক্টো' }, { key: 'nov', name: 'নভে' }, { key: 'dec', name: 'ডিসে' }
    ];

    const currentMonthIdx = new Date().getMonth(); 
    let tbodyHtml = '';
    let sl = 1;
    let totalDue = 0;

    let adPaid = st.admission || 0;
    if (adPaid < cfg.admission) {
        let adDue = cfg.admission - adPaid;
        totalDue += adDue;
        tbodyHtml += `<tr>
            <td class="border border-black p-1">০${sl++}</td>
            <td class="border border-black p-1 text-left px-2">সেশন/ভর্তি ফি (বকেয়া)</td>
            <td class="border border-black p-1 font-bold text-red-600">${adDue}/-</td>
        </tr>`;
    }

    let currentMonthKey = monthsList[currentMonthIdx].key;
    let currentMonthPaid = st[currentMonthKey] || 0;
    let currentMonthDue = cfg.monthly - currentMonthPaid;
    if (currentMonthDue > 0) {
        totalDue += currentMonthDue;
        tbodyHtml += `<tr>
            <td class="border border-black p-1">০${sl++}</td>
            <td class="border border-black p-1 text-left px-2">চলতি মাসের বেতন (${monthsList[currentMonthIdx].name})</td>
            <td class="border border-black p-1">${currentMonthDue}/-</td>
        </tr>`;
    }

    let prevMonthsNames = [];
    let prevMonthsDue = 0;
    for (let i = 0; i < currentMonthIdx; i++) {
        let mKey = monthsList[i].key;
        let mPaid = st[mKey] || 0;
        if (mPaid < cfg.monthly) {
            prevMonthsDue += (cfg.monthly - mPaid);
            prevMonthsNames.push(monthsList[i].name);
        }
    }

    if (prevMonthsDue > 0) {
        totalDue += prevMonthsDue;
        tbodyHtml += `<tr>
            <td class="border border-black p-1">০${sl++}</td>
            <td class="border border-black p-1 text-left px-2">বিগত মাসের বেতন (${prevMonthsNames.join(', ')})</td>
            <td class="border border-black p-1 font-bold text-red-600">${prevMonthsDue}/-</td>
        </tr>`;
    }

    const examList = [
        { key: 'exam1', name: '১ম মূল্যায়ন' },
        { key: 'exam2', name: '২য় মূল্যায়ন' },
        { key: 'finalExam', name: 'বার্ষিক পরীক্ষা' }
    ];

    let unpaidExams = [];
    let examDueTotal = 0;

    examList.forEach(ex => {
        let exPaid = st[ex.key] || 0;
        if (exPaid < cfg.exam) {
            examDueTotal += (cfg.exam - exPaid);
            unpaidExams.push(ex.name);
        }
    });

    if (examDueTotal > 0) {
        totalDue += examDueTotal;
        tbodyHtml += `<tr>
            <td class="border border-black p-1">০${sl++}</td>
            <td class="border border-black p-1 text-left px-2">পরীক্ষা ফি (${unpaidExams.join(', ')})</td>
            <td class="border border-black p-1 font-bold text-red-600">${examDueTotal}/-</td>
        </tr>`;
    }

    let prevYearDue = st.prevDue || 0;
    if (prevYearDue > 0) {
        totalDue += prevYearDue;
        tbodyHtml += `<tr>
            <td class="border border-black p-1">০${sl++}</td>
            <td class="border border-black p-1 text-left px-2">গত বছরের বকেয়া</td>
            <td class="border border-black p-1 font-bold text-red-600">${prevYearDue}/-</td>
        </tr>`;
    }

    if (tbodyHtml === '') {
        tbodyHtml = `<tr><td colspan="3" class="border border-black p-2 text-center text-green-700 font-bold">সকল ফি পরিশোধিত (কোন বকেয়া নেই)</td></tr>`;
    }

    document.getElementById('bTableBody').innerHTML = tbodyHtml;
    document.getElementById('bTotalDue').innerText = totalDue + '/-';

    // নতুন বিল তৈরি হলে Head Teacher signature controls reset হবে
    populateBillHeadTeacherDropdown();

    showSection('billpreview');
}

// ==========================================
// MONTHLY BILL PDF
// ==========================================
function downloadBillPDF() {

    const element =
        document.getElementById('billPaper');

    if (!element) return;

    if (
        typeof html2pdf === 'undefined'
    ) {

        alert(
            'PDF system পাওয়া যাচ্ছে না। পেজটি আবার Reload করুন।'
        );

        return;
    }

    const controls =
        element.querySelectorAll('.no-print');

    const oldDisplays = [];

    controls.forEach(control => {

        oldDisplays.push(
            control.style.display
        );

        control.style.display = 'none';

    });

    const pdfContainer =
        document.createElement('div');

    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '0';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '794px';
    pdfContainer.style.background = '#ffffff';
    pdfContainer.style.zIndex = '2147483647';
    pdfContainer.style.padding = '0';
    pdfContainer.style.margin = '0';

    const clone =
        element.cloneNode(true);

    clone.style.display = 'block';
    clone.style.width = '100%';
    clone.style.margin = '0';
    clone.style.background = '#ffffff';

    clone
        .querySelectorAll('.sticky')
        .forEach(el => {

            el.style.position = 'static';

        });

    clone
        .querySelectorAll('tr')
        .forEach(row => {

            row.style.breakInside =
                'avoid';

            row.style.pageBreakInside =
                'avoid';

        });

    pdfContainer.appendChild(
        clone
    );

    document.body.appendChild(
        pdfContainer
    );

    const opt = {

        margin: 8,

        filename:
            'Learning_School_Bill.pdf',

        image: {

            type: 'jpeg',

            quality: 0.98

        },

        html2canvas: {

            scale: 2,

            useCORS: true,

            backgroundColor: '#ffffff',

            scrollX: 0,

            scrollY: 0,

            windowWidth: 794

        },

        jsPDF: {

            unit: 'mm',

            format: 'a4',

            orientation: 'portrait'

        },

        pagebreak: {

            mode: [
                'css',
                'legacy'
            ],

            avoid: [
                'tr'
            ]

        }

    };

    html2pdf()
        .set(opt)
        .from(pdfContainer)
        .save()
        .then(() => {

            document.body.removeChild(
                pdfContainer
            );

            controls.forEach(
                (control, index) => {

                    control.style.display =
                        oldDisplays[index];

                }
            );

        })
        .catch(error => {

            console.error(
                'Monthly Bill PDF Error:',
                error
            );

            if (
                document.body.contains(
                    pdfContainer
                )
            ) {

                document.body.removeChild(
                    pdfContainer
                );

            }

            controls.forEach(
                (control, index) => {

                    control.style.display =
                        oldDisplays[index];

                }
            );

            alert(
                'Monthly Bill PDF তৈরি করতে সমস্যা হয়েছে।'
            );

        });

}

// ==========================================
// 8. WHATSAPP
// ==========================================
function shareWhatsApp() {
    const name = document.getElementById('bStudentName').innerText;
    const total = document.getElementById('bTotalDue').innerText;
    const text = `প্রিয় অভিভাবক, লার্নিং স্কুল-এ ${name}-এর মোট বকেয়া ফি ${total}। দ্রুত বকেয়া পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// 9. MODALS
// ==========================================
function openAddInfoModal() { 
    document.getElementById('addModal').classList.remove('hidden'); 
}

function closeAddInfoModal() { 
    document.getElementById('addModal').classList.add('hidden'); 
}

function openRemoveInfoModal() { 
    document.getElementById('removeModal').classList.remove('hidden'); 
}

function closeRemoveInfoModal() { 
    document.getElementById('removeModal').classList.add('hidden'); 
}

// ==========================================
// 10. STUDENT INFORMATION
// ==========================================
function saveStudentInfo() {
    const name = document.getElementById('mStudentName').value.trim();
    const studentIdInput = document.getElementById('mStudentId').value.trim();
    const roll = parseInt(document.getElementById('mStudentRoll').value) || 1;
    const prevDue = parseInt(document.getElementById('mPreviousDue').value) || 0;

    if(!name) {
        alert('অনুগ্রহ করে শিক্ষার্থীর নাম দিন।');
        return;
    }

    // Student ID ফাঁকা হলে Automatic ID তৈরি হবে
    const studentId = studentIdInput || generateStudentId();

    // Student ID অবশ্যই Unique হতে হবে
    if(!isStudentIdUnique(studentId)) {
        alert(`Student ID "${studentId}" ইতিমধ্যে ব্যবহার করা হয়েছে।\n\nঅনুগ্রহ করে অন্য একটি Student ID দিন।`);
        return;
    }

    if(!sampleData[currentSelectedClass]) sampleData[currentSelectedClass] = [];

    sampleData[currentSelectedClass].push({
        roll: roll,
        name: name,
        studentId: studentId,
        admission: 0,
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0,
        exam1: 0,
        exam2: 0,
        finalExam: 0,
        prevDue: prevDue
    });

    saveAndSyncData();
    closeAddInfoModal();
    renderTable();

    document.getElementById('mStudentName').value = '';
    document.getElementById('mStudentId').value = '';
    document.getElementById('mStudentRoll').value = '';
    document.getElementById('mPreviousDue').value = '';

    alert(`নতুন শিক্ষার্থীর তথ্য সফলভাবে ডাটাবেজে সেভ হয়েছে!\n\nStudent ID: ${studentId}`);
}

function removeStudentInfo() {
    const remStudentId = document.getElementById('remStudentId').value.trim();

    if (!remStudentId) {
        alert('অনুগ্রহ করে Student ID লিখুন।');
        return;
    }

    let classStudents = sampleData[currentSelectedClass] || [];

    const index = classStudents.findIndex(
        s => String(s.studentId || '').trim().toLowerCase() === remStudentId.toLowerCase()
    );

    if (index === -1) {
        alert('প্রদত্ত Student ID-এর কোনো শিক্ষার্থী পাওয়া যায়নি!');
        return;
    }

    const removedStudent = classStudents[index];

    classStudents.splice(index, 1);

    for (let i = index; i < classStudents.length; i++) {
        classStudents[i].roll = classStudents[i].roll - 1;
    }

    saveAndSyncData();
    closeRemoveInfoModal();
    renderTable();

    document.getElementById('remStudentId').value = '';

    alert(
        `শিক্ষার্থী "${removedStudent.name}" সফলভাবে রিমুভ করা হয়েছে এবং পরবর্তী রোল নম্বরগুলো অটোমেটিক অ্যাডজাস্ট হয়েছে।\n\nStudent ID: ${removedStudent.studentId || remStudentId}`
    );
}

// ==========================================
// 11. OLD RECEIPT SEARCH
// ==========================================
function openSearchReceiptModal() {
    document.getElementById('searchReceiptModal').classList.remove('hidden');
    document.getElementById('searchResultsContainer').innerHTML = '';
}

function closeSearchReceiptModal() {
    document.getElementById('searchReceiptModal').classList.add('hidden');
}

function searchOldReceipts() {
    const sName = document.getElementById('sStudentName').value.trim().toLowerCase();
    const sStudentId = document.getElementById('sStudentId').value.trim().toLowerCase();
    const sRoll = document.getElementById('sStudentRoll').value.trim();
    const sClass = document.getElementById('sClass').value;
    const sSession = document.getElementById('sSession').value.trim();
    const resultsContainer = document.getElementById('searchResultsContainer');

    resultsContainer.innerHTML = '';

    const matched = savedReceipts.filter(r => {
        let matchName = !sName || String(r.name || '').toLowerCase().includes(sName);

        let matchStudentId =
            !sStudentId ||
            String(r.studentId || '').trim().toLowerCase() === sStudentId;

        let matchRoll = !sRoll || String(r.roll) === String(sRoll);

        let matchClass = r.className === sClass;

        let rSession =
            r.session ||
            (r.date ? new Date(r.date).getFullYear().toString() : '');

        let matchSession =
            !sSession ||
            (rSession && String(rSession).includes(sSession));

        return (
            matchName &&
            matchStudentId &&
            matchRoll &&
            matchClass &&
            matchSession
        );
    });

    if (matched.length === 0) {
        resultsContainer.innerHTML =
            `<p class="text-xs text-red-600 text-center font-bold">
                কোনো রশীদ পাওয়া যায়নি!
            </p>`;
        return;
    }

    matched.forEach((r) => {
        const itemDiv = document.createElement('div');

        itemDiv.className =
            "flex justify-between items-center bg-gray-50 p-2.5 rounded border text-xs";

        itemDiv.innerHTML = `
            <div>
                <p class="font-bold text-blue-900">
                    রশীদ নং: ${r.serial}
                </p>

                <p>
                    ${r.name}
                    (Student ID: ${r.studentId || 'ID নেই'} |
                    রোল: ${r.roll},
                    শ্রেণি: ${r.className})
                </p>

                <p class="text-gray-500 text-[10px]">
                    তারিখ: ${r.date} |
                    সেশন: ${r.session || 'N/A'} |
                    মোট: ${r.total}/-
                </p>
            </div>

            <button
                onclick='previewOldReceipt(${JSON.stringify(r)})'
                class="btn-primary text-xs px-2.5 py-1">
                ভিউ / প্রিন্ট
            </button>
        `;

        resultsContainer.appendChild(itemDiv);
    });
}

function previewOldReceipt(receiptObj) {
    closeSearchReceiptModal();
    editingOldReceiptSerial = receiptObj.serial;

    document.getElementById('rStudentName').value = receiptObj.name;
    document.getElementById('rStudentId').value = receiptObj.studentId || '';
    document.getElementById('rStudentRoll').value = receiptObj.roll;
    document.getElementById('rClass').value = receiptObj.className;
    document.getElementById('rSerial').value = receiptObj.serial;
    document.getElementById('rDate').value = receiptObj.date;

    document.querySelectorAll('.outName').forEach(el => el.innerText = receiptObj.name);
    document.querySelectorAll('.outStudentId').forEach(el => el.innerText = receiptObj.studentId || '—');
    document.querySelectorAll('.outRoll').forEach(el => el.innerText = receiptObj.roll);
    document.querySelectorAll('.outClass').forEach(el => el.innerText = receiptObj.className);
    document.querySelectorAll('.outSerial').forEach(el => el.innerText = receiptObj.serial);
    document.querySelectorAll('.outDate').forEach(el => el.innerText = receiptObj.date);
    document.querySelectorAll('.outItemsBody').forEach(el => el.innerHTML = receiptObj.itemsHtml);
    document.querySelectorAll('.outTotalAmount').forEach(el => el.innerText = receiptObj.total + '/-');

    const paidBtn = document.getElementById('btnReceiptPaid');
    const updateBtn = document.getElementById('btnReceiptUpdate');

    if(paidBtn) paidBtn.classList.add('hidden');
    if(updateBtn) updateBtn.classList.remove('hidden');

    showSection('receiptpreview');
}

// ==========================================
// 12. LOGOUT
// ==========================================
function logoutFromDashboard() {
    localStorage.removeItem('LS_LOGGED_IN_USER');
    window.location.href = 'Index.html';
}

// ==========================================
// 13. WINDOW ONLOAD & EVENT LISTENERS
// ==========================================
window.onload = function() {
    loadClassFeeConfig();
};

document.addEventListener('DOMContentLoaded', () => {

    // সাইডবার ন্যাভিগেশন লজিক (যদি থাকে)
    const navLinks = document.querySelectorAll('.sidebar ul li a:not(#logout-btn)');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');

            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.style.display = 'block';
                } else {
                    sec.style.display = 'none';
                }
            });
        });
    });

    // লগআউট হ্যান্ডলার
    const logoutBtn = document.getElementById('logout-btn');

    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('current_user');
            window.location.href = 'index.html';
        });
    }
});

/* =========================================================
   OLD VOUCHER SEARCH
========================================================= */

function openOldVoucherSearch() {

    const modal =
        document.getElementById(
            'oldVoucherSearchModal'
        );

    const sessionInput =
        document.getElementById(
            'oldVoucherSearchSession'
        );

    const dateInput =
        document.getElementById(
            'oldVoucherSearchDate'
        );

    const results =
        document.getElementById(
            'oldVoucherSearchResults'
        );

    if (!modal) return;

    if (sessionInput) {
        sessionInput.value =
            typeof currentSession !== 'undefined'
                ? currentSession
                : (
                    localStorage.getItem(
                        'LS_CURRENT_SESSION'
                    ) || '-'
                );
    }

    if (dateInput) {
        dateInput.value = '';
    }

    if (results) {
        results.innerHTML = '';
    }

    modal.classList.remove('hidden');

}


function closeOldVoucherSearch() {

    const modal =
        document.getElementById(
            'oldVoucherSearchModal'
        );

    if (modal) {
        modal.classList.add('hidden');
    }

}


function searchOldVouchersByDate() {

    const sessionInput =
        document.getElementById(
            'oldVoucherSearchSession'
        );

    const dateInput =
        document.getElementById(
            'oldVoucherSearchDate'
        );

    const results =
        document.getElementById(
            'oldVoucherSearchResults'
        );

    if (
        !sessionInput ||
        !dateInput ||
        !results
    ) {
        return;
    }

    const session =
        sessionInput.value.trim();

    const selectedDate =
        dateInput.value;

    if (!selectedDate) {

        alert(
            'অনুগ্রহ করে বাউচারের তারিখ নির্বাচন করুন।'
        );

        return;

    }

    const stored =
        localStorage.getItem(
            'LS_SAVED_VOUCHERS'
        );

    let vouchers = [];

    try {

        vouchers =
            stored
                ? JSON.parse(stored)
                : [];

    }

    catch (error) {

        vouchers = [];

    }

    const matches =
        vouchers.filter(voucher => {

            return (
                String(voucher.session) ===
                    String(session) &&
                voucher.date ===
                    selectedDate
            );

        });

    results.innerHTML = '';

    if (!matches.length) {

        results.innerHTML = `
            <div class="text-center text-sm text-gray-500 border rounded-lg p-3">
                এই তারিখে কোনো পুরাতন বাউচার পাওয়া যায়নি।
            </div>
        `;

        return;

    }

    matches.forEach(voucher => {

        const item =
            document.createElement('button');

        item.type = 'button';

        item.className =
            'w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-blue-50 transition';

        item.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-blue-900">
                    ${voucher.voucherNo}
                </span>

                <span class="font-bold text-gray-800">
                    ${voucher.totalBangla || '০'} টাকা
                </span>
            </div>

            <div class="text-xs text-gray-500 mt-1">
                ${voucher.date}
            </div>
        `;

        item.onclick =
            function() {

                localStorage.setItem(
                    'LS_OPEN_OLD_VOUCHER',
                    JSON.stringify(voucher)
                );

                window.location.href =
                    'voucher.html';

            };

        results.appendChild(item);

    });

}