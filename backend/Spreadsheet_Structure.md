# Panduan Setup Database Spreadsheet

Untuk backend Google Apps Script, Anda perlu membuat satu file Google Spreadsheet baru. Silakan buat sheet (tab) dengan nama-nama berikut dan header pada baris ke-1:

## 1. Sheet: `Kecamatan`
| A | B |
|---|---|
| id_kecamatan | nama_kecamatan |
| KEC01 | Mijen |
| KEC02 | Gunungpati |

## 2. Sheet: `PPTS`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id_ppts | id_kecamatan | nama_ppts | status_konfirmasi | tanggal_konfirmasi | jam_konfirmasi |
| PPTS01 | KEC01 | Budi Santoso | Belum | | |
| PPTS02 | KEC01 | Siti Aminah | Belum | | |

## 3. Sheet: `Data_eRDKK`
| A | B | C | D |
|---|---|---|---|
| id_desa | id_kecamatan | id_ppts | nama_desa |
| DESA01 | KEC01 | PPTS01 | Polaman |

## 4. Sheet: `Alokasi_eRDKK`
| A | B | C | D | E |
|---|---|---|---|---|
| id_desa | nama_pupuk | mt1 | mt2 | mt3 |
| DESA01 | Urea | 150 | 100 | 100 |
| DESA01 | NPK | 50 | 50 | 50 |

## 5. Sheet: `Log_Kunjungan`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| tanggal | jam | id_kecamatan | id_ppts | browser | ip_address |

## 6. Sheet: `Log_Perubahan`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| tanggal | id_ppts | nama_desa | nama_pupuk | kolom | nilai_lama | nilai_baru |

## 7. Sheet: `Log_Konfirmasi`
| A | B | C | D |
|---|---|---|---|
| tanggal | id_ppts | status | isi_konfirmasi |

## 8. Sheet: `Users`
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id_user | nama | username | password_hash | role | status |
| 1 | Administrator | admin | 123456 | Super Admin | Aktif |

## 9. Sheet: `Jenis_Pupuk`
| A | B | C |
|---|---|---|
| id_pupuk | nama_pupuk | status |
| 1 | Urea | Aktif |
| 2 | NPK | Aktif |
| 3 | NPK Formula Khusus | Aktif |

## 10. Sheet: `Settings`
| A | B |
|---|---|
| key | value |
| wa_admin | 6281234567890 |
| nama_instansi | Dinas Pertanian Kota X |

---

Setelah Spreadsheet dibuat:
1. Klik menu **Extensions** (Ekstensi) > **Apps Script**.
2. Salin isi file `Code.gs` ke editor tersebut.
3. Deploy sebagai **Web App** dengan akses `Anyone` (Siapa saja).
4. Salin **Web App URL** yang dihasilkan dan pasang di konfigurasi Frontend nanti.
