import './style.css'
import Alpine from 'alpinejs'
import * as XLSX from 'xlsx'

window.Alpine = Alpine

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzswgz065wKuXgWMGUWL5UO9UvWS4k1vGxTfsbI138Phq7FQPuknncdOKVVSqS5atrF/exec';
const USE_MOCK = false; 

Alpine.data('adminData', () => ({
    isLoggedIn: false,
    isLoading: false,
    username: '',
    password: '',
    tab: 'dashboard',
    
    showUserModal: false,
    modalMode: 'add',
    userForm: { id_user: null, nama: '', username: '', password_hash: '123456', role: 'PPTS', status: 'Aktif' },
    mockUsers: [],
    
    showPupukModal: false,
    pupukMode: 'add',
    pupukForm: { id_pupuk: null, nama_pupuk: '', status: 'Aktif' },
    mockPupuk: [],
    
    stats: { total: 0, confirmed: 0, pending: 0 },
    mockPptsList: [],
    mockErdkkList: [],
    mockAuditLogs: [],
    
    async login() {
       if (USE_MOCK) {
           if (this.username === 'admin' && this.password === 'admin123') this.isLoggedIn = true;
           return;
       }
       
       this.isLoading = true;
       try {
           const res = await fetch(GAS_URL + '?action=getUsers');
           const json = await res.json();
           if (json.status === 'success') {
               const users = json.data;
               // Validasi Login: Cek kesesuaian username & password dan role "Super Admin"
               const user = users.find(u => String(u.username) === String(this.username) && String(u.password_hash) === String(this.password) && u.role === 'Super Admin');
               if (user) {
                   this.isLoggedIn = true;
                   this.mockUsers = users; 
                   await this.loadInitialData();
               } else {
                   alert('Username atau Password salah, atau Anda tidak memiliki akses Super Admin!');
               }
           }
       } catch (e) {
           console.error(e);
           alert('Gagal menghubungi server Google Apps Script.');
       }
       this.isLoading = false;
    },
    
    async loadInitialData() {
        this.isLoading = true;
        try {
            // Load PPTS & Hitung Statistik
            const resPpts = await fetch(GAS_URL + '?action=getPPTS');
            const jsonPpts = await resPpts.json();
            if (jsonPpts.status === 'success') {
                this.mockPptsList = jsonPpts.data.map(p => ({
                   id: p.id_ppts,
                   nama: p.nama_ppts,
                   kecamatan: p.id_kecamatan,
                   status: p.status_konfirmasi || 'Belum',
                   tgl: p.tanggal_konfirmasi ? new Date(p.tanggal_konfirmasi).toLocaleDateString('id-ID') : ''
                }));
                this.stats.total = this.mockPptsList.length;
                this.stats.confirmed = this.mockPptsList.filter(p => p.status === 'Sudah').length;
                this.stats.pending = this.stats.total - this.stats.confirmed;
            }
            
            // Load Jenis Pupuk
            const resPupuk = await fetch(GAS_URL + '?action=getPupuk');
            const jsonPupuk = await resPupuk.json();
            if (jsonPupuk.status === 'success') {
                this.mockPupuk = jsonPupuk.data.map(p => ({
                    id: p.id_pupuk, nama: p.nama_pupuk, status: p.status
                }));
            }
            
            // Load Semua eRDKK untuk keperluan Laporan Export
            const resErdkk = await fetch(GAS_URL + '?action=getERDKK');
            const jsonErdkk = await resErdkk.json();
            if (jsonErdkk.status === 'success') {
                this.mockErdkkList = jsonErdkk.data.map(d => ({
                    id: d.id_desa, 
                    ppts: this.mockPptsList.find(p => p.id == d.id_ppts)?.nama || 'Unknown',
                    desa: d.nama_desa, 
                    alokasi: d.alokasi
                }));
            }
            
        } catch(e) {
            console.error(e);
        }
        this.isLoading = false;
    },
    
    logout() {
       this.isLoggedIn = false;
       this.username = '';
       this.password = '';
    },

    openAddUserModal() {
       this.modalMode = 'add';
       this.userForm = { id_user: null, nama: '', username: '', password_hash: '123456', role: 'PPTS', status: 'Aktif' };
       this.showUserModal = true;
    },
    
    openEditUserModal(user) {
       this.modalMode = 'edit';
       this.userForm = { ...user };
       this.showUserModal = true;
    },
    
    async saveUser() {
       if(!this.userForm.nama || !this.userForm.username) {
          alert('Nama dan Username/NIK wajib diisi!');
          return;
       }
       if (this.modalMode === 'add') this.userForm.id_user = Date.now();
       
       this.isLoading = true;
       try {
           const res = await fetch(GAS_URL, {
               method: 'POST', body: JSON.stringify({ action: 'manageUser', mode: this.modalMode, data: this.userForm })
           });
           const json = await res.json();
           if(json.status === 'success') {
               if(this.modalMode === 'add') this.mockUsers.push({...this.userForm});
               else {
                   const idx = this.mockUsers.findIndex(u => u.id_user === this.userForm.id_user);
                   if(idx !== -1) this.mockUsers[idx] = {...this.userForm};
               }
               this.showUserModal = false;
           }
       } catch(e) { alert('Gagal menyimpan user'); }
       this.isLoading = false;
    },
    
    async deleteUser(user) {
       if (confirm(`Yakin ingin menghapus pengguna ${user.nama}?`)) {
           this.isLoading = true;
           try {
               const res = await fetch(GAS_URL, {
                   method: 'POST', body: JSON.stringify({ action: 'manageUser', mode: 'delete', data: { id_user: user.id_user } })
               });
               const json = await res.json();
               if(json.status === 'success') {
                   this.mockUsers = this.mockUsers.filter(u => u.id_user !== user.id_user);
               }
           } catch(e) {}
           this.isLoading = false;
       }
    },

    openAddPupukModal() {
       this.pupukMode = 'add';
       this.pupukForm = { id_pupuk: null, nama_pupuk: '', status: 'Aktif' };
       this.showPupukModal = true;
    },
    
    openEditPupukModal(p) {
       this.pupukMode = 'edit';
       this.pupukForm = { id_pupuk: p.id, nama_pupuk: p.nama, status: p.status };
       this.showPupukModal = true;
    },
    
    async savePupuk() {
       if(!this.pupukForm.nama_pupuk) {
          alert('Nama Jenis Pupuk wajib diisi!');
          return;
       }
       if (this.pupukMode === 'add') this.pupukForm.id_pupuk = Date.now();
       
       this.isLoading = true;
       try {
           const res = await fetch(GAS_URL, {
               method: 'POST', body: JSON.stringify({ action: 'managePupuk', mode: this.pupukMode, data: this.pupukForm })
           });
           const json = await res.json();
           if(json.status === 'success') {
               const mapToMock = { id: this.pupukForm.id_pupuk, nama: this.pupukForm.nama_pupuk, status: this.pupukForm.status };
               if(this.pupukMode === 'add') this.mockPupuk.push(mapToMock);
               else {
                   const idx = this.mockPupuk.findIndex(u => u.id === this.pupukForm.id_pupuk);
                   if(idx !== -1) this.mockPupuk[idx] = mapToMock;
               }
               this.showPupukModal = false;
           }
       } catch(e) { alert('Gagal menyimpan pupuk'); }
       this.isLoading = false;
    },
    
    async deletePupuk(p) {
       if (confirm(`Yakin ingin menghapus jenis pupuk ${p.nama}?`)) {
           this.isLoading = true;
           try {
               const res = await fetch(GAS_URL, {
                   method: 'POST', body: JSON.stringify({ action: 'managePupuk', mode: 'delete', data: { id_pupuk: p.id } })
               });
               const json = await res.json();
               if(json.status === 'success') {
                   this.mockPupuk = this.mockPupuk.filter(item => item.id !== p.id);
               }
           } catch(e) {}
           this.isLoading = false;
       }
    },
    
    batalKonfirmasi(ppts) {
       alert('Fitur pembatalan konfirmasi dari Dasbor belum tersedia di API.');
    },

    downloadTemplate() {
       let headerRow = ["ID Desa", "Nama PPTS", "Desa"];
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT I`));
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT II`));
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT III`));
       
       let sampleData = ["DESA01", "Budi Santoso", "Sukamaju"];
       this.mockPupuk.forEach(() => sampleData.push(100));
       this.mockPupuk.forEach(() => sampleData.push(100));
       this.mockPupuk.forEach(() => sampleData.push(100));

       const ws = XLSX.utils.aoa_to_sheet([[...headerRow], [...sampleData]]);
       const wb = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(wb, ws, "Template_eRDKK");
       XLSX.writeFile(wb, "Template_Import_eRDKK.xlsx");
    },

    exportExcel() {
       let headerRow = ["ID Desa", "Nama PPTS", "Desa"];
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT I`));
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT II`));
       this.mockPupuk.forEach(p => headerRow.push(`${p.nama} MT III`));

       const dataRows = this.mockErdkkList.map(row => {
          let r = [row.id, row.ppts, row.desa];
          this.mockPupuk.forEach(p => r.push(row.alokasi?.mt1?.[p.nama] || 0));
          this.mockPupuk.forEach(p => r.push(row.alokasi?.mt2?.[p.nama] || 0));
          this.mockPupuk.forEach(p => r.push(row.alokasi?.mt3?.[p.nama] || 0));
          return r;
       });
       
       const ws = XLSX.utils.aoa_to_sheet([[...headerRow], ...dataRows]);
       const wb = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(wb, ws, "Data_eRDKK");
       XLSX.writeFile(wb, "Laporan_Data_eRDKK.xlsx");
    },

    exportPdf() {
       window.print();
    },

    triggerImport() {
       document.getElementById('importFileInput').click();
    },

    handleImport(event) {
       const file = event.target.files[0];
       if (!file) return;
       
       const reader = new FileReader();
       reader.onload = async (e) => {
           this.isLoading = true;
           try {
               const data = new Uint8Array(e.target.result);
               const workbook = XLSX.read(data, { type: 'array' });
               const firstSheetName = workbook.SheetNames[0];
               const worksheet = workbook.Sheets[firstSheetName];
               const json = XLSX.utils.sheet_to_json(worksheet);
               
               if (!json || json.length === 0) {
                   alert('File Excel kosong atau format tidak sesuai.');
                   this.isLoading = false;
                   return;
               }
               
               if (!json[0].hasOwnProperty('ID Desa')) {
                   alert('Format Excel salah! Kolom "ID Desa" tidak ditemukan. Pastikan menggunakan format dari tombol Unduh Template.');
                   this.isLoading = false;
                   return;
               }
               
               let updates = [];
               json.forEach(row => {
                   const id_desa = row['ID Desa'];
                   if (!id_desa) return;
                   
                   this.mockPupuk.forEach(p => {
                       updates.push({
                           id_desa: id_desa,
                           nama_pupuk: p.nama,
                           mt1: row[`${p.nama} MT I`] || 0,
                           mt2: row[`${p.nama} MT II`] || 0,
                           mt3: row[`${p.nama} MT III`] || 0
                       });
                   });
               });
               
               const payload = { action: 'importErdkk', data: updates };
               const response = await fetch(GAS_URL, {
                   method: 'POST',
                   body: JSON.stringify(payload)
               });
               
               const result = await response.json();
               if (result.status === 'success') {
                   alert('Import data eRDKK berhasil!');
                   await this.loadInitialData();
               } else {
                   throw new Error(result.message || 'Gagal import');
               }
           } catch (error) {
               console.error(error);
               alert('Terjadi kesalahan saat import data: ' + error.message);
           }
           this.isLoading = false;
           event.target.value = ''; 
       };
       reader.readAsArrayBuffer(file);
    }
}));

Alpine.start();
