// Code.gs

// ID Spreadsheet, ganti dengan ID spreadsheet Anda atau gunakan ActiveSpreadsheet
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function doGet(e) {
  const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  const action = e.parameter.action;
  
  try {
    if (action === 'getKecamatan') return output.setContent(JSON.stringify({ status: 'success', data: getSheetData('Kecamatan') }));
    
    if (action === 'getPPTS') {
      let data = getSheetData('PPTS');
      if (e.parameter.id_kecamatan) data = data.filter(i => i.id_kecamatan == e.parameter.id_kecamatan);
      return output.setContent(JSON.stringify({ status: 'success', data }));
    }
    
    if (action === 'getUsers') return output.setContent(JSON.stringify({ status: 'success', data: getSheetData('Users') }));
    
    if (action === 'getPupuk') return output.setContent(JSON.stringify({ status: 'success', data: getSheetData('Jenis_Pupuk') }));
    
    if (action === 'getERDKK') {
      const idPpts = e.parameter.id_ppts;
      let desaData = getSheetData('Data_eRDKK');
      if (idPpts) desaData = desaData.filter(i => i.id_ppts == idPpts);
      
      const alokasiData = getSheetData('Alokasi_eRDKK');
      
      const result = desaData.map(desa => {
        let alokasi = { mt1: {}, mt2: {}, mt3: {} };
        alokasiData.filter(a => a.id_desa == desa.id_desa).forEach(a => {
           alokasi.mt1[a.nama_pupuk] = a.mt1;
           alokasi.mt2[a.nama_pupuk] = a.mt2;
           alokasi.mt3[a.nama_pupuk] = a.mt3;
        });
        return { ...desa, alokasi };
      });
      return output.setContent(JSON.stringify({ status: 'success', data: result }));
    }
    
    if (action === 'getSettings') {
      let settings = {};
      getSheetData('Settings').forEach(i => settings[i.key] = i.value);
      return output.setContent(JSON.stringify({ status: 'success', data: settings }));
    }
    
    return output.setContent(JSON.stringify({ status: 'error', message: 'Action not found' }));
  } catch (error) {
    return output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
}

function doPost(e) {
  const output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    // CRUD Users
    if (action === 'manageUser') {
      const { mode, data } = postData; // mode: add, edit, delete
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Users');
      if (mode === 'add') {
        sheet.appendRow([data.id_user, data.nama, data.username, data.password_hash, data.role, data.status]);
      } else if (mode === 'edit' || mode === 'delete') {
        const sheetData = sheet.getDataRange().getValues();
        const headers = sheetData[0];
        for (let i = 1; i < sheetData.length; i++) {
          if (sheetData[i][headers.indexOf('id_user')] == data.id_user) {
            if (mode === 'delete') {
              sheet.deleteRow(i + 1);
            } else {
              sheet.getRange(i + 1, 1, 1, headers.length).setValues([[data.id_user, data.nama, data.username, data.password_hash, data.role, data.status]]);
            }
            break;
          }
        }
      }
      return output.setContent(JSON.stringify({ status: 'success' }));
    }
    
    // CRUD Pupuk
    if (action === 'managePupuk') {
      const { mode, data } = postData;
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Jenis_Pupuk');
      if (mode === 'add') {
        sheet.appendRow([data.id_pupuk, data.nama_pupuk, data.status]);
      } else if (mode === 'edit' || mode === 'delete') {
        const sheetData = sheet.getDataRange().getValues();
        const headers = sheetData[0];
        for (let i = 1; i < sheetData.length; i++) {
          if (sheetData[i][headers.indexOf('id_pupuk')] == data.id_pupuk) {
            if (mode === 'delete') {
              sheet.deleteRow(i + 1);
            } else {
              sheet.getRange(i + 1, 1, 1, headers.length).setValues([[data.id_pupuk, data.nama_pupuk, data.status]]);
            }
            break;
          }
        }
      }
      return output.setContent(JSON.stringify({ status: 'success' }));
    }

    // UPDATE eRDKK
    if (action === 'updateData') {
      const { id_ppts, updates } = postData;
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Alokasi_eRDKK');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      let changeLogs = [];
      const ts = new Date();
      
      updates.forEach(u => {
        // u = { id_desa, nama_pupuk, mt_field (e.g. 'mt1'), nilai_baru }
        for (let i = 1; i < data.length; i++) {
          if (data[i][headers.indexOf('id_desa')] == u.id_desa && data[i][headers.indexOf('nama_pupuk')] == u.nama_pupuk) {
            let colIndex = headers.indexOf(u.mt_field);
            let oldVal = data[i][colIndex];
            sheet.getRange(i + 1, colIndex + 1).setValue(u.nilai_baru);
            changeLogs.push([ts, id_ppts, u.id_desa, u.nama_pupuk, u.mt_field, oldVal, u.nilai_baru]);
            break;
          }
        }
      });
      
      if (changeLogs.length > 0) {
        const sheetLog = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log_Perubahan');
        sheetLog.getRange(sheetLog.getLastRow() + 1, 1, changeLogs.length, 7).setValues(changeLogs);
      }
      return output.setContent(JSON.stringify({ status: 'success' }));
    }
    
    // CONFIRM DATA
    if (action === 'confirmData') {
      const sheetPPTS = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('PPTS');
      const data = sheetPPTS.getDataRange().getValues();
      const headers = data[0];
      const ts = new Date();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][headers.indexOf('id_ppts')] == postData.id_ppts) {
          sheetPPTS.getRange(i + 1, headers.indexOf('status_konfirmasi') + 1).setValue('Sudah');
          sheetPPTS.getRange(i + 1, headers.indexOf('tanggal_konfirmasi') + 1).setValue(ts);
          sheetPPTS.getRange(i + 1, headers.indexOf('jam_konfirmasi') + 1).setValue(ts.toTimeString().split(' ')[0]);
          break;
        }
      }
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log_Konfirmasi').appendRow([ts, postData.id_ppts, 'Sudah', 'Terkonfirmasi']);
      return output.setContent(JSON.stringify({ status: 'success' }));
    }

    if (action === 'logKunjungan') {
       const sheetLog = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Log_Kunjungan');
       const ts = new Date();
       sheetLog.appendRow([ts, ts.toTimeString().split(' ')[0], postData.data.id_kecamatan, postData.data.id_ppts, postData.data.browser || '', postData.data.ip_address || '']);
       return output.setContent(JSON.stringify({ status: 'success' }));
    }
    
    return output.setContent(JSON.stringify({ status: 'error', message: 'Action not found' }));
  } catch (error) {
    return output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
}

/**
 * Fungsi utilitas untuk menginisiasi struktur Spreadsheet secara otomatis.
 * Jalankan fungsi ini SATU KALI dari editor Apps Script dengan memilih setupSpreadsheet lalu tekan Run.
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsConfig = {
    'Kecamatan': ['id_kecamatan', 'nama_kecamatan'],
    'PPTS': ['id_ppts', 'id_kecamatan', 'nama_ppts', 'status_konfirmasi', 'tanggal_konfirmasi', 'jam_konfirmasi'],
    'Data_eRDKK': ['id_desa', 'id_kecamatan', 'id_ppts', 'nama_desa'],
    'Alokasi_eRDKK': ['id_desa', 'nama_pupuk', 'mt1', 'mt2', 'mt3'],
    'Log_Kunjungan': ['tanggal', 'jam', 'id_kecamatan', 'id_ppts', 'browser', 'ip_address'],
    'Log_Perubahan': ['tanggal', 'id_ppts', 'nama_desa', 'nama_pupuk', 'kolom', 'nilai_lama', 'nilai_baru'],
    'Log_Konfirmasi': ['tanggal', 'id_ppts', 'status', 'isi_konfirmasi'],
    'Users': ['id_user', 'nama', 'username', 'password_hash', 'role', 'status'],
    'Jenis_Pupuk': ['id_pupuk', 'nama_pupuk', 'status'],
    'Settings': ['key', 'value']
  };
  
  for (const sheetName in sheetsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    // Set headers
    const headers = sheetsConfig[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1); // Bekukan baris pertama (header)
  }
  
  // Seed Users jika kosong
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow([1, 'Administrator', 'admin', '123456', 'Super Admin', 'Aktif']);
  }
  
  // Seed Jenis_Pupuk jika kosong
  const pupukSheet = ss.getSheetByName('Jenis_Pupuk');
  if (pupukSheet.getLastRow() <= 1) {
    pupukSheet.appendRow([1, 'Urea', 'Aktif']);
    pupukSheet.appendRow([2, 'NPK', 'Aktif']);
    pupukSheet.appendRow([3, 'NPK Formula Khusus', 'Aktif']);
  }
  
  // Seed Settings jika kosong
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.appendRow(['wa_admin', '6281234567890']);
    settingsSheet.appendRow(['nama_instansi', 'Dinas Pertanian Kota X']);
  }
  
  // Hapus "Sheet1" default bawaan jika ada
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {} 
  }
}
