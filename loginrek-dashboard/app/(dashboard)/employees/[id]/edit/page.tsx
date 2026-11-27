'use client';

import React, { useState, useRef } from 'react';
import type { Employee } from '@/lib/types';
import { User, AtSign, Phone, IdCard, Key, Check, FileText, ArrowLeft, AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Redirect, SessionCheck } from '@/components/dashboard/Session';
import { apiFetch } from '@/lib/api';
import { useAdmin } from '@/components/dashboard/AdminProvider';

interface EditEmployeePageProps {
  employee: Employee | null;
  onBack: () => void;
  onSave: (employee: Employee) => void | Promise<void>;
  onDelete: (employee: Employee) => void;
}

function EditEmployeePage({ employee, onBack, onSave, onDelete }: EditEmployeePageProps) {
  const [name, setName] = useState(employee?.name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '+62 812-3456-7890');
  const [role, setRole] = useState(employee?.role || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusKepegawaian, setStatusKepegawaian] = useState(employee?.type || 'Karyawan');
  const initialIsAdmin = Boolean(employee?.isAdmin);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  const defaultAvatar = employee?.avatar || '';
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);
  
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Ukuran foto maksimal 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setAvatarPreview(reader.result);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPreview('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama Lengkap tidak boleh kosong.');
      return;
    }
    if (!role.trim()) {
      setErrorMsg('Role / Jabatan tidak boleh kosong.');
      return;
    }
    if (password.trim() && password.trim().length < 8) {
      setErrorMsg(`Password baru belum memenuhi syarat: saat ini baru ${password.trim().length} karakter (minimal 8 karakter).`);
      return;
    }

    if (isAdmin && !initialIsAdmin && statusKepegawaian === 'Non-Aktif') {
      setErrorMsg('Karyawan non-aktif tidak dapat dijadikan admin. Pilih status kepegawaian lain terlebih dahulu.');
      return;
    }

    const initials = name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || employee?.initials || 'EM';

    const updatedEmployee = {
      ...employee,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim(),
      type: statusKepegawaian,
      isAdmin,
      avatar: avatarPreview,
      initials,
      ...(password.trim() ? { password: password.trim() } : {})
    };

    try {
      await onSave(updatedEmployee as Employee);
    } catch (err) {
      setErrorMsg((err instanceof Error && err.message) || 'Gagal menyimpan perubahan.');
    }
  };

  return (
    <div className="edit-employee-view">
      {/* Back button link */}
      <button 
        type="button" 
        className="btn-back-link" 
        onClick={onBack}
        title="Kembali ke Data Karyawan"
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Data Karyawan</span>
      </button>

      {/* Page Title & Subtitle + Tombol Hapus */}
      <div className="edit-employee-header">
        <div>
          <h1 className="page-title edit-employee-title">
            Edit Data Karyawan — {employee?.name || 'Karyawan'}
          </h1>
          <p className="page-subtitle edit-employee-subtitle">
            Perbarui informasi identitas, role/jabatan, status kepegawaian, dan konfigurasi akses presensi karyawan.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="form-error-alert" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="edit-employee-layout">
        {/* Left Column: Form Card + Action Buttons Below */}
        <div className="edit-left-column">
          <div className="edit-form-card">
            <form onSubmit={handleSave} className="edit-fields-container">
              {/* Field: Nama Lengkap */}
              <div className="edit-field-group">
                <label className="edit-field-label">Nama Lengkap</label>
                <div className="edit-input-wrapper">
                  <User size={18} className="edit-input-icon" />
                  <input
                    type="text"
                    className="edit-text-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>
              </div>

              {/* Field: Alamat Email */}
              <div className="edit-field-group">
                <label className="edit-field-label">Alamat Email</label>
                <div className="edit-input-wrapper">
                  <AtSign size={18} className="edit-input-icon" />
                  <input
                    type="email"
                    className="edit-text-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi.santoso@loginrek.id"
                    required
                  />
                </div>
              </div>

              {/* Field: Nomor WhatsApp / HP */}
              <div className="edit-field-group">
                <label className="edit-field-label">Nomor WhatsApp / HP</label>
                <div className="edit-input-wrapper">
                  <Phone size={18} className="edit-input-icon" />
                  <input
                    type="text"
                    className="edit-text-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                  />
                </div>
              </div>

              {/* Field: Role / Jabatan */}
              <div className="edit-field-group">
                <label className="edit-field-label">Role / Jabatan</label>
                <div className="edit-input-wrapper">
                  <IdCard size={18} className="edit-input-icon" />
                  <input
                    type="text"
                    className="edit-text-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Senior Backend Developer"
                    required
                  />
                </div>
              </div>

              {/* Field: Ganti Pasword karyawan */}
              <div className="edit-field-group">
                <label className="edit-field-label">Ganti Password Karyawan</label>
                <div className={`edit-input-wrapper ${password && password.length < 8 ? 'input-warning' : password.length >= 8 ? 'input-success' : ''}`}>
                  <Key size={18} className="edit-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="edit-text-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg && e.target.value.length >= 8) {
                        setErrorMsg('');
                      }
                    }}
                    placeholder="Kosongkan jika tidak diubah (min. 8 karakter)"
                  />
                  <button
                    type="button"
                    className="btn-toggle-password-inline"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {password.length > 0 && password.length < 8 ? (
                  <div className="password-validation-warning" role="alert">
                    <AlertTriangle size={14} className="warning-icon" />
                    <span>Password baru kurang dari 8 karakter ({password.length}/8 karakter)</span>
                  </div>
                ) : password.length >= 8 ? (
                  <div className="password-validation-success">
                    <Check size={14} className="success-icon" />
                    <span>Minimal 8 karakter terpenuhi ({password.length} karakter)</span>
                  </div>
                ) : (
                  <span className="edit-field-hint">Kosongkan jika tidak ingin mengubah password akun karyawan.</span>
                )}
              </div>

              {/* Field: Status Kepegawaian */}
              <div className="edit-field-group">
                <label className="edit-field-label">Status Kepegawaian</label>
                <div className="status-segmented-grid">
                  {/* Option 1: Karyawan / Tetap */}
                  <div
                    className={`status-segment-btn ${statusKepegawaian === 'Karyawan' ? 'active' : ''}`}
                    onClick={() => setStatusKepegawaian('Karyawan')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">Karyawan</span>
                    <span className="status-segment-sub">Tetap</span>
                  </div>

                  {/* Option 2: Magang / Intern */}
                  <div
                    className={`status-segment-btn ${statusKepegawaian === 'Magang' ? 'active' : ''}`}
                    onClick={() => setStatusKepegawaian('Magang')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">Magang</span>
                    <span className="status-segment-sub">Intern</span>
                  </div>

                  {/* Option 3: PKL / Vokasi */}
                  <div
                    className={`status-segment-btn ${statusKepegawaian === 'PKL' ? 'active' : ''}`}
                    onClick={() => setStatusKepegawaian('PKL')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">PKL</span>
                    <span className="status-segment-sub">Vokasi</span>
                  </div>

                  {/* Option 4: Non-Aktif (tidak bisa login maupun absen) */}
                  <div
                    className={`status-segment-btn ${statusKepegawaian === 'Non-Aktif' ? 'active' : ''}`}
                    onClick={() => setStatusKepegawaian('Non-Aktif')}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">Non-Aktif</span>
                    <span className="status-segment-sub">Tanpa akses</span>
                  </div>
                </div>
                {statusKepegawaian === 'Non-Aktif' && (
                  <span className="edit-field-hint">
                    Karyawan non-aktif tidak bisa login dan tidak bisa absen di aplikasi. Pilih status lain untuk mengaktifkannya kembali.
                  </span>
                )}
              </div>

              {/* Field: Hak Akses Dashboard */}
              <div className="edit-field-group">
                <label className="edit-field-label">Hak Akses Dashboard</label>
                <div className="status-segmented-grid two-columns">
                  <div
                    className={`status-segment-btn ${!isAdmin ? 'active' : ''}`}
                    onClick={() => setIsAdmin(false)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">Karyawan</span>
                    <span className="status-segment-sub">Hanya aplikasi HP</span>
                  </div>

                  <div
                    className={`status-segment-btn ${isAdmin ? 'active' : ''}`}
                    onClick={() => setIsAdmin(true)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="status-segment-title">Admin</span>
                    <span className="status-segment-sub">Dashboard + aplikasi HP</span>
                  </div>
                </div>
                {isAdmin && !initialIsAdmin && (
                  <span className="edit-field-hint">
                    Admin dapat membuka dashboard, melihat seluruh data absensi, mengubah dan menghapus karyawan, serta mengangkat admin lain.
                  </span>
                )}
                {!isAdmin && initialIsAdmin && (
                  <span className="edit-field-hint">
                    Hak admin akun ini akan dicabut. Anda tidak dapat mencabut hak admin akun sendiri.
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Action Buttons Row directly underneath the Left Card */}
          <div className="edit-actions-row">
            <button
              type="button"
              className="btn-edit-cancel"
              onClick={onBack}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-edit-save"
              onClick={handleSave}
            >
              <Check size={16} />
              <span>Simpan Perubahan</span>
            </button>
            {onDelete && (
              <button
                type="button"
                className="btn-edit-delete-emp"
                onClick={() => employee && onDelete(employee)}
                title="Hapus Karyawan ini"
              >
                <Trash2 size={16} />
                <span>Hapus Karyawan</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Photo Card */}
        <div className="edit-right-column">
          <div className="edit-photo-card">
            <div className="edit-avatar-circle">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name || 'Foto Karyawan'}
                  className="edit-avatar-img"
                />
              ) : (
                <div className="edit-avatar-placeholder">
                  {name.trim() ? name.trim().slice(0, 2).toUpperCase() : <User size={48} className="text-slate-400" />}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden-file-input"
              onChange={handlePhotoUpload}
            />

            <button
              type="button"
              className="btn-edit-upload-photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText size={16} />
              <span>Unggah Foto</span>
            </button>

            <button
              type="button"
              className="btn-edit-delete-photo"
              onClick={handleRemovePhoto}
            >
              Hapus Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { employeesData, updateEmployees, dataReady, setEmployeesView } = useAdmin();
  const employee = employeesData.find((e) => String(e.id) === id) ?? null;
  // Tunggu data pertama sebelum menyimpulkan karyawan tidak ada (buka langsung / muat ulang halaman ubah).
  if (!employee) return dataReady ? <Redirect to="/employees" /> : <SessionCheck />;
  return (
    <EditEmployeePage
      employee={employee}
      onBack={() => router.push('/employees')}
      onSave={async (updatedEmp) => {
        let res;
        try {
          res = await apiFetch(`/employees/${updatedEmp.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              fullName: updatedEmp.name,
              // Hanya dikirim bila diubah, supaya data cache lama tidak menimpa email di server.
              ...(updatedEmp.email && updatedEmp.email !== employee.email ? { email: updatedEmp.email } : {}),
              role: updatedEmp.role,
              employeeType: updatedEmp.type,
              phone: updatedEmp.phone,
              avatarUrl: updatedEmp.avatar,
              password: updatedEmp.password,
              // Hanya dikirim bila pilihannya diubah: data cache lama di browser tidak boleh
              // tanpa sengaja mencabut atau memberikan hak admin.
              ...(Boolean(updatedEmp.isAdmin) !== Boolean(employee.isAdmin)
                ? { isAdmin: Boolean(updatedEmp.isAdmin) }
                : {}),
            }),
          });
        } catch {
          throw new Error('Server tidak dapat dihubungi. Perubahan belum disimpan.');
        }
        const json: { message?: string; employee?: Partial<Employee> } = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || 'Gagal menyimpan perubahan.');
        }
        if (json.employee) {
          updateEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? { ...e, ...json.employee } : e)));
        }
        router.push('/employees');
      }}
      onDelete={(emp) => {
        // Modal konfirmasi hapus ada di daftar: state-nya di AdminProvider agar selamat dari perpindahan halaman.
        setEmployeesView((prev) => ({ ...prev, employeeToDelete: emp }));
        router.push('/employees');
      }}
    />
  );
}
