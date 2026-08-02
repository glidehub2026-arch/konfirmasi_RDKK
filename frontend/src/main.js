import './style.css'
import Alpine from 'alpinejs'

window.Alpine = Alpine

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzswgz065wKuXgWMGUWL5UO9UvWS4k1vGxTfsbI138Phq7FQPuknncdOKVVSqS5atrF/exec';
const USE_MOCK = false; // Ubah ke false untuk menggunakan GAS_URL yang sebenarnya
const WA_ADMIN = '6287762524133'; // Nomor WA Admin default

Alpine.data('appData', () => ({
   view: 'select', // State: 'select', 'data', 'edit', 'loading'

   kecamatanList: [],
   selectedKecamatan: '',

   pptsList: [],
   selectedPpts: '',
   currentPptsObj: null,

   erdkkList: [],

   isConfirmed: false,
   showConfirmDialog: false,

   editingDesa: null,

   get totalAllMT1() {
      return this.erdkkList.reduce((acc, curr) => acc + (Number(curr.mt1_urea) || 0) + (Number(curr.mt1_npk) || 0) + (Number(curr.mt1_organik) || 0), 0);
   },
   get totalAllMT2() {
      return this.erdkkList.reduce((acc, curr) => acc + (Number(curr.mt2_urea) || 0) + (Number(curr.mt2_npk) || 0) + (Number(curr.mt2_organik) || 0), 0);
   },
   get totalAllMT3() {
      return this.erdkkList.reduce((acc, curr) => acc + (Number(curr.mt3_urea) || 0) + (Number(curr.mt3_npk) || 0) + (Number(curr.mt3_organik) || 0), 0);
   },
   get grandTotal() {
      return this.totalAllMT1 + this.totalAllMT2 + this.totalAllMT3;
   },

   async init() {
      if (USE_MOCK) {
         this.kecamatanList = [
            { id_kecamatan: 'KEC01', nama_kecamatan: 'Mijen' },
            { id_kecamatan: 'KEC02', nama_kecamatan: 'Gunungpati' }
         ];
      } else {
         this.view = 'loading';
         try {
            const res = await fetch(GAS_URL + '?action=getKecamatan');
            const json = await res.json();
            if (json.status === 'success') this.kecamatanList = json.data;
         } catch (e) {
            console.error(e);
            alert('Gagal memuat data Kecamatan');
         }
         this.view = 'select';
      }
   },

   async fetchPpts() {
      if (!this.selectedKecamatan) {
         this.pptsList = [];
         return;
      }

      if (USE_MOCK) {
         this.pptsList = [
            { id_ppts: 'PPTS01', id_kecamatan: 'KEC01', nama_ppts: 'Budi Santoso', status_konfirmasi: 'Belum', tanggal_konfirmasi: '', jam_konfirmasi: '' },
            { id_ppts: 'PPTS02', id_kecamatan: 'KEC01', nama_ppts: 'Siti Aminah', status_konfirmasi: 'Sudah', tanggal_konfirmasi: '2024-12-01', jam_konfirmasi: '10:00:00' }
         ].filter(p => p.id_kecamatan === this.selectedKecamatan);
      } else {
         this.view = 'loading';
         try {
            const res = await fetch(GAS_URL + '?action=getPPTS&id_kecamatan=' + this.selectedKecamatan);
            const json = await res.json();
            if (json.status === 'success') this.pptsList = json.data;
         } catch (e) {
            console.error(e);
            alert('Gagal memuat data PPTS');
         }
         this.view = 'select';
      }
   },

   async fetchDataErdkk() {
      if (!this.selectedPpts) return;

      this.currentPptsObj = this.pptsList.find(p => p.id_ppts === this.selectedPpts);
      this.isConfirmed = this.currentPptsObj.status_konfirmasi === 'Sudah';

      this.view = 'loading';

      if (USE_MOCK) {
         setTimeout(() => {
            this.erdkkList = [
               { id_desa: 'DESA01', id_ppts: this.selectedPpts, nama_desa: 'Polaman', mt1_urea: 150, mt1_npk: 50, mt1_organik: 20, mt2_urea: 100, mt2_npk: 50, mt2_organik: 20, mt3_urea: 100, mt3_npk: 50, mt3_organik: 20 },
               { id_desa: 'DESA02', id_ppts: this.selectedPpts, nama_desa: 'Cangkiran', mt1_urea: 200, mt1_npk: 100, mt1_organik: 30, mt2_urea: 150, mt2_npk: 80, mt2_organik: 25, mt3_urea: 120, mt3_npk: 60, mt3_organik: 20 }
            ];
            this.view = 'data';
         }, 500);
      } else {
         try {
            const res = await fetch(GAS_URL + '?action=getERDKK&id_ppts=' + this.selectedPpts);
            const json = await res.json();
            if (json.status === 'success') {
               this.erdkkList = json.data.map(d => ({
                  ...d,
                  mt1_urea: d.alokasi?.mt1?.['Urea'] || 0,
                  mt1_npk: d.alokasi?.mt1?.['NPK'] || 0,
                  mt1_organik: d.alokasi?.mt1?.['Organik'] || 0,
                  mt2_urea: d.alokasi?.mt2?.['Urea'] || 0,
                  mt2_npk: d.alokasi?.mt2?.['NPK'] || 0,
                  mt2_organik: d.alokasi?.mt2?.['Organik'] || 0,
                  mt3_urea: d.alokasi?.mt3?.['Urea'] || 0,
                  mt3_npk: d.alokasi?.mt3?.['NPK'] || 0,
                  mt3_organik: d.alokasi?.mt3?.['Organik'] || 0
               }));
               this.view = 'data';
            } else {
               throw new Error(json.message);
            }
         } catch (e) {
            console.error(e);
            alert('Gagal memuat data eRDKK');
            this.view = 'select';
         }
      }
   },

   editDesa(desa) {
      this.editingDesa = JSON.parse(JSON.stringify(desa)); // clone object
      this.view = 'edit';
   },

   async saveEdit() {
      // Siapkan perubahan yang akan dikirim (format sederhana untuk contoh)
      let updates = [];
      const keys = ['mt1_urea', 'mt1_npk', 'mt1_organik', 'mt2_urea', 'mt2_npk', 'mt2_organik', 'mt3_urea', 'mt3_npk', 'mt3_organik'];

      // Compare with original
      const original = this.erdkkList.find(d => d.id_desa === this.editingDesa.id_desa);
      keys.forEach(key => {
         if (original[key] != this.editingDesa[key]) {
            const parts = key.split('_'); // 'mt1', 'urea'
            const pupukMap = { 'urea': 'Urea', 'npk': 'NPK', 'organik': 'Organik' };
            updates.push({
               id_desa: this.editingDesa.id_desa,
               nama_pupuk: pupukMap[parts[1]],
               mt_field: parts[0],
               nilai_baru: this.editingDesa[key]
            });
         }
      });

      if (USE_MOCK) {
         if (original) {
            Object.assign(original, this.editingDesa);
         }
         this.editingDesa = null;
         this.view = 'data';
         return;
      }

      if (updates.length === 0) {
         this.view = 'data';
         return;
      }

      this.view = 'loading';
      try {
         const res = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
               action: 'updateData',
               id_ppts: this.selectedPpts,
               updates: updates
            })
         });
         const json = await res.json();
         if (json.status === 'success') {
            Object.assign(original, this.editingDesa);
            this.editingDesa = null;
            this.view = 'data';
         } else {
            throw new Error(json.message);
         }
      } catch (e) {
         console.error(e);
         alert('Gagal menyimpan perubahan');
         this.view = 'edit';
      }
   },

   async confirmData() {
      this.showConfirmDialog = false;
      this.view = 'loading';

      if (USE_MOCK) {
         setTimeout(() => {
            this.isConfirmed = true;
            this.currentPptsObj.status_konfirmasi = 'Sudah';
            this.currentPptsObj.tanggal_konfirmasi = new Date().toLocaleDateString();
            this.currentPptsObj.jam_konfirmasi = new Date().toLocaleTimeString();

            this.view = 'data';

            this.redirectToWhatsApp();
         }, 800);
      } else {
         try {
            const res = await fetch(GAS_URL, {
               method: 'POST',
               body: JSON.stringify({
                  action: 'confirmData',
                  id_ppts: this.selectedPpts
               })
            });
            const json = await res.json();
            if (json.status === 'success') {
               this.isConfirmed = true;
               this.currentPptsObj.status_konfirmasi = 'Sudah';

               this.view = 'data';
               this.redirectToWhatsApp();
            } else {
               throw new Error(json.message);
            }
         } catch (e) {
            console.error(e);
            alert('Gagal melakukan konfirmasi');
            this.view = 'data';
         }
      }
   },

   redirectToWhatsApp() {
      const message = `Yth. Administrator Sistem eRDKK,\n\nBersama pesan ini, saya memberitahukan bahwa proses verifikasi data eRDKK untuk wilayah tugas PPTS *${this.currentPptsObj.nama_ppts}* telah selesai dilaksanakan.\n\nData yang bersangkutan telah kami periksa secara menyeluruh dan dinyatakan sesuai dengan rincian yang berlaku. Mohon untuk dapat diproses lebih lanjut sesuai dengan prosedur administrasi yang ada.\n\nTerima kasih.`;
      const url = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
   },

   toggleMenu() {
      alert('Menu atau Sidebar Admin bisa ditambahkan di sini.');
   }
}));

Alpine.data('chatBot', () => ({
   isOpen: false,
   messages: [
      { role: 'bot', text: 'Halo! Saya Asisten Admin PUD. Ada yang bisa saya bantu seputar Aplikasi Konfirmasi eRDKK?' }
   ],
   userInput: '',
   isLoading: false,
   apiKey: import.meta.env.VITE_GEMINI_API_KEY || '', // Mengambil key dari .env.local atau Cloudflare

   async sendMessage() {
      if (!this.userInput.trim()) return;

      const userText = this.userInput.trim();
      this.messages.push({ role: 'user', text: userText });
      this.userInput = '';
      this.isLoading = true;
      this.scrollToBottom();

      if (!this.apiKey) {
         setTimeout(() => {
            this.messages.push({ role: 'bot', text: 'Maaf, Assisten Admin PUD sedang sibuk, silahkan coba beberapa saat lagi!' });
            this.isLoading = false;
            this.scrollToBottom();
         }, 1000);
         return;
      }

      try {
         const systemPrompt = `NAMA ANDA ADALAH ASISTEN ADMIN PUD. PERAN ANDA ADALAH CUSTOMER SERVICE APLIKASI KONFIRMASI eRDKK.

ATURAN MUTLAK:
1. DILARANG KERAS MENJAWAB PERTANYAAN DI LUAR TOPIK eRDKK, PUPUK BERSUBSIDI, ATAU PERTANIAN.
2. JIKA DITANYA HAL LAIN (Misal: coding, matematika, resep, politik), JAWAB: "Maaf, saya Asisten Admin PUD dan saya hanya melayani pertanyaan seputar Aplikasi Konfirmasi eRDKK."

ALUR APLIKASI KONFIRMASI eRDKK (Untuk menjawab pertanyaan pengguna):
- Tujuan Aplikasi: Untuk memverifikasi dan mengonfirmasi data alokasi pupuk bersubsidi (Urea, NPK, dll) per desa dan per Musim Tanam (MT I, MT II, MT III).
- Langkah Penggunaan: 
  1. Pengguna (Penyuluh/PPTS) memilih Kecamatan mereka.
  2. Memilih nama PPTS.
  3. Sistem akan menampilkan rincian data Desa dan Alokasi Pupuk.
  4. Pengguna dapat menekan tombol edit (ikon pensil) jika ada kuota alokasi yang perlu direvisi.
  5. Setelah semua data dirasa benar, pengguna wajib menekan tombol "Konfirmasi Data" yang melayang di bawah layar.
  6. Setelah dikonfirmasi, sistem akan otomatis membuatkan format pesan pelaporan untuk dikirim ke WhatsApp Admin.

PENTING: Jawablah pertanyaan dengan bahasa Indonesia yang ramah, sopan, ringkas, dan jelas.`;

         const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               system_instruction: {
                  parts: [{ text: systemPrompt }]
               },
               contents: [
                  { role: "user", parts: [{ text: userText }] }
               ]
            })
         });

         const data = await response.json();

         if (data.candidates && data.candidates.length > 0) {
            const botReply = data.candidates[0].content.parts[0].text;
            this.messages.push({ role: 'bot', text: botReply });
         } else {
            throw new Error(data.error ? data.error.message : "Gagal memproses respon dari Gemini.");
         }
      } catch (error) {
         console.error('Error fetching Gemini API:', error);
         this.messages.push({ role: 'bot', text: 'Maaf, terjadi kesalahan saat menghubungi server AI. Pesan sistem: ' + error.message });
      } finally {
         this.isLoading = false;
         this.scrollToBottom();
      }
   },

   scrollToBottom() {
      setTimeout(() => {
         const container = document.getElementById('chat-messages-container');
         if (container) container.scrollTop = container.scrollHeight;
      }, 100);
   }
}));

Alpine.start();
